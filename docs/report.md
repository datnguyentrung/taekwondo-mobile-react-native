# ĐẶC TẢ HỆ THỐNG ANALYTICS QUẢN TRỊ TRUNG TÂM ĐÀO TẠO VÕ THUẬT

**Phiên bản:** 2.0
**Nền tảng:** Supabase PostgreSQL, Spring Boot, React
**Nguồn thiết kế:** Deep Research Report, `domain(1).zip`, `enums.zip`
**Mục tiêu:** Theo dõi tăng trưởng học viên, học viên nghỉ, tình hình lớp học, duy trì học viên, chất lượng đào tạo và hỗ trợ lập kế hoạch chiêu sinh, marketing.

---

# PHẦN I. NGUYÊN TẮC NGHIỆP VỤ

## 1. Mục tiêu quản trị

Hệ thống Analytics phải giúp ban lãnh đạo trả lời được năm nhóm câu hỏi:

1. **Điều gì đang xảy ra?** Trung tâm tăng hay giảm học viên, cơ sở nào tốt, lớp nào có vấn đề?
2. **Vì sao xảy ra?** Học viên nghỉ thuộc nhóm tuổi nào, lớp nào, đã học bao lâu, có dấu hiệu giảm đi tập không?
3. **Ảnh hưởng đến đâu?** Bao nhiêu học viên mất đi, lớp nào thiếu sĩ số, năng lực vận hành còn bao nhiêu?
4. **Cần hành động gì?** Liên hệ học viên có nguy cơ nghỉ, điều chỉnh lịch, mở lớp, tổ chức chiêu sinh?
5. **Hành động có hiệu quả không?** Sau một tháng hoặc một quý, số học viên mới, nghỉ và duy trì thay đổi thế nào?

Analytics phải hỗ trợ chuỗi:

**Phát hiện → Phân tích → Xem danh sách học viên → Hành động → Đo kết quả.**

## 2. Quy tắc mới: xác định ngày học viên nghỉ

### 2.1. Định nghĩa

Một học viên được tính là **học viên nghỉ theo trạng thái hiện tại** khi:

- `core.person.status = INACTIVE`.
- Có ít nhất một `training.student_enrollment.end_date` không null.
- Ngày nghỉ thống kê được lấy bằng `MAX(student_enrollment.end_date)` của học viên đó.

Công thức:

`inferred_leave_date = MAX(se.end_date)` nếu `p.status = INACTIVE`; ngược lại là `NULL`.

Tên trường trong Analytics nên là `inferredLeaveDate` để phân biệt với ngày nghỉ thực tế được xác nhận.

### 2.2. SQL chuẩn

```sql
WITH enrollment_summary AS (
    SELECT
        se.student_person_id,
        MAX(se.end_date) AS last_enrollment_end_date,
        COUNT(*) AS enrollment_count,
        COUNT(*) FILTER (
            WHERE se.end_date IS NULL
        ) AS open_end_enrollment_count
    FROM training.student_enrollment se
    GROUP BY se.student_person_id
)
SELECT
    p.person_id,
    p.person_code,
    p.full_name,
    p.status,
    es.last_enrollment_end_date,
    CASE
        WHEN p.status::text = 'INACTIVE'
        THEN es.last_enrollment_end_date
        ELSE NULL
    END AS inferred_leave_date,
    es.enrollment_count,
    es.open_end_enrollment_count
FROM core.person p
LEFT JOIN enrollment_summary es
    ON es.student_person_id = p.person_id
WHERE p.person_code LIKE '%VQ_chaunm_130912%';
```

### 2.3. Quy tắc đếm học viên nghỉ theo tháng

Ví dụ: một học viên có ba enrollment:

| Enrollment | Start | End |
|---|---|---|
| 1 | 01/01/2026 | 31/01/2026 |
| 2 | 01/02/2026 | 28/02/2026 |
| 3 | 01/03/2026 | 31/03/2026 |

Nếu `person.status = INACTIVE`, học viên được tính nghỉ ngày **31/03/2026**, không tính nghỉ ở tháng 1 hoặc tháng 2.

Nếu `person.status = ACTIVE`, không tính học viên này vào nhóm nghỉ, dù các enrollment cũ đã kết thúc.

Nếu `person.status = SUSPENDED`, cũng không tính là nghỉ hẳn.

SQL thống kê:

```sql
WITH last_enrollment AS (
    SELECT
        student_person_id,
        MAX(end_date) AS last_end_date
    FROM training.student_enrollment
    GROUP BY student_person_id
)
SELECT
    date_trunc('month', le.last_end_date)::date
        AS month,
    COUNT(DISTINCT p.person_id) AS left_students
FROM core.person p
JOIN last_enrollment le
    ON le.student_person_id = p.person_id
WHERE p.status::text = 'INACTIVE'
  AND le.last_end_date IS NOT NULL
  AND le.last_end_date BETWEEN :from_date AND :to_date
  AND le.last_end_date <= :as_of_date
GROUP BY 1
ORDER BY 1;
```

### 2.4. Trường hợp ngoại lệ

| Trường hợp | Xử lý |
|---|---|
| `INACTIVE`, có `end_date` | Dùng ngày cuối cùng |
| `INACTIVE`, không có enrollment | Chưa xác định ngày nghỉ |
| `INACTIVE`, mọi `end_date` null | Chưa xác định ngày nghỉ |
| `ACTIVE`, có enrollment đã hết hạn | Không tính nghỉ |
| `SUSPENDED` | Theo dõi riêng |
| `INACTIVE`, `end_date` trong tương lai | Đánh dấu bất thường, chưa tính là đã nghỉ |
| `INACTIVE`, còn enrollment mở với `end_date IS NULL` | Đánh dấu xung đột dữ liệu |
| Enrollment import có ngày giả định | Đánh dấu dữ liệu suy luận, không coi là lịch sử đã xác minh |

**Giới hạn quan trọng:** Nếu một học viên đã nghỉ trong quá khứ nhưng hiện tại quay lại và có status `ACTIVE`, quy tắc này không còn ghi nhận lần nghỉ trước. Vì vậy, nó phù hợp để làm **MVP theo trạng thái hiện tại**, nhưng chưa thay thế được lịch sử sự kiện nghỉ/quay lại đầy đủ.

### 2.5. Các field Analytics cần bổ sung ở tầng DTO

Không nhất thiết phải thêm cột vào `core.person`. Có thể tính bằng SQL view hoặc analytics query.

| Field | Kiểu | Ý nghĩa |
|---|---|---|
| `personId` | UUID | Định danh học viên |
| `personStatus` | String | Trạng thái hiện tại |
| `lastEnrollmentEndDate` | Date | End date lớn nhất |
| `inferredLeaveDate` | Date/null | Ngày nghỉ suy luận |
| `leaveDateSource` | String | `LAST_ENROLLMENT_END_DATE` |
| `leaveDateQuality` | String | Độ tin cậy của ngày nghỉ |
| `enrollmentCount` | Integer | Số enrollment |
| `openEndEnrollmentCount` | Integer | Số enrollment không có end date |

`leaveDateQuality` là giá trị phân loại **đề xuất tại analytics layer**, không phải enum hiện có trong `enums.zip`.

Các giá trị đề xuất: `DERIVED`, `MISSING_END_DATE`, `FUTURE_END_DATE`, `OPEN_ENROLLMENT_CONFLICT`, `MIGRATION_PROVISIONAL`.

---

# PHẦN II. BẢN ĐỒ DOMAIN VÀ ENUM

## 3. Domain nguồn

| Domain | Bảng | Thuộc tính sử dụng |
|---|---|---|
| Core | `core.person` | `person_id`, `person_code`, `full_name`, `gender`, `birth_date`, `current_belt`, `status`, `start_date`, `position_id` |
| Core | `core.branch` | `branch_id`, `name`, `opened_date`, `status` |
| Catalog | `catalog.class_schedule` | `schedule_id`, `branch_id`, `weekday`, `location`, `status`, `start_time`, `end_time` |
| Catalog | `catalog.course` | `course_id`, `name`, `level`, `capacity`, `status`, `class_session_generated_until` |
| Catalog | `catalog.course_schedule` | `course_id`, `class_schedule_id`, `start_date`, `end_date`, `status`, `session_type` |
| Catalog | `catalog.training_plan` | `level`, `duration_months`, `included_session_count`, `base_price`, `final_price`, `status` |
| Catalog | `catalog.training_plan_requirement` | `training_plan_id`, `session_type`, `sessions_per_week` |
| Catalog | `catalog.training_plan_access_rule` | `training_plan_id`, `target_course_id`, `session_type` |
| Catalog | `catalog.training_plan_addon` | `extra_sessions_per_week`, `price`, `status` |
| Training | `training.student_enrollment` | `student_person_id`, `course_purchase_id`, `start_date`, `end_date`, `status` |
| Training | `training.student_enrollment_schedule` | `student_enrollment_id`, `course_schedule_id`, `effective_from`, `effective_to`, `status` |
| Training | `training.enrollment_schedule_change_request` | Lịch hiện tại, lịch đích, ngày hiệu lực, trạng thái và người duyệt |
| Training | `training.class_session` | Khóa, lịch, ngày, giờ, trạng thái, đóng điểm danh |
| Training | `training.student_session_booking` | Enrollment, session, nguồn booking, trạng thái, thời điểm booking/cancel/settle |
| Training | `training.session_attendance` | Enrollment, session, check-in, trạng thái điểm danh, đánh giá |
| Training | `training.leave_request` | Học viên, buổi nghỉ, buổi bù, ngày nghỉ, trạng thái |
| Training | `training.course_staff_assignment` | HLV, course schedule, vai trò, ngày hiệu lực, trạng thái |
| Training | `training.coach_timesheet` | Assignment, session, check-in/out |
| Training | `training.belt_exam` | Học viên, đai trước/đai mục tiêu, kỳ thi, ngày, kết quả, loại thi |
| Skill | `skill.fitness_record` | Học viên, bài thể lực, ngày, thời lượng, HLV |
| Skill | `skill.fitness` | Level, số lượng, thời lượng |
| Finance | `finance.course_purchase` | Học viên, gói học, giao dịch ghi nợ |
| Finance | `finance.wallet` | Học viên, số dư, trạng thái |
| Finance | `finance.wallet_transaction` | Loại, chiều, số tiền, số dư trước/sau, trạng thái, thời điểm |
| Finance | `finance.wallet_top_up_request` | Hình thức, trạng thái, số tiền, thời điểm |
| Notification | `notification.notification*` | Loại, người nhận, gửi/đọc/trạng thái |
| Security | `security.users` và role/permission | User, vai trò, quyền, trạng thái |

