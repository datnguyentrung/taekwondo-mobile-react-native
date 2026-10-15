# React Native Project Structure v2

> Trạng thái: nguồn chuẩn hiện hành cho Expo SDK 57, React Native 0.86 và Expo Router 57.
>
> Bản v1 được giữ làm tài liệu lịch sử. Khi hai bản khác nhau, áp dụng v2.

## 1. Mục tiêu

V2 giữ nguyên nguyên tắc feature ownership của v1 và bổ sung ranh giới chạy Web bằng React Native Web.

Mỗi quyết định đặt file phải trả lời được:

1. Ai sở hữu hành vi này?
2. File cung cấp interface gì cho phần còn lại?
3. Phần nào phụ thuộc nền tảng?
4. Đổi chi tiết bên trong có buộc caller đổi theo không?

Không tách file theo số dòng. Tách khi file đang có từ hai trách nhiệm thay đổi độc lập trở lên.

## 2. Luồng phụ thuộc

```text
src/app
  -> src/routes/navigation
  -> src/features
  -> src/shared
  -> src/infrastructure
```

Quy tắc:

- `src/app` chỉ ánh xạ URL, đọc route params và gắn guard/layout.
- `src/routes/navigation` sở hữu navigation shell, permission guard và screen chrome dùng chung.
- `src/features/<feature>` sở hữu UI và hành vi nghiệp vụ.
- `src/shared` chỉ chứa code đã có nhiều chủ sở hữu độc lập.
- `src/infrastructure` cung cấp adapter kỹ thuật: HTTP, storage, database, MQTT, logging.
- Infrastructure không import screen hoặc component.
- Shared không import feature.
- Feature chỉ import public API của feature khác khi có hợp đồng nghiệp vụ rõ ràng. Không import private implementation để lấy tiện ích chung.

## 3. Cây thư mục chuẩn

```text
src/
├── app/                         # Expo Router entries và app composition
│   ├── _layout.tsx
│   ├── (auth)/
│   └── (app)/
│       ├── _layout.tsx
│       └── _layout.web.tsx
├── providers/                   # App composition and runtime providers
│   └── AppProviders.tsx
├── routes/
│   └── navigation/              # Stack/tab shell, guards, shared headers
├── features/
│   └── <feature>/
│       ├── api/                 # Transport DTO và endpoint client
│       ├── components/          # UI do feature sở hữu
│       ├── constants/           # Runtime values của feature
│       ├── domain/              # Model và pure business rules
│       ├── hooks/               # UI/business orchestration
│       ├── queries/             # Server state, mutation, cache policy
│       ├── screens/             # Screen composition
│       ├── services/            # Multi-step use case không thuộc UI
│       ├── store/               # Client state dài hạn
│       └── index.ts             # Public API có chủ đích
├── shared/
│   ├── ui/
│   ├── hooks/
│   ├── domain/
│   └── utils/
├── infrastructure/
│   ├── database/
│   │   ├── database.ts
│   │   └── database.web.ts
│   ├── storage/
│   │   ├── secureStorage.ts
│   │   └── secureStorage.web.ts
│   ├── http/
│   ├── mqtt/
│   └── query/
├── config/
└── theme/
```

Chỉ tạo subfolder khi có file thực. Feature nhỏ có thể bắt đầu bằng `screens/`, `api/` và `domain/`.

## 4. Ma trận trách nhiệm

| Vai trò | Được chứa | Không được chứa |
|---|---|---|
| `app/**/*.tsx` | Re-export screen, params, guard, route layout | API call, business rule, form lớn |
| `screens/` | State tương tác hiển thị, composition, navigation/toast callback | Transport call, cache mutation, thuật toán nghiệp vụ |
| `components/` | Render và interaction cục bộ | Quy trình nhiều bước, cache policy |
| `hooks/` | Điều phối state và use case phục vụ UI | JSX lớn, transport DTO công khai |
| `queries/` | Query key, API invocation, mutation, optimistic update, invalidation | Navigation và nội dung toast |
| `domain/` | Model nghiệp vụ, pure function, mapper không I/O | React, HTTP client, platform API |
| `api/` | DTO, request/response, endpoint client | View model, toast, navigation |
| `services/` | Use case nhiều endpoint hoặc policy có thể test độc lập | Screen state |
| `constants/` | Enum/const runtime | Interface/type thuần |
| `*.types.ts` | Type/interface thuần | Enum, lookup map, function |
| `shared/ui` | Primitive có nhiều feature sử dụng | Quy tắc của một feature |
| `infrastructure` | Adapter kỹ thuật và lifecycle | Quyết định nghiệp vụ |

## 5. Screen và data flow

Screen gọi hook của feature:

```text
Screen
  -> query/hook
     -> API adapter
     -> domain mapper/rule
  -> component
```

Screen được giữ callback để:

- mở/đóng sheet;
- cập nhật field đang nhập;
- điều hướng sau khi mutation thành công;
- hiển thị toast theo ngữ cảnh.

Query hook sở hữu:

- query key;
- gọi API;
- optimistic update và rollback;
- cache invalidation;
- hợp nhất DTO thành model/view model.

## 6. Type, DTO và runtime value

- DTO nằm trong `api/*.dto.ts` và chỉ mô tả wire contract.
- Domain model nằm trong feature sở hữu khái niệm.
- View model nằm trong `domain/*.types.ts` hoặc cạnh component nếu chỉ có một consumer.
- Navigation props nằm cạnh route/screen sở hữu route.
- Enum, label map và danh sách option là runtime value, đặt trong `constants/`.
- File `types.ts` không được khởi tạo giá trị runtime.

Nếu một type đang ở feature A nhưng feature B, C dùng vì khái niệm thật sự thuộc B, hãy chuyển type về B. Chỉ đưa vào `shared/domain` khi không feature nào là chủ sở hữu tự nhiên.