Những tên thuộc tính cụ thể chưa được báo cáo gốc xác nhận, ví dụ FK chính xác của staff assignment, cần kiểm tra lại Java entity trước khi viết repository SQL.

## 4. Enum quan trọng

| Enum | Giá trị hoặc nhóm giá trị | Mục đích |
|---|---|---|
| `PersonStatus` | `ACTIVE`, `INACTIVE`, `SUSPENDED` | Phân loại trạng thái học viên |
| `Belt` | `C10…C1`, `D1…D10` | Phân tích đai |
| `BranchStatus` | `OPERATING`, `CLOSED`, `MAINTENANCE` | Trạng thái cơ sở |
| `ScheduleLevel` | `BASIC`, `ADVANCED`, `EXPERT` | Trình độ khóa/gói |
| `StudentEnrollmentStatus` | `PENDING_START`, `ACTIVE`, `COMPLETED`, `EXPIRED`, `CANCELLED` | Vòng đời enrollment |
| `EnrollmentScheduleStatus` | `ACTIVE`, `ENDED` | Thời gian tham gia lịch |
| `ScheduleStatus` | Theo enum hiện có | Trạng thái lịch |
| `SessionType` | `REQUIRED`, `STANDARD` | Loại buổi học |
| `SessionStatus` | `SCHEDULED`, `ACTIVE`, `COMPLETED`, `TERMINATED`, `CANCELLED`, `POSTPONED` | Vòng đời buổi học |
| `BookingSource` | `RECURRING`, `MAKEUP`, `ADMIN` | Nguồn đặt buổi |
| `BookingStatus` | Theo enum hiện có | Trạng thái booking |
| `AttendanceStatus` | `PRESENT`, `ABSENT`, `EXCUSED`, `MAKEUP`, `LATE` | Điểm danh |
| `EvaluationStatus` | `GOOD`, `AVERAGE`, `WEAK`, `PENDING` | Đánh giá |
| `BeltExamResult` | `PASSED`, `FAILED`, `ABSENT`, `PENDING` | Kết quả thi đai |
| `BeltExamType` | `PROMOTION`, `MOCK` | Loại kỳ thi |
| `WalletTransactionStatus` | `PENDING`, `PROCESSING`, `APPROVED`, `REJECTED` | Kiểm soát giao dịch |
| `WalletTransactionDirection` | `CREDIT`, `DEBIT` | Chiều giao dịch |
| `SystemRoleDefinition` | `SUPER_ADMIN`, `SYSTEM_ADMIN`, `GUARDIAN`, `FINANCE_STAFF` | Phân quyền |

**Nguyên tắc:** Không tạo thêm giá trị enum chỉ để phục vụ chart nếu chưa thay đổi domain. Các phân loại như `CHURN`, `REACTIVATION`, `AT_RISK` trước mắt là **analytics-derived categories**.

---

# PHẦN III. ĐỊNH NGHĨA KPI CHUẨN

## 5. Các chỉ số học viên

### 5.1. New Students

Số học viên có enrollment hợp lệ đầu tiên trong kỳ thống kê.

`firstEnrollmentStartDate = MIN(valid_enrollment.start_date)`

Đếm distinct `student_person_id`, không đếm số enrollment.

Cần loại enrollment kỹ thuật/migration không phản ánh lịch sử thực tế.

### 5.2. Inactive Students / Inferred Leavers

Số học viên có:

- `person.status = INACTIVE`.
- `inferredLeaveDate` nằm trong kỳ.
- `inferredLeaveDate <= asOfDate`.
- Không có lỗi dữ liệu nghiêm trọng theo quy tắc chất lượng.

Đây là **số nghỉ suy luận theo trạng thái hiện tại**, không phải lịch sử churn hoàn chỉnh.

### 5.3. Reactivated Students

Học viên có enrollment mới sau một khoảng gián đoạn, và trước đó đã từng có enrollment.

Khoảng gián đoạn mặc định đề xuất: 30 ngày. Đây là cấu hình nghiệp vụ, không phải field có sẵn.

### 5.4. Net Student Movement

`Net = New + Reactivated - Inferred Leavers`

Chuyển lớp và chuyển cơ sở nội bộ không làm tăng/giảm tổng số học viên toàn hệ thống.

### 5.5. Active Students As-of

Số học viên có enrollment hợp lệ tại ngày được chọn, sau khi áp dụng quy tắc trạng thái và thời gian hiệu lực.

Không chỉ sử dụng `person.status` hiện tại để dựng snapshot lịch sử.

### 5.6. Retention Rate

`Retention = số học viên đầu kỳ còn tiếp tục học cuối kỳ / số học viên đầu kỳ`

Cần dữ liệu enrollment lịch sử đáng tin cậy.

### 5.7. Renewal Rate

`Renewal Rate = số enrollment hết hạn có enrollment tiếp theo trong grace period / số enrollment đủ điều kiện gia hạn`

Một học viên có thể có nhiều enrollment; phải xác định có tính theo lượt gia hạn hay theo học viên.

### 5.8. Attendance Rate

`Attendance Rate = số buổi có attendance hợp lệ / số buổi dự kiến phải tham gia`

Các trạng thái `PRESENT`, `LATE`, `MAKEUP`, `EXCUSED` phải có quy tắc rõ về tử số và mẫu số. Đề xuất mặc định:

- Đi học thực tế: `PRESENT`, `LATE`, `MAKEUP`.
- Nghỉ có phép: `EXCUSED`, theo dõi riêng.
- Nghỉ không phép: `ABSENT`.
- Buổi `CANCELLED`, `POSTPONED` không đưa vào mẫu số nếu không phải buổi đã diễn ra.

### 5.9. Class Fill Rate

`Fill Rate = số học viên active thuộc lớp / sức chứa lớp`

Domain có `catalog.course.capacity`; cần xác nhận capacity này đại diện cho từng lớp hay toàn khóa. Nếu chỉ là capacity toàn course, không được mặc định coi đó là sức chứa của từng `course_schedule`.

### 5.10. Age at Event

Tuổi tại thời điểm nhập học hoặc nghỉ, không phải tuổi tại thời điểm mở dashboard.

`ageAtEvent = số năm tròn giữa birth_date và event_date`

### 5.11. Belt at Event

`person.current_belt` chỉ là đai hiện tại.

Để có đai chính xác tại thời điểm nghỉ cần lịch sử đai từ `training.belt_exam` hoặc bảng lịch sử chuyên biệt. Nếu không đủ dữ liệu, phải ghi rõ chart dùng **current belt**, không ghi là **belt at leave**.

---

# PHẦN IV. CẤU TRÚC PAGE ANALYTICS

## 6. Information Architecture

```text
Analytics
├── Executive Overview
├── Students
│   ├── Growth & Movement
│   ├── Retention & Churn
│   └── Attendance & Risk
├── Classes
│   ├── Class Health
│   └── Coach Operations
├── Recruitment
│   └── Seasonality
├── Programs
│   ├── Courses & Training Plans
│   └── Belt & Development
├── Branches
│   └── Branch Performance
└── Finance
    └── Commercial Analytics
```

## 7. Page 01 — Executive Overview

**Mục tiêu:** Ban lãnh đạo nhìn trong 30 giây để biết hệ thống đang tăng trưởng hay suy giảm.

**Câu hỏi quản trị:**

- Tổng số học viên đang học là bao nhiêu?
- Tháng này có bao nhiêu học viên mới và nghỉ?
- Cơ sở nào có mức giảm lớn nhất?
- Lớp nào có tỷ lệ nghỉ bất thường?
- Bao nhiêu học viên có nguy cơ nghỉ?
- Bao nhiêu enrollment sắp hết hạn?
- Tỷ lệ đi học đang tăng hay giảm?

**KPI:** `activeStudents`, `newStudents`, `reactivatedStudents`, `inferredLeavers`, `netMovement`, `retentionRate`, `attendanceRate`, `atRiskStudents`, `renewalsDue`, `averageFillRate`.

**Biểu đồ:** KPI cards, trend 12 tháng, heatmap cơ sở, top lớp giảm mạnh, top lớp tăng mạnh, danh sách cảnh báo.

**Filter:** kỳ thống kê, cơ sở, course level, khóa, gói, tuổi, giới tính, đai.

**Domain:** `person`, `student_enrollment`, `student_enrollment_schedule`, `course_schedule`, `class_schedule`, `branch`, `class_session`, `session_attendance`.

**Hành động:** Click KPI nghỉ → danh sách học viên; click lớp cảnh báo → Class Health.

## 8. Page 02 — Student Growth & Movement

**Mục tiêu:** Thay thế và mở rộng bảng Excel tăng/giảm học viên theo tháng và độ tuổi.

**Câu hỏi:**

- Tháng nào có nhiều học viên mới nhất?
- Tháng nào có nhiều học viên nghỉ nhất?
- Nhóm tuổi nào đang giảm?
- Nam và nữ có xu hướng khác nhau không?
- Học viên nghỉ tập trung ở cơ sở, lớp, khóa nào?
- Có bao nhiêu học viên quay lại?
- Có bao nhiêu trường hợp chuyển lớp hoặc chuyển cơ sở?

**KPI:** new, inferred leavers, reactivated, transfer in/out, net movement.

**Biểu đồ:** New vs Left theo tháng; heatmap tháng × tuổi; tháng × giới tính; tháng × đai; tháng × cơ sở; tháng × lớp; waterfall tăng/giảm.

**Drill-down:** Click ô “Tháng 7, tuổi 12, nghỉ 8” → danh sách 8 học viên → enrollment cuối, khóa/lớp cuối, ngày nghỉ suy luận.

**Domain:** `core.person`, `training.student_enrollment`, `training.student_enrollment_schedule`, `catalog.course_schedule`, `catalog.course`, `catalog.class_schedule`, `core.branch`.

**Định nghĩa nghỉ:** Chỉ dùng `person.status = INACTIVE` và `MAX(enrollment.end_date)` theo quy tắc Phần I.

## 9. Page 03 — Retention & Churn

**Mục tiêu:** Đánh giá khả năng duy trì học viên và phát hiện nhóm có tỷ lệ nghỉ cao.

**Câu hỏi:**

- Học viên thường học bao lâu trước khi nghỉ?
- Bao nhiêu người nghỉ sau tháng đầu?
- Nhóm tuổi nào duy trì tốt nhất?
- Gói 1 tháng, 3 tháng hay dài hơn có tỷ lệ gia hạn tốt hơn?
- Lớp nào có nhiều học viên hết hạn không gia hạn?
- Học viên nghỉ có từng giảm tần suất đi tập không?

**KPI:** cohort retention M1/M2/M3/M6/M12, renewal rate, median tenure, early departure, non-renewal, reactivation.

**Biểu đồ:** Cohort retention matrix, survival curve, churn theo thời gian học, tuổi, giới tính, đai, cơ sở, lớp, gói.

**Lưu ý:** `INACTIVE + last endDate` cho biết lần nghỉ cuối theo trạng thái hiện tại, không tái dựng được toàn bộ các lần nghỉ trong quá khứ. Vì vậy MVP phải ghi nhãn `Inferred Leavers`; chỉ dùng thuật ngữ `Confirmed Churn` khi có event history hoặc quy tắc xác minh bổ sung.

**Domain:** person, enrollment, course purchase, training plan, attendance, schedule.

## 10. Page 04 — Class Health

**Mục tiêu:** Giúp quản lý biết lớp nào cần chiêu sinh, giữ học viên, đổi lịch hoặc điều chỉnh vận hành.

**Câu hỏi:**

- Sĩ số từng lớp hiện tại là bao nhiêu?
- Lớp nào tăng/giảm trong 30 ngày?
- Lớp nào có nhiều học viên `INACTIVE` với enrollment cuối thuộc lớp đó?
- Bao nhiêu học viên chuyển lớp?
- Lớp nào còn khả năng tiếp nhận?
- Tỷ lệ đi học và số học viên nguy cơ cao là bao nhiêu?

**KPI:** active roster, new students, inferred leavers, transfer in/out, attendance rate, capacity/fill rate, risk count.

**Biểu đồ:** Class leaderboard, class × month heatmap, trend sĩ số, scatter fill rate × attendance rate, bảng lớp cảnh báo.

**Quy tắc gán lớp khi nghỉ:** Ưu tiên `student_enrollment_schedule` còn hiệu lực tại `inferredLeaveDate`. Nếu không có lịch hiệu lực đúng ngày, lấy lịch gần nhất trước ngày đó trong enrollment cuối và đánh dấu `LAST_KNOWN_SCHEDULE`.

**Domain:** `course_schedule`, `course`, `class_schedule`, `student_enrollment_schedule`, `student_enrollment`, `person`, `branch`, `session_attendance`.

## 11. Page 05 — Attendance & Risk

**Mục tiêu:** Phát hiện sớm học viên có nguy cơ nghỉ trước khi chuyển sang `INACTIVE`.

**Câu hỏi:**

- Ai nghỉ hai buổi liên tiếp?
- Ai không đi học trong 14 ngày?
- Tỷ lệ attendance 30 ngày gần nhất giảm bao nhiêu?
- Lớp nào có attendance thấp?
- Học viên nào có nhiều đơn nghỉ hoặc booking bị hủy?

**KPI:** attendance rate, consecutive absences, days since last attendance, attendance trend, risk student count.

**Biểu đồ:** Attendance heatmap, risk segmentation, attendance trend, bảng học viên cần liên hệ.

**Quy tắc risk đề xuất:**

- High: ít nhất 2 buổi `ABSENT` liên tiếp, hoặc không có attendance trong ít nhất 14 ngày, hoặc attendance 30 ngày giảm ít nhất 50%.
- Medium: attendance thấp hơn ngưỡng cấu hình.
- Low: không thỏa các điều kiện trên.

Đây là business rules mới, không phải enum trong domain.

**Domain:** `class_session`, `student_session_booking`, `session_attendance`, `leave_request`, enrollment, person.

## 12. Page 06 — Recruitment & Seasonality

**Mục tiêu:** Xác định thời điểm, địa điểm và phân khúc phù hợp để tổ chức chiêu sinh.

**Câu hỏi:**

- Tháng nào thường có nhiều học viên mới?
- Nhóm tuổi nào vào nhiều theo từng mùa?
- Cơ sở nào có nhu cầu tuyển sinh tốt?
- Lớp nào đang thiếu sĩ số?
- Nên ưu tiên tuyển sinh cho khóa nào?
- Mùa nghỉ cao có trùng với mùa nhập học không?

**KPI:** first-time enrollment, monthly acquisition, age distribution, branch demand, available seats, year-over-year growth nếu có đủ lịch sử.

**Biểu đồ:** Month × Age heatmap, Month × Branch heatmap, seasonality trend, capacity opportunity matrix, New vs Left.

**Giới hạn:** Domain hiện chưa có `lead`, `campaign`, `campaign_cost`, `trial_booking`, `acquisition_attribution`. Chưa thể tính CAC, CPL, ROAS hoặc tỷ lệ chuyển đổi marketing thực.

**Domain:** person, enrollment, schedule, course, branch, training plan.

## 13. Page 07 — Courses & Training Plans

**Mục tiêu:** Đánh giá sức hút, hiệu quả sử dụng và khả năng gia hạn của từng khóa/gói.

**Câu hỏi:**

- Gói nào được chọn nhiều nhất?
- Gói nào có tỷ lệ gia hạn tốt?
- Học viên sử dụng bao nhiêu buổi so với quyền lợi?
- Gói nào có nhiều học viên nghỉ sau khi hết hạn?
- Add-on nào được sử dụng nhiều?

**KPI:** plan mix, purchase count, renewal rate, session utilization, addon usage, inferred leavers by plan.

**Biểu đồ:** Plan comparison, plan duration mix, renewal trend, included vs used sessions.

**Domain:** training plan, requirement, access rule, addon, course purchase, enrollment, booking, attendance.

**Giới hạn:** Các `course_purchase` tạo kỹ thuật để import không phải giao dịch thương mại thật.

## 14. Page 08 — Branch Performance

**Mục tiêu:** So sánh hiệu quả hoạt động giữa các cơ sở.

**Câu hỏi:**

- Cơ sở nào có nhiều học viên nhất?
- Cơ sở nào tăng trưởng tốt?
- Cơ sở nào có nhiều học viên nghỉ?
- Lớp nào tại cơ sở đang thiếu sĩ số?
- Cơ sở nào có attendance thấp?
- Có hiện tượng chuyển học viên giữa các cơ sở không?

**KPI:** active students, new, inferred leavers, net movement, attendance rate, fill rate, transfer in/out.

**Biểu đồ:** Branch scorecard, branch × month heatmap, ranking, transfer matrix.

**Domain:** branch, class schedule, course schedule, enrollment schedule, enrollment, person, attendance.

## 15. Page 09 — Coach & Teaching Operations

**Mục tiêu:** Theo dõi phân công HLV, mức độ thực hiện buổi học và chất lượng vận hành.

**Câu hỏi:**

- HLV nào đang phụ trách nhiều lớp?
- Buổi nào chưa có timesheet?
- HLV nào có nhiều buổi thiếu check-in/out?
- Các lớp do HLV phụ trách có attendance thế nào?
- Có sự thay đổi bất thường về đánh giá học viên không?

**KPI:** assigned sessions, completed sessions, timesheet coverage, attendance rate by assigned class, evaluation distribution.

**Biểu đồ:** Coach workload, timesheet completeness, session trend, evaluation breakdown.

**Domain:** `course_staff_assignment`, `coach_timesheet`, `class_session`, `session_attendance`, `course_schedule`.

**Lưu ý:** Không được kết luận HLV gây ra churn chỉ vì lớp có nhiều học viên nghỉ; đây chỉ là tín hiệu cần kiểm tra.

## 16. Page 10 — Belt & Student Development

**Mục tiêu:** Đo chất lượng đào tạo và sự tiến bộ của học viên.

**Câu hỏi:**