## 7. Shared phải được chứng minh

Promote code vào shared khi:

1. Có ít nhất hai feature độc lập dùng cùng semantics.
2. API không chứa tên hoặc policy của feature gốc.
3. Shared module không cần import ngược feature.

Ví dụ hiện tại: card bề mặt, form field, action button và segmented tabs dùng ở course, wallet, person, student nên thuộc `shared/ui/commerce/CommercePrimitives.tsx`.

Component như `CourseCatalogCard` vẫn thuộc domain course/commerce cho đến khi ownership được tách rõ; không promote chỉ vì nó dài.

## 8. Ranh giới Web và Native

### 8.1 Nguyên tắc

- Native là baseline hồi quy hiện tại.
- Web chỉ bật route đã được chỉ định và kiểm thử đầy đủ.
- Route chưa hỗ trợ phải hiển thị trạng thái rõ ràng.
- Business rules, DTO, domain types và MQTT WebSocket được dùng chung.
- Native module phải nằm sau adapter platform.

### 8.2 Chọn adapter

Dùng suffix khi implementation khác nhưng contract giống nhau:

```text
secureStorage.ts             # native/default
secureStorage.web.ts         # sessionStorage
database.ts                  # expo-sqlite
database.web.ts              # no-op/unavailable adapter
```

Dùng `.native.ts` khi cả iOS và Android dùng chung implementation riêng. Dùng `.ios.ts` hoặc `.android.ts` khi thực sự khác.

Trong `src/app`, luôn giữ file generic bên cạnh file platform theo yêu cầu của Expo Router. Ví dụ `_layout.tsx` và `_layout.web.tsx`.

Không rải `Platform.OS` quanh feature để né import native. Tạo seam tại nơi capability đi vào hệ thống.

### 8.3 Bootstrap

`src/app/providers/AppProviders.tsx` là composition root. Provider được phép gọi adapter qua contract chung. Adapter Web không được import package chỉ chạy Native.

Các capability Web chưa dùng không được khởi tạo chỉ để đạt parity giả.

### 8.4 Routing và build

- `web.output` là `single`.
- Hosting phải rewrite URL ứng dụng về `/index.html`.
- Netlify-compatible rewrite nằm tại `public/_redirects`.
- Hosting khác phải cấu hình quy tắc tương đương.
- Route động không cần pre-generate trong chế độ `single`.
- Khi bật một màn hình Web, cập nhật `src/app/(app)/_layout.web.tsx` hoặc route platform entry tương ứng và thêm browser smoke test.

## 9. MQTT dùng chung

Feature chỉ phụ thuộc interface subscribe/publish/connect. Infrastructure MQTT chấp nhận URL `ws://` hoặc `wss://` cho Web và Native.

Không đưa broker-specific topic parsing vào component. Đặt message mapping trong domain/service của feature tiêu thụ.

Mỗi subscription phải:

- trả về hàm unsubscribe;
- cleanup khi component unmount hoặc identity đổi;
- có test cho reconnect và duplicate subscription khi use case cần.

## 10. Import rules

- Dùng alias `@/` khi đi qua boundary hoặc khi relative path vượt feature.
- Trong cùng submodule, relative import ngắn được chấp nhận.
- Không import từ `src/app`.
- Không import deep private path của feature khác nếu feature đã có public API phù hợp.
- Tránh barrel tổng hợp toàn bộ feature; export contract nhỏ, có chủ đích.
- Type-only dependency phải dùng `import type`.

## 11. Checklist di chuyển file

1. Xác định owner đích và interface giữ nguyên.
2. Tìm toàn bộ caller và test bằng CodeGraph.
3. Di chuyển implementation, không tạo bản sao.
4. Cập nhật import và public API trong cùng thay đổi.
5. Tách runtime value khỏi type-only file nếu đang trộn.
6. Đặt API/cache logic vào query hook; đặt pure rule vào domain.
7. Kiểm tra route entry vẫn mỏng và permission guard không đổi.
8. Chạy typecheck, lint và test liên quan.
9. Nếu chạm platform boundary, chạy Web export và Native regression phù hợp.
10. Ghi quyết định giữ nguyên nếu file dài nhưng chỉ có một trách nhiệm.

## 12. Gate review

Một thay đổi cấu trúc chỉ hoàn tất khi:

- Không còn import tới path cũ.
- Không còn implementation tương thích trùng lặp.
- Android/iOS giữ contract và navigation cũ.
- Web bundle không kéo native-only module qua bootstrap.
- Query keys và invalidation nằm cùng feature.
- Screen không gọi API client trực tiếp.
- Tài liệu audit ghi rõ file đã sửa và file được giữ.

## 13. Ví dụ Web tương lai

Scoreboard và Match Operator chỉ là ví dụ placement:

```text
features/match-operator/
├── domain/
│   ├── match.types.ts
│   └── calculateScore.ts
├── queries/
│   └── useMatchSubscription.ts
├── screens/
│   ├── MatchOperatorScreen.tsx
│   └── MatchOperatorScreen.web.tsx   # chỉ khi composition khác
└── services/
    └── matchMessageMapper.ts
```

Không tạo feature, route hoặc folder này trước khi có yêu cầu sản phẩm.

## 14. Tài liệu liên quan

- [Báo cáo rà soát cấu trúc](./REACT_NATIVE_PROJECT_STRUCTURE_AUDIT.md)
- [Structure v1 — lưu tham chiếu](./REACT_NATIVE_PROJECT_STRUCTURE.md)
- [Expo platform modules](https://docs.expo.dev/router/advanced/platform-specific-modules/)
- [Expo web output](https://docs.expo.dev/guides/publishing-websites/)