- Phân bố học viên theo đai?
- Bao nhiêu học viên dự thi và đỗ?
- Nhóm nào tiến bộ chậm?
- Attendance có liên quan đến kết quả thi đai không?
- Học viên đã hoàn thành các bài thể lực nào?

**KPI:** belt distribution, exam attempts, pass rate, fitness participation, fitness completion.

**Biểu đồ:** Belt pyramid, exam result trend, fitness distribution, development by age/branch.

**Domain:** `person.current_belt`, `belt_exam`, `fitness_record`, `fitness`, attendance.

**Giới hạn:** Phân tích đai tại thời điểm quá khứ cần lịch sử thi/đổi đai đầy đủ.

## 17. Page 11 — Finance & Commercial Analytics

**Mục tiêu:** Theo dõi dòng tiền và hiệu quả thương mại của gói học.

**Câu hỏi:**

- Tổng giá trị giao dịch thực được duyệt?
- Gói nào đóng góp nhiều nhất?
- Bao nhiêu giao dịch hoàn tiền?
- Xu hướng nạp ví và mua gói?
- Doanh thu phân bổ theo cơ sở ra sao?

**KPI:** approved transaction amount, plan purchase amount, top-up, refund, ARPU/ARPPU khi dữ liệu đủ sạch.

**Biểu đồ:** Financial trend, plan revenue mix, transaction status, refund trend.

**Domain:** wallet, wallet transaction, course purchase, training plan, top-up request.

**Quy tắc bắt buộc:** Loại các transaction `PENDING`, giao dịch kỹ thuật 1 VND và các purchase migration khỏi doanh thu. Chỉ tính các giao dịch thực sự hợp lệ theo type/direction/status. `APPROVED` là điều kiện cần, nhưng vẫn phải kiểm tra nguồn và ý nghĩa giao dịch.

---

# PHẦN V. ĐẶC TẢ API CHI TIẾT

## 18. Quy ước chung

Các endpoint bên dưới là **API thiết kế cho hệ thống**, không có nghĩa đã tồn tại trong Spring Boot.

Ký hiệu:

- **[DR]**: Đã được nêu trong báo cáo Deep Research, ở dạng endpoint hoặc luồng API.
- **[NEW]**: Đề xuất bổ sung để hoàn thiện các page.
- **Derived**: Thuộc tính tính toán ở Analytics, không phải cột DB.
- **Nullable**: Có thể không có dữ liệu hoặc chưa đủ điều kiện tính.

Quy ước dữ liệu:

- Date: `YYYY-MM-DD`.
- Month: `YYYY-MM`.
- ID: UUID hoặc kiểu ID thực tế của entity.
- Count: integer.
- Rate: decimal từ 0 đến 1.
- Money: decimal theo đơn vị VND.
- Các danh sách drill-down phải hỗ trợ phân trang.

Mọi API phải được backend áp dụng authorization và giới hạn dữ liệu theo cơ sở. Không cho phép frontend tự truyền branch ID để vượt phạm vi quyền truy cập.

## A01. Executive Overview [DR]

**Endpoint:** `GET /api/admin/analytics/overview`

**Tác dụng:** Tải dữ liệu tổng hợp cho toàn bộ page Executive Overview.

**Request:** `from`, `to`, `asOf`, `branchIds`, `courseIds`, `trainingPlanIds`, `levels`, `genders`, `minAge`, `maxAge`, `belts`.

**Response:**

- `summary`: `activeStudents`, `newStudents`, `reactivatedStudents`, `inferredLeavers`, `netMovement`, `retentionRate`, `attendanceRate`, `atRiskStudents`, `renewalsDue`, `averageFillRate`, `approvedRevenue` (nullable).
- `monthlyTrend[]`: `month`, `newStudents`, `reactivatedStudents`, `inferredLeavers`, `netMovement`, `activeStudents`.
- `branchMatrix[]`: `branchId`, `branchName`, `activeStudents`, `newStudents`, `inferredLeavers`, `attendanceRate`, `riskCount`.
- `classAlerts[]`: `courseScheduleId`, `courseName`, `branchName`, `activeRoster`, `inferredLeavers`, `attendanceRate`, `warningCodes`.
- `dataQuality`: `excludedMigrationRecords`, `missingLeaveDates`, `provisionalEnrollmentCount`.

**Domain:** `core.person`, `core.branch`, `training.student_enrollment`, `training.student_enrollment_schedule`, `catalog.course_schedule`, `catalog.class_schedule`, `catalog.course`, `training.class_session`, `training.session_attendance`, finance nếu bật KPI tài chính.

**Enum:** PersonStatus, StudentEnrollmentStatus, EnrollmentScheduleStatus, SessionStatus, AttendanceStatus, ScheduleLevel.

**Drill-down:** A12, A13, A16.

## A02. Student Growth & Movement [DR]

**Endpoint:** `GET /api/admin/analytics/student-movements`

**Tác dụng:** Trả dữ liệu tổng hợp cho các chart tăng/giảm theo nhiều dimension.

**Request:** `from`, `to`, `asOf`, `branchIds`, `courseIds`, `courseScheduleIds`, `genders`, `minAge`, `maxAge`, `belts`, `levels`, `groupBy`.

**Response:**

- `summary`: `newStudents`, `reactivatedStudents`, `inferredLeavers`, `transferIn`, `transferOut`, `netMovement`.
- `monthly[]`: `month`, `newStudents`, `reactivatedStudents`, `inferredLeavers`, `transferIn`, `transferOut`, `netMovement`.
- `byAge[]`: `age`, `newStudents`, `inferredLeavers`, `netMovement`.
- `byGender[]`: `gender`, `newStudents`, `inferredLeavers`, `netMovement`.
- `byBelt[]`: `belt`, `newStudents`, `inferredLeavers`, `netMovement`, `beltBasis`.
- `byBranch[]`: `branchId`, `branchName`, `newStudents`, `inferredLeavers`, `netMovement`.
- `byClass[]`: `courseScheduleId`, `courseName`, `scheduleLabel`, `newStudents`, `inferredLeavers`, `transferIn`, `transferOut`.
- `quality`: `unknownLeaveDateCount`, `provisionalDateCount`, `historicalStatusLimitation`.

**Domain:** `person.person_id/person_code/full_name/status/birth_date/gender/current_belt`, `student_enrollment.student_person_id/start_date/end_date/status`, `student_enrollment_schedule.effective_from/effective_to`, course, class schedule, branch.

**Enum:** PersonStatus, Belt, StudentEnrollmentStatus, EnrollmentScheduleStatus, ScheduleLevel.

**Drill-down:** A13.

## A03. Retention & Churn [DR]

**Endpoint:** `GET /api/admin/analytics/retention`

**Tác dụng:** Phân tích thời gian duy trì, gia hạn và học viên nghỉ suy luận.

**Request:** `from`, `to`, `asOf`, `branchIds`, `courseIds`, `trainingPlanIds`, `genders`, `minAge`, `maxAge`, `graceDays`, `cohortGranularity`.

**Response:**

- `summary`: `eligibleStudents`, `inferredLeavers`, `inferredLeaveRate`, `renewalRate`, `medianTenureDays`, `reactivationCount`, `earlyDepartureCount`.
- `cohorts[]`: `cohortMonth`, `initialStudents`, `m1`, `m2`, `m3`, `m6`, `m12`, `dataComplete`.
- `byTenure[]`: `tenureBand`, `studentCount`, `inferredLeavers`.
- `bySegment[]`: `dimension`, `dimensionValue`, `studentCount`, `inferredLeavers`, `rate`.
- `expiries[]`: `month`, `dueEnrollments`, `renewedEnrollments`, `notRenewedEnrollments`, `pendingWithinGrace`.
- `quality`: `historicalStatusAvailable`, `provisionalDateCount`, `missingHistoryCount`.

**Domain:** person, student enrollment, course purchase, training plan, enrollment schedule.

**Enum:** PersonStatus, StudentEnrollmentStatus, TrainingPlanStatus.

**Lưu ý:** `inferredLeaveRate` phải được ghi nhãn rõ; không tự đồng nhất với confirmed churn rate.

**Drill-down:** A15.

## A04. Class Health [DR]

**Endpoint:** `GET /api/admin/analytics/classes`

**Tác dụng:** Tải danh sách và chỉ số sức khỏe của tất cả lớp trong phạm vi quản lý.

**Request:** `from`, `to`, `asOf`, `branchIds`, `courseIds`, `levels`, `scheduleStatuses`, `sortBy`, `sortDirection`.

**Response:**

- `summary`: `totalClasses`, `classesWithDecline`, `classesAtRisk`, `totalActiveRoster`, `averageAttendanceRate`.
- `classes[]`: `courseScheduleId`, `courseId`, `courseName`, `classScheduleId`, `branchId`, `branchName`, `weekday`, `startTime`, `endTime`, `scheduleStatus`, `capacity`, `capacityBasis`, `activeRoster`, `newStudents`, `inferredLeavers`, `transferIn`, `transferOut`, `netMovement`, `attendanceRate`, `fillRate`, `atRiskStudents`, `warningCodes`.
- `monthlyTrend[]`: `month`, `courseScheduleId`, `activeRoster`, `newStudents`, `inferredLeavers`, `attendanceRate`.

**Domain:** course, course schedule, class schedule, branch, enrollment, enrollment schedule, session, attendance.

**Enum:** ScheduleStatus, CourseStatus, ScheduleLevel, EnrollmentScheduleStatus, AttendanceStatus.

**Drill-down:** A16, A17.

## A05. Attendance & Risk [NEW]

**Endpoint:** `GET /api/admin/analytics/attendance-risk`

**Tác dụng:** Tải tổng hợp điểm danh và phân bố nguy cơ nghỉ.

**Request:** `from`, `to`, `asOf`, `branchIds`, `courseScheduleIds`, `courseIds`, `minAge`, `maxAge`, `riskLevels`.

**Response:**

- `summary`: `expectedAttendances`, `presentCount`, `lateCount`, `makeupCount`, `absentCount`, `excusedCount`, `attendanceRate`, `highRiskStudents`, `mediumRiskStudents`.
- `byClass[]`: `courseScheduleId`, `courseName`, `expectedAttendances`, `attendanceRate`, `highRiskCount`.
- `weeklyTrend[]`: `weekStart`, `attendanceRate`, `absentCount`, `excusedCount`.
- `riskReasons[]`: `reasonCode`, `studentCount`.
- `thresholds`: `consecutiveAbsenceLimit`, `daysWithoutAttendanceLimit`, `attendanceDropThreshold`.

**Domain:** class session, student session booking, session attendance, leave request, enrollment, person.

**Enum:** SessionStatus, BookingSource, BookingStatus, AttendanceStatus, LeaveRequestStatus.

**Drill-down:** A18.

## A06. Recruitment & Seasonality [NEW]

**Endpoint:** `GET /api/admin/analytics/recruitment`

**Tác dụng:** Phân tích mùa tuyển sinh và cơ hội tiếp nhận học viên.

**Request:** `from`, `to`, `branchIds`, `courseIds`, `levels`, `genders`, `minAge`, `maxAge`, `comparePreviousYear`.

**Response:**

- `summary`: `firstTimeStudents`, `reactivatedStudents`, `averageMonthlyIntake`, `peakMonth`, `availableSeats` (nullable nếu thiếu capacity lớp).
- `monthly[]`: `month`, `firstTimeStudents`, `reactivatedStudents`, `inferredLeavers`, `netMovement`.
- `byAge[]`: `month`, `age`, `firstTimeStudents`.
- `byBranch[]`: `month`, `branchId`, `branchName`, `firstTimeStudents`.
- `byClass[]`: `courseScheduleId`, `courseName`, `branchName`, `firstTimeStudents`, `activeRoster`, `availableSeats`.
- `yearComparison[]`: `calendarMonth`, `currentYearCount`, `previousYearCount`, `growthRate`.
- `dataAvailability`: `hasCampaignData`, `hasLeadData`, `hasTrialData`, `hasAdSpendData`.

**Domain:** person, enrollment, enrollment schedule, class schedule, course, branch, training plan.

**Enum:** PersonStatus, ScheduleLevel, CourseStatus, BranchStatus.

**Giới hạn:** Không trả CAC/ROAS dưới dạng số thật nếu chưa có marketing domain.

**Drill-down:** A19.

## A07. Courses & Training Plans [NEW]

**Endpoint:** `GET /api/admin/analytics/courses-plans`

**Tác dụng:** Đánh giá mức sử dụng, gia hạn và phân bố gói/khóa.

**Request:** `from`, `to`, `branchIds`, `courseIds`, `trainingPlanIds`, `levels`, `planStatuses`.

**Response:**

- `summary`: `validPurchases`, `activeEnrollments`, `renewalRate`, `averagePlanDurationMonths`, `sessionUtilizationRate`.
- `plans[]`: `trainingPlanId`, `planName` (nếu entity có tên), `level`, `durationMonths`, `includedSessionCount`, `basePrice`, `finalPrice`, `validPurchaseCount`, `activeStudents`, `renewalRate`, `inferredLeavers`.
- `courses[]`: `courseId`, `courseName`, `level`, `activeStudents`, `inferredLeavers`, `attendanceRate`.
- `utilization[]`: `trainingPlanId`, `includedSessions`, `usedSessions`, `utilizationRate`.
- `addons[]`: `addonId`, `extraSessionsPerWeek`, `price`, `validUsageCount`.

**Domain:** training plan, requirement, access rule, addon, course purchase, enrollment, booking, attendance, course.

**Enum:** TrainingPlanStatus, AddonStatus, ScheduleLevel, SessionType, StudentEnrollmentStatus.

**Drill-down:** A20.

## A08. Branch Performance [NEW]

**Endpoint:** `GET /api/admin/analytics/branches`

**Tác dụng:** So sánh tăng trưởng và hiệu quả vận hành giữa các cơ sở.

**Request:** `from`, `to`, `asOf`, `branchIds`, `levels`, `courseIds`.

**Response:**

- `summary`: `operatingBranches`, `totalActiveStudents`, `totalInferredLeavers`, `systemAttendanceRate`.
- `branches[]`: `branchId`, `branchName`, `branchStatus`, `openedDate`, `activeStudents`, `newStudents`, `reactivatedStudents`, `inferredLeavers`, `transferIn`, `transferOut`, `netMovement`, `attendanceRate`, `activeClasses`, `availableSeats`.
- `monthly[]`: `month`, `branchId`, `newStudents`, `inferredLeavers`, `activeStudents`.
- `transferMatrix[]`: `fromBranchId`, `toBranchId`, `studentCount`.

**Domain:** branch, class schedule, course schedule, enrollment schedule, enrollment, person, attendance.

**Enum:** BranchStatus, ScheduleStatus, PersonStatus.

**Drill-down:** A21.

## A09. Coach & Teaching Operations [NEW]

**Endpoint:** `GET /api/admin/analytics/coaches`

**Tác dụng:** Theo dõi khối lượng phân công và việc thực hiện buổi học của HLV.

**Request:** `from`, `to`, `branchIds`, `courseScheduleIds`, `assignmentTypes`, `assignmentStatuses`.

**Response:**

- `summary`: `assignedCoaches`, `assignedSessions`, `completedSessions`, `missingTimesheets`, `timesheetCoverageRate`.
- `coaches[]`: `coachPersonId`, `coachName`, `assignedClassCount`, `assignedSessionCount`, `completedSessionCount`, `timesheetCompletedCount`, `missingTimesheetCount`, `averageClassAttendanceRate`.
- `assignments[]`: `coachPersonId`, `courseScheduleId`, `assignmentType`, `effectiveFrom`, `effectiveTo`, `status`.
- `monthly[]`: `month`, `coachPersonId`, `assignedSessions`, `completedSessions`, `missingTimesheets`.

**Domain:** course staff assignment, coach timesheet, class session, course schedule, person, attendance.

**Enum:** AssignmentType, assignment status, SessionStatus, EvaluationStatus.

**Lưu ý:** Tên FK của staff và ngày hiệu lực cần xác nhận trực tiếp từ Java entity trước khi triển khai.

**Drill-down:** A22.

## A10. Belt & Development [NEW]

**Endpoint:** `GET /api/admin/analytics/development`

**Tác dụng:** Theo dõi thi đai và tiến bộ thể lực.

**Request:** `from`, `to`, `branchIds`, `courseIds`, `belts`, `levels`, `examTypes`, `examResults`, `minAge`, `maxAge`.

**Response:**

- `summary`: `examParticipants`, `examAttempts`, `passedAttempts`, `passRate`, `fitnessParticipants`, `fitnessRecordCount`.
- `beltDistribution[]`: `belt`, `studentCount`.
- `examTrend[]`: `month`, `examType`, `passed`, `failed`, `absent`, `pending`.
- `byAge[]`: `age`, `examAttempts`, `passRate`.
- `byBranch[]`: `branchId`, `examAttempts`, `passRate`.
- `fitness[]`: `fitnessId`, `level`, `recordCount`, `participantCount`, `averageDuration`.

**Domain:** person, belt exam, fitness record, fitness, enrollment schedule, branch.

**Enum:** Belt, BeltExamResult, BeltExamType, ScheduleLevel.

**Drill-down:** A23.

## A11. Finance & Commercial [NEW]

**Endpoint:** `GET /api/admin/analytics/finance`

**Tác dụng:** Phân tích giao dịch hợp lệ và hiệu quả thương mại.

**Request:** `from`, `to`, `branchIds`, `trainingPlanIds`, `transactionTypes`, `directions`, `statuses`.

**Response:**

- `summary`: `approvedTopUpAmount`, `approvedPlanPurchaseAmount`, `approvedAddonPurchaseAmount`, `approvedRefundAmount`, `approvedTransactionCount`, `excludedMigrationTransactionCount`.
- `monthly[]`: `month`, `topUpAmount`, `planPurchaseAmount`, `addonPurchaseAmount`, `refundAmount`.
- `byPlan[]`: `trainingPlanId`, `validPurchaseCount`, `approvedPurchaseAmount`.
- `byBranch[]`: `branchId`, `attributedPurchaseAmount`, `attributionMethod`, `unattributedAmount`.
- `byStatus[]`: `transactionStatus`, `transactionCount`, `totalAmount`.
- `quality`: `excludedPendingCount`, `excludedSyntheticCount`, `unattributedPurchaseCount`.

**Domain:** wallet, wallet transaction, course purchase, training plan, wallet top-up request.

**Enum:** WalletTransactionType, WalletTransactionDirection, WalletTransactionStatus, top-up enums.

**Giới hạn:** Dòng tiền nạp ví, giao dịch mua gói và doanh thu kế toán là các khái niệm khác nhau; không cộng tùy tiện thành một KPI doanh thu.

**Drill-down:** A24.

---

# PHẦN VI. API DRILL-DOWN VÀ DANH SÁCH CHI TIẾT

## A12. Overview Movement Detail [DR]

**Endpoint:** `GET /api/admin/analytics/overview/movements`

**Tác dụng:** Từ KPI tổng quan mở ra các biến động tạo nên chỉ số.

**Request:** `metric` (`NEW`, `REACTIVATED`, `INFERRED_LEFT`, `TRANSFER_IN`, `TRANSFER_OUT`), `from`, `to`, `branchIds`, `page`, `size`, `sort`.

**Response:** `items[]` gồm `personId`, `personCode`, `fullName`, `personStatus`, `eventType`, `eventDate`, `branchId`, `branchName`, `courseScheduleId`, `courseName`, `inferredLeaveDate`, `leaveDateQuality`; kèm `totalElements`, `page`, `size`.

**Domain:** person, enrollment, enrollment schedule, course schedule, branch.

**Tác dụng quản trị:** Xác định chính xác những học viên đóng góp vào KPI được chọn.

## A13. Student Movement Students [DR]

**Endpoint:** `GET /api/admin/analytics/student-movements/students`

**Tác dụng:** Truy vấn danh sách học viên từ một ô/cột chart tăng giảm.

**Request:** `event`, `from`, `to`, `month`, `age`, `gender`, `belt`, `branchId`, `courseId`, `courseScheduleId`, `page`, `size`, `sort`.

**Response:** `items[]` gồm:

`personId`, `personCode`, `fullName`, `birthDate`, `ageAtEvent`, `gender`, `currentBelt`, `personStatus`, `eventType`, `eventDate`, `firstEnrollmentStartDate`, `lastEnrollmentStartDate`, `lastEnrollmentEndDate`, `inferredLeaveDate`, `leaveDateSource`, `leaveDateQuality`, `courseId`, `courseName`, `courseScheduleId`, `scheduleLabel`, `branchId`, `branchName`, `enrollmentStatus`, `monthsEnrolled`.

Thêm `totalElements`, `page`, `size`.

**Domain:** person, enrollment, enrollment schedule, course, course schedule, class schedule, branch.

**Enum:** PersonStatus, Belt, StudentEnrollmentStatus, EnrollmentScheduleStatus.

**Quy tắc:** Nếu event là `INFERRED_LEFT`, chỉ trả học viên `INACTIVE` với ngày nghỉ bằng `MAX(enrollment.end_date)`.

## A14. Student Analytics Timeline [DR]

**Endpoint:** `GET /api/admin/analytics/students/{personId}/timeline`

**Tác dụng:** Xem toàn bộ lịch sử có thể truy xuất của một học viên.

**Request:** `personId` (path), `from`, `to`, `includeAttendance`, `includeBookings`, `includeBeltExams`.

**Response:**

- `student`: `personId`, `personCode`, `fullName`, `birthDate`, `gender`, `currentBelt`, `status`, `startDate`.
- `leaveSummary`: `lastEnrollmentEndDate`, `inferredLeaveDate`, `leaveDateSource`, `leaveDateQuality`.
- `enrollments[]`: `enrollmentId`, `startDate`, `endDate`, `status`, `coursePurchaseId`, `trainingPlanId`.
- `schedules[]`: `enrollmentId`, `courseScheduleId`, `courseId`, `courseName`, `branchId`, `effectiveFrom`, `effectiveTo`, `status`.
- `attendance[]`: `sessionId`, `sessionDate`, `attendanceStatus`, `evaluationStatus`.
- `bookings[]`: `sessionId`, `bookingSource`, `bookingStatus`.
- `beltExams[]`: `examDate`, `fromBelt`, `targetBelt`, `examType`, `result`.
- `events[]`: `eventDate`, `eventType`, `sourceEntity`, `sourceId`, `confidence`.

**Domain:** person, enrollment, enrollment schedule, course purchase, training plan, session, attendance, booking, belt exam.

**Tác dụng quản trị:** Trả lời “Học viên này đã tham gia những khóa/lớp nào, có dấu hiệu nghỉ trước đó không, hiện đang nghỉ hay học?”.

## A15. Retention Students [NEW]

**Endpoint:** `GET /api/admin/analytics/retention/students`

**Tác dụng:** Danh sách học viên trong một nhóm retention/churn cụ thể.

**Request:** `from`, `to`, `cohortMonth`, `tenureBand`, `segment`, `branchId`, `trainingPlanId`, `graceDays`, `page`, `size`.

**Response:** `items[]`: `personId`, `personCode`, `fullName`, `personStatus`, `firstEnrollmentStartDate`, `lastEnrollmentEndDate`, `inferredLeaveDate`, `tenureDays`, `enrollmentCount`, `renewalCount`, `lastTrainingPlanId`, `lastCourseId`, `lastCourseScheduleId`, `lastBranchId`, `leaveDateQuality`; phân trang.

**Domain:** person, enrollment, course purchase, training plan, enrollment schedule.

**Tác dụng quản trị:** Xác định nhóm nghỉ sớm, không gia hạn, học lâu rồi nghỉ.

## A16. Class Detail [DR]

**Endpoint:** `GET /api/admin/analytics/classes/{courseScheduleId}`

**Tác dụng:** Xem toàn bộ chỉ số của một lớp.

**Request:** `courseScheduleId` (path), `from`, `to`, `asOf`.

**Response:**

- `classInfo`: `courseScheduleId`, `courseId`, `courseName`, `classScheduleId`, `branchId`, `branchName`, `weekday`, `startTime`, `endTime`, `status`, `sessionType`.
- `summary`: `activeRoster`, `newStudents`, `inferredLeavers`, `transferIn`, `transferOut`, `attendanceRate`, `atRiskStudents`, `capacity`, `fillRate`.
- `monthlyTrend[]`: `month`, `activeRoster`, `newStudents`, `inferredLeavers`, `attendanceRate`.
- `riskDistribution[]`: `riskLevel`, `studentCount`.
- `staffAssignments[]`: `staffPersonId`, `assignmentType`, `status`, `effectiveFrom`, `effectiveTo`.

**Domain:** course schedule, course, class schedule, branch, enrollment schedule, enrollment, attendance, staff assignment.

**Tác dụng quản trị:** Xác định lớp cần chiêu sinh, chăm sóc hoặc điều chỉnh lịch.

## A17. Class Students [DR]

**Endpoint:** `GET /api/admin/analytics/classes/{courseScheduleId}/students`

**Tác dụng:** Xem học viên thuộc một lớp theo nhóm cần quan tâm.

**Request:** `courseScheduleId` (path), `segment` (`ACTIVE`, `NEW`, `INFERRED_LEFT`, `AT_RISK`, `TRANSFER_IN`, `TRANSFER_OUT`), `from`, `to`, `asOf`, `page`, `size`.

**Response:** `items[]`: `personId`, `personCode`, `fullName`, `age`, `gender`, `currentBelt`, `personStatus`, `enrollmentId`, `enrollmentStartDate`, `enrollmentEndDate`, `scheduleEffectiveFrom`, `scheduleEffectiveTo`, `inferredLeaveDate`, `leaveDateQuality`, `attendanceRate30d`, `consecutiveAbsences`, `riskLevel`; phân trang.

**Domain:** person, enrollment, enrollment schedule, attendance, booking, class session.

**Tác dụng quản trị:** Từ lớp có 11 người nghỉ mở ra đúng danh sách 11 người theo quy tắc gán lớp cuối.

## A18. Attendance Risk Students [NEW]

**Endpoint:** `GET /api/admin/analytics/attendance-risk/students`

**Tác dụng:** Danh sách học viên cần chăm sóc dựa trên attendance.

**Request:** `from`, `to`, `branchId`, `courseScheduleId`, `riskLevel`, `riskReason`, `page`, `size`.

**Response:** `items[]`: `personId`, `personCode`, `fullName`, `personStatus`, `branchId`, `courseScheduleId`, `lastAttendanceDate`, `daysSinceLastAttendance`, `attendanceRate30d`, `attendanceRatePrevious30d`, `consecutiveAbsences`, `excusedAbsences30d`, `riskLevel`, `riskReasons`; phân trang.

**Domain:** person, enrollment, booking, attendance, class session, leave request.

**Tác dụng quản trị:** Tạo danh sách ưu tiên để CSKH/giáo vụ liên hệ.

## A19. Recruitment Students [NEW]

**Endpoint:** `GET /api/admin/analytics/recruitment/students`

**Tác dụng:** Xem danh sách học viên mới theo mùa, tuổi, cơ sở, lớp.

**Request:** `from`, `to`, `month`, `age`, `gender`, `branchId`, `courseId`, `courseScheduleId`, `acquisitionType`, `page`, `size`.

**Response:** `items[]`: `personId`, `personCode`, `fullName`, `birthDate`, `ageAtFirstEnrollment`, `gender`, `firstEnrollmentStartDate`, `firstCourseId`, `firstCourseName`, `firstCourseScheduleId`, `firstBranchId`, `firstTrainingPlanId`, `acquisitionType`, `sourceQuality`; phân trang.

**Domain:** person, enrollment, course purchase, training plan, enrollment schedule, course schedule, branch.

**Tác dụng quản trị:** Phân tích nhóm học viên từng được tuyển vào các tháng cao điểm.

## A20. Training Plan Students [NEW]

**Endpoint:** `GET /api/admin/analytics/courses-plans/{trainingPlanId}/students`

**Tác dụng:** Xem học viên sử dụng một gói và hành vi gia hạn.

**Request:** `trainingPlanId` (path), `from`, `to`, `segment`, `branchId`, `page`, `size`.

**Response:** `items[]`: `personId`, `personCode`, `fullName`, `coursePurchaseId`, `enrollmentId`, `enrollmentStartDate`, `enrollmentEndDate`, `enrollmentStatus`, `includedSessionCount`, `attendedSessionCount`, `utilizationRate`, `hasSubsequentEnrollment`, `inferredLeaveDate`, `personStatus`; phân trang.

**Domain:** training plan, course purchase, enrollment, booking, attendance, person.

**Tác dụng quản trị:** Xác định gói nào phù hợp và học viên nào có nguy cơ không gia hạn.

## A21. Branch Classes [NEW]

**Endpoint:** `GET /api/admin/analytics/branches/{branchId}/classes`

**Tác dụng:** Xem sức khỏe từng lớp trong một cơ sở.

**Request:** `branchId` (path), `from`, `to`, `asOf`, `status`, `sortBy`, `page`, `size`.

**Response:** `items[]`: `courseScheduleId`, `courseId`, `courseName`, `classScheduleId`, `weekday`, `startTime`, `endTime`, `scheduleStatus`, `activeRoster`, `newStudents`, `inferredLeavers`, `transferIn`, `transferOut`, `attendanceRate`, `capacity`, `fillRate`, `warningCodes`; phân trang.

**Domain:** branch, class schedule, course schedule, course, enrollment schedule, enrollment, attendance.

**Tác dụng quản trị:** Lập danh sách lớp ưu tiên tuyển sinh hoặc can thiệp theo từng cơ sở.

## A22. Coach Sessions [NEW]

**Endpoint:** `GET /api/admin/analytics/coaches/{staffPersonId}/sessions`

**Tác dụng:** Kiểm tra các buổi được phân công và timesheet của HLV.

**Request:** `staffPersonId` (path), `from`, `to`, `branchId`, `sessionStatus`, `timesheetStatus`, `page`, `size`.

**Response:** `items[]`: `sessionId`, `sessionDate`, `courseScheduleId`, `courseName`, `branchId`, `assignmentType`, `sessionStatus`, `scheduledStartTime`, `scheduledEndTime`, `coachCheckIn`, `coachCheckOut`, `timesheetComplete`, `studentAttendanceRate`; phân trang.

**Domain:** staff assignment, coach timesheet, class session, course schedule, attendance.

**Tác dụng quản trị:** Phát hiện thiếu timesheet, thiếu HLV hoặc buổi học vận hành bất thường.

## A23. Development Students [NEW]

**Endpoint:** `GET /api/admin/analytics/development/students`

**Tác dụng:** Xem danh sách học viên theo kết quả thi đai/thể lực.

**Request:** `from`, `to`, `branchId`, `belt`, `examResult`, `examType`, `fitnessId`, `page`, `size`.

**Response:** `items[]`: `personId`, `personCode`, `fullName`, `birthDate`, `currentBelt`, `examDate`, `fromBelt`, `targetBelt`, `examType`, `examResult`, `fitnessId`, `fitnessRecordDate`, `fitnessDuration`; phân trang.

**Domain:** person, belt exam, fitness record, fitness, enrollment schedule.

**Tác dụng quản trị:** Xác định học viên cần hỗ trợ và đánh giá kết quả đào tạo.

## A24. Finance Transactions [NEW]

**Endpoint:** `GET /api/admin/analytics/finance/transactions`

**Tác dụng:** Đối soát giao dịch tạo nên các KPI tài chính.

**Request:** `from`, `to`, `transactionType`, `direction`, `status`, `trainingPlanId`, `branchId`, `includeExcluded`, `page`, `size`.

**Response:** `items[]`: `transactionId`, `personId`, `transactionType`, `direction`, `amount`, `balanceBefore`, `balanceAfter`, `status`, `createdAt`, `reviewedAt`, `coursePurchaseId`, `trainingPlanId`, `attributedBranchId`, `isMigrationSynthetic`, `isIncludedInAnalytics`, `exclusionReason`; phân trang.

**Domain:** wallet transaction, wallet, course purchase, training plan, person.

**Tác dụng quản trị:** Cho phép kiểm tra vì sao một giao dịch được tính hoặc bị loại khỏi báo cáo.

---

# PHẦN VII. QUY TẮC JOIN VÀ LỊCH SỬ

## 19. Join học viên → enrollment → lớp

```text
core.person.person_id
    ↓
training.student_enrollment.student_person_id
    ↓
training.student_enrollment_schedule.student_enrollment_id
    ↓
catalog.course_schedule
    ├── catalog.course
    └── catalog.class_schedule
            ↓
        core.branch
```

Đây là quan hệ cốt lõi cho Growth, Retention, Class Health và Recruitment.

## 20. Tìm khóa/lớp cuối cùng của học viên nghỉ

Quy trình:

1. Xác định học viên có `person.status = INACTIVE`.
2. Lấy `MAX(student_enrollment.end_date)`.
3. Chọn enrollment cuối phù hợp với ngày đó.
4. Tìm `student_enrollment_schedule` hiệu lực tại ngày đó.
5. Join `course_schedule`, `course`, `class_schedule`, `branch`.
6. Nếu không có lịch hiệu lực đúng ngày, lấy lịch gần nhất trước ngày đó trong enrollment cuối.
7. Trả thêm `scheduleAtLeaveBasis` để biết kết quả là `EFFECTIVE_ON_DATE` hay `LAST_KNOWN_BEFORE_DATE`.

Nếu enrollment cuối có nhiều lịch đồng thời, trả về **mảng lịch**, không tự chọn một lịch duy nhất.

Nếu nhiều enrollment cùng có `end_date` lớn nhất, không được âm thầm chọn một enrollment bất kỳ; phải xử lý tất cả enrollment liên quan hoặc áp dụng tie-break rule có ghi nhận.

## 21. Phân biệt chuyển lớp và nghỉ trung tâm

- Học viên chuyển P23C1 sang P24C1 nhưng `person.status = ACTIVE`: không tính nghỉ trung tâm.
- Học viên chuyển cơ sở nhưng vẫn `ACTIVE`: không tính nghỉ trung tâm.
- Học viên hết một enrollment rồi có enrollment tiếp theo và vẫn `ACTIVE`: không tính nghỉ trung tâm.
- Học viên `INACTIVE`: tính một lần nghỉ suy luận tại `MAX(end_date)`.

Đối với chart biến động lớp, cần tách:

`NEW_TO_CLASS`, `TRANSFER_IN`, `TRANSFER_OUT`, `INFERRED_LEFT_FROM_CENTER`.

Các giá trị này là **phân loại analytics**, không phải enum hiện hữu.

## 22. Snapshot lịch sử

Dữ liệu `person.status` hiện tại không đủ để biết status của học viên vào tháng 6 năm trước.

Do đó cần phân biệt:

- **Current-state inferred leave:** Ngày nghỉ cuối của học viên hiện `INACTIVE`.
- **Historical movement:** Các lần thay đổi được xác nhận trong lịch sử.
- **Enrollment expiry:** Ngày hết hạn enrollment.
- **Non-renewal:** Hết hạn mà không có enrollment tiếp theo trong grace period.

Không được hiển thị bốn loại trên như một chỉ số duy nhất.

---

# PHẦN VIII. CHẤT LƯỢNG DỮ LIỆU VÀ IMPORT

## 23. Quy tắc loại trừ dữ liệu migration

Đợt import trước đã sử dụng enrollment và giao dịch kỹ thuật để phù hợp với ràng buộc domain.

Vì vậy phải xác định nguồn dữ liệu của từng record:

- `REAL_OPERATIONAL`: Dữ liệu nghiệp vụ thực.
- `HISTORICAL_IMPORTED_VERIFIED`: Dữ liệu lịch sử có ngày thực đã kiểm chứng.
- `MIGRATION_PROVISIONAL`: Dữ liệu có ngày hoặc giao dịch quy ước.
- `UNKNOWN`: Chưa xác minh.

Đây là phân loại đề xuất, không phải enum hiện tại.

### Quy tắc bắt buộc

1. Không tính giao dịch `PENDING` 1 VND từ migration thành doanh thu.
2. Không tính enrollment một tháng được tạo quy ước thành lịch sử enrollment thật.
3. Không suy luận học viên nghỉ vào tháng 11/2026 chỉ vì enrollment import có end date 30/11/2026.
4. Không sử dụng các ngày quy ước để phân tích mùa chiêu sinh nhiều năm.
5. Những chart không đủ dữ liệu phải hiển thị cảnh báo hoặc `null`, không tự điền số 0.

**Đặc biệt:** Nếu một học viên `INACTIVE` có enrollment cuối được tạo giả định với end date 30/11/2026, quy tắc `MAX(end_date)` vẫn trả 30/11/2026 về mặt SQL, nhưng đây không phải bằng chứng học viên nghỉ thật trong tháng 11/2026.

Cần sửa nguồn enrollment lịch sử hoặc ưu tiên ngày nghỉ thực được xác minh từ dữ liệu Excel gốc khi chuẩn bị bộ dữ liệu Analytics.

## 24. Bảng kiểm tra chất lượng dữ liệu

| Kiểm tra | Ý nghĩa |
|---|---|
| `INACTIVE` không có end date | Không thể suy ra ngày nghỉ |
| `INACTIVE` có enrollment mở | Xung đột dữ liệu |
| `INACTIVE` có end date tương lai | Chưa thể coi là đã nghỉ |
| Enrollment overlap | Có thể gây đếm trùng |
| Nhiều lịch đồng thời | Cần gán đúng lớp |
| Enrollment migration provisional | Không dùng cho xu hướng lịch sử |
| Thiếu birth date | Không phân tích tuổi |
| Thiếu gender | Phân loại Unknown |
| Thiếu lịch sử belt | Không kết luận belt tại thời điểm nghỉ |
| Thiếu capacity lớp | Không tính fill rate thật |
| Finance synthetic | Loại khỏi doanh thu |

---

# PHẦN IX. KIẾN TRÚC TRIỂN KHAI

## 25. Backend

Đề xuất module:

```text
analytics/
├── controller/
│   ├── OverviewAnalyticsController
│   ├── StudentMovementAnalyticsController
│   ├── RetentionAnalyticsController
│   ├── ClassAnalyticsController
│   ├── AttendanceRiskAnalyticsController
│   ├── RecruitmentAnalyticsController
│   ├── CoursePlanAnalyticsController
│   ├── BranchAnalyticsController
│   ├── CoachAnalyticsController
│   ├── DevelopmentAnalyticsController
│   └── FinanceAnalyticsController
├── service/
│   ├── StudentLifecycleAnalyticsService
│   ├── EnrollmentTimelineService
│   ├── AnalyticsAggregationService
│   └── DataQualityService
├── repository/
│   ├── StudentMovementAnalyticsRepository
│   ├── EnrollmentAnalyticsRepository
│   ├── ClassAnalyticsRepository
│   └── ...
└── dto/
    ├── request/
    ├── response/
    └── common/
```

`StudentLifecycleAnalyticsService` phải là nơi định nghĩa tập trung quy tắc `INACTIVE + MAX(end_date)`.

Không được viết lại quy tắc này độc lập ở Overview, Growth, Retention và Class Health vì dễ tạo số liệu khác nhau.

## 26. PostgreSQL Analytics Layer

Đề xuất các view hoặc materialized view:

```text
analytics.student_last_enrollment
analytics.student_current_lifecycle
analytics.student_monthly_movement
analytics.class_monthly_stats
analytics.branch_monthly_stats
analytics.student_attendance_risk
analytics.retention_cohort
analytics.data_quality_summary
```

Các cấu trúc này là **đề xuất mới**, chưa tồn tại trong domain nguồn.

`analytics.student_current_lifecycle` nên trả:

`person_id`, `person_status`, `first_enrollment_start_date`, `last_enrollment_end_date`, `inferred_leave_date`, `leave_date_quality`, `enrollment_count`, `last_enrollment_id`, `has_open_enrollment`.

Đối với dữ liệu lịch sử có thể thay đổi sau khi import/sửa ngày, phải có cơ chế refresh/invalidation.

## 27. Frontend

Nguyên tắc:

**Một page Analytics có một API tổng hợp chính; khi click xem chi tiết mới gọi API drill-down.**

Ví dụ:

```text
/analytics/students
    ↓
GET /analytics/student-movements
    ├── Theo tháng
    ├── Theo tuổi
    ├── Theo giới tính
    ├── Theo đai
    ├── Theo cơ sở
    └── Theo lớp

Click "Tháng 7 - 61 học viên nghỉ"
    ↓
GET /analytics/student-movements/students
    ↓
Click học viên
    ↓
GET /analytics/students/{personId}/timeline
```

Frontend sử dụng TanStack React Query để cache theo kỳ thống kê và filter.

Gợi ý:

- Operational summary: cache khoảng 1–5 phút.
- Historical aggregates: cache dài hơn nếu dữ liệu ít thay đổi.
- Drill-down: cache theo filter và phân trang.
- Thay tab chart dùng cùng response thì không request lại.
- Đổi cơ sở, kỳ thống kê hoặc filter ảnh hưởng aggregate thì request lại.

## 28. Phân quyền

Domain hiện có `SUPER_ADMIN`, `SYSTEM_ADMIN`, `GUARDIAN`, `FINANCE_STAFF`, nhưng chưa có analytics permission chuyên biệt.

Đề xuất bổ sung:

- `ANALYTICS_EXECUTIVE_READ`
- `ANALYTICS_STUDENT_READ`
- `ANALYTICS_CLASS_READ`
- `ANALYTICS_BRANCH_READ`
- `ANALYTICS_FINANCE_READ`
- `ANALYTICS_EXPORT`

Các permission này chưa có trong enum nguồn và cần migration/domain update trước khi sử dụng.

Branch manager chỉ được xem cơ sở được cấp quyền; finance cần quyền riêng; dữ liệu học viên chi tiết cần kiểm soát chặt hơn dữ liệu aggregate.

---

# PHẦN X. LỘ TRÌNH TRIỂN KHAI

## 29. MVP — Ưu tiên cao nhất

**Bước 1 — Data Foundation**

- Triển khai `StudentLifecycleAnalyticsService`.
- Chuẩn hóa quy tắc `INACTIVE + MAX(end_date)`.
- Phân loại dữ liệu import và ngày quy ước.
- Tạo view `student_current_lifecycle`.
- Kiểm tra enrollment overlap, missing dates, invalid states.

**Bước 2 — Student Growth & Movement**

- API A02, A13, A14.
- Chart tăng/giảm theo tháng, tuổi, giới tính, đai, cơ sở, lớp.
- Drill-down đến danh sách học viên nghỉ.

**Bước 3 — Executive Overview**

- API A01, A12.
- KPI và cảnh báo toàn hệ thống.

**Bước 4 — Class Health**

- API A04, A16, A17.
- Sĩ số, tăng/giảm, attendance, lớp cần chiêu sinh.

**Bước 5 — Retention & Attendance Risk**

- API A03, A05, A15, A18.
- Cohort, gia hạn, học viên có nguy cơ nghỉ.

## 30. Phase 2 — Phục vụ chiêu sinh và tối ưu vận hành

- Recruitment & Seasonality: A06, A19.
- Branch Performance: A08, A21.
- Course & Training Plan: A07, A20.
- Coach Operations: A09, A22.
- Belt & Development: A10, A23.

## 31. Phase 3 — Marketing và tài chính chuyên sâu

Bổ sung các domain chưa có:

```text
marketing_campaign
lead
lead_source
lead_event
trial_booking
acquisition_attribution
campaign_cost
student_lifecycle_event
student_leave_reason
```

Sau đó triển khai:

- Lead funnel.
- Trial → Enrollment conversion.
- CAC/CPL.
- Campaign ROI/ROAS.
- Churn reason.
- Confirmed historical churn.
- Reactivation campaigns.
- Finance Analytics: A11, A24.
- Predictive churn sau khi có đủ dữ liệu thực.

---

# PHẦN XI. TIÊU CHÍ NGHIỆM THU

## 32. Kiểm thử logic học viên nghỉ

**Case 1:** `ACTIVE`, có enrollment kết thúc tháng 7 → không tính nghỉ.

**Case 2:** `INACTIVE`, có ba enrollment kết thúc tháng 1, 2, 3 → tính một học viên nghỉ tháng 3.

**Case 3:** `INACTIVE`, không có end date → không tự gán ngày nghỉ.

**Case 4:** `SUSPENDED`, có enrollment hết hạn → không tính nghỉ hẳn.

**Case 5:** `INACTIVE`, enrollment cuối thuộc hai lịch đồng thời → hiển thị cả hai lịch.

**Case 6:** Học viên chuyển lớp nhưng vẫn `ACTIVE` → không làm tăng số nghỉ toàn trung tâm.

**Case 7:** Học viên có enrollment import quy ước → đánh dấu provisional, không làm sai trend lịch sử.

**Case 8:** Hai page Overview và Student Movement cùng filter → số học viên nghỉ phải bằng nhau.

**Case 9:** Click một ô chart nghỉ → danh sách trả về có số lượng distinct học viên khớp với aggregate.

**Case 10:** Học viên quay lại và status chuyển `ACTIVE` → không còn thuộc tập nghỉ theo trạng thái hiện tại; báo cáo phải giải thích đây không phải historical event log.

## 33. Tiêu chí kỹ thuật

- Không đếm trùng học viên có nhiều enrollment.
- Không đếm trùng khi học viên tham gia nhiều lịch.
- Các page dùng chung định nghĩa nghiệp vụ.
- Tất cả drill-down hỗ trợ pagination.
- Mọi KPI có `asOf` và kỳ thống kê rõ ràng.
- Dữ liệu không đủ phải có trạng thái chất lượng.
- Query aggregation thực hiện chủ yếu ở PostgreSQL.
- Frontend không tải toàn bộ dữ liệu gốc để tự thống kê.
- Có index phù hợp cho person, enrollment, enrollment schedule, session và attendance.
- Có phân quyền theo cơ sở và loại dữ liệu.
- Có cơ chế loại trừ migration khỏi chỉ số tài chính và lịch sử.

---

# KẾT LUẬN

Hệ thống Analytics nên triển khai theo kiến trúc **11 page, 11 API tổng hợp chính và 13 API drill-down**, với một lớp định nghĩa nghiệp vụ thống nhất.

Quy tắc MVP xác định học viên nghỉ là:

**`PersonStatus.INACTIVE` + `MAX(StudentEnrollment.endDate)` → `inferredLeaveDate`.**

Quy tắc này đáp ứng nhu cầu thống kê trước mắt và có thể dùng thống nhất trên Overview, Student Growth, Retention, Class Health và Recruitment.

Tuy nhiên, cần phân biệt rõ ngày nghỉ suy luận với ngày nghỉ thực tế và loại trừ các enrollment lịch sử có ngày quy ước. Về dài hạn, nên bổ sung `student_lifecycle_event` để ghi nhận chính xác nhiều lần nghỉ, quay lại, tạm nghỉ và lý do nghỉ.

Mục tiêu cuối cùng không chỉ là có nhiều biểu đồ, mà là giúp lãnh đạo biết **lớp nào đang mất học viên, nhóm tuổi nào cần chiêu sinh, thời điểm nào nên triển khai marketing, ai cần được chăm sóc và hiệu quả sau khi can thiệp**.
