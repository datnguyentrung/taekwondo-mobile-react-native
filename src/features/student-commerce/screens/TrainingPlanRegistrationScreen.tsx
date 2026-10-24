import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Calendar, ChevronRight, Clock, Layers, User } from 'reicon-react-native';

import { useAuthStore } from '@/features/authentication/store/auth.store';
import { usePerson } from '@/features/person/queries/personQueries';
import { useRegistrationStudentSearch } from '@/features/student-commerce/queries/courseRegistrationQueries';
import type { CourseRegistrationStudentView } from '@/features/student-commerce/types';
import { usePurchaseTrainingPlan, useTrainingPlanCatalog, useTrainingPlanOptions } from '@/features/training-plan-registration';
import type { TrainingPlanCatalogItem, TrainingPlanRecurringRequirement, TrainingPlanScheduleOption } from '@/features/training-plan-registration';
import StackScreenLayout from '@/routes/navigation/layouts/StackScreenLayout';
import { BottomSheetWindow } from '@/shared/ui/BottomSheetWindow';
import { PickerPopover } from '@/shared/ui/PickerPopover';
import { AppIcon } from '@/shared/ui/AppIcon';
import { ThemedText } from '@/shared/ui/ThemedText';
import { AdminListRow } from '@/shared/ui/admin/AdministrationPrimitives';
import { PrimaryActionButton, SurfaceCard } from '@/shared/ui/commerce/CommercePrimitives';
import { getApiErrorMessage } from '@/infrastructure/http/httpError';
import { useToast } from '@/shared/ui/Toast';
import { Colors, effects, radii, Spacing } from '@/theme';

type Props = { initialCourseId?: string; initialPackageId?: string; studentCode?: string };
type Student = Pick<CourseRegistrationStudentView, 'personId' | 'fullName' | 'personCode'>;

const today = () => new Date().toISOString().slice(0, 10);
const money = (value?: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value ?? 0);
const dateLabel = (value: string) => new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
const createReference = () => `TP-MOBILE-${Date.now()}`;
const startDateOptions = Array.from({ length: 30 }, (_, offset) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  const value = date.toISOString().slice(0, 10);
  return { value, label: offset === 0 ? `Hôm nay · ${dateLabel(value)}` : dateLabel(value) };
});

export function TrainingPlanRegistrationScreen({ studentCode }: Props) {
  const toast = useToast();
  const context = useAuthStore((state) => state.activeContext);
  const user = useAuthStore((state) => state.user);
  const routedStudentQuery = usePerson(studentCode);
  const canChooseStudent = Boolean(user?.roles.some((role) => role === 'SUPER_ADMIN' || role === 'SYSTEM_ADMIN' || role === 'ROLE_MANAGER_SENIOR'));
  const contextStudent = useMemo<Student | undefined>(() => context?.personId ? {
    personId: context.personId,
    personCode: context.personCode ?? context.personId,
    fullName: context.displayName,
  } : undefined, [context]);
  const routedStudent = useMemo<Student | undefined>(() => routedStudentQuery.data ? {
    personId: routedStudentQuery.data.personId,
    personCode: routedStudentQuery.data.personCode ?? routedStudentQuery.data.personId,
    fullName: routedStudentQuery.data.fullName,
  } : undefined, [routedStudentQuery.data]);
  const [selectedStudent, setSelectedStudent] = useState<Student | undefined>(contextStudent);
  const [studentSheet, setStudentSheet] = useState(false);
  const [planSheet, setPlanSheet] = useState(false);
  const [scheduleSheetFor, setScheduleSheetFor] = useState<string>();
  const [confirmSheet, setConfirmSheet] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<TrainingPlanCatalogItem>();
  const [startDate, setStartDate] = useState(today());
  const [schedulesByRequirement, setSchedulesByRequirement] = useState<Record<string, string[]>>({});
  const reference = useRef(createReference());
  const students = useRegistrationStudentSearch('', canChooseStudent && studentSheet);
  const catalog = useTrainingPlanCatalog(selectedStudent?.personId);
  const options = useTrainingPlanOptions(selectedPlan?.trainingPlanId, startDate);
  const purchase = usePurchaseTrainingPlan();

  useEffect(() => {
    if (routedStudent) {
      setSelectedStudent(routedStudent);
    } else if (!canChooseStudent) {
      setSelectedStudent(contextStudent);
    }
  }, [canChooseStudent, contextStudent, routedStudent]);
  useEffect(() => setSchedulesByRequirement({}), [selectedPlan?.trainingPlanId, startDate]);

  const validRecurring = options.data?.recurringRequirements.every((requirement) =>
    (schedulesByRequirement[requirement.requirementId] ?? []).length === requirement.sessionsPerWeek,
  ) ?? false;
  const canConfirm = Boolean(selectedStudent && selectedPlan && options.data && validRecurring);

  const choosePlan = (plan: TrainingPlanCatalogItem) => {
    setSelectedPlan(plan);
    setSchedulesByRequirement({});
    setPlanSheet(false);
  };
  const toggleSchedule = (requirementId: string, limit: number, optionId: string) => {
    setSchedulesByRequirement((current) => {
      const currentIds = current[requirementId] ?? [];
      const next = currentIds.includes(optionId)
        ? currentIds.filter((id) => id !== optionId)
        : currentIds.length < limit ? [...currentIds, optionId] : currentIds;
      return { ...current, [requirementId]: next };
    });
  };
  const submit = () => {
    if (!selectedStudent || !selectedPlan || !options.data) return;
    purchase.mutate({
      studentPersonId: selectedStudent.personId,
      trainingPlanId: selectedPlan.trainingPlanId,
      startDate,
      recurringSchedules: Object.entries(schedulesByRequirement).flatMap(([requirementId, scheduleIds]) =>
        scheduleIds.map((courseScheduleId) => ({ requirementId, courseScheduleId }))),
      externalReference: reference.current,
        note: `Đăng ký gói ${selectedPlan.name}`,
    }, {
      onSuccess: () => {
        setConfirmSheet(false);
          reference.current = createReference();
          setSelectedPlan(undefined);
          setSchedulesByRequirement({});
          toast.show({ message: 'Đã mua gói và chốt lịch học.', variant: 'success' });
        },
        onError: (error) => {
          toast.show({
            message: getApiErrorMessage(error, 'Không thể đăng ký gói học. Vui lòng thử lại.'),
            variant: 'error',
          });
      },
    });
  };

  return <>
    <StackScreenLayout title="Đăng ký gói học" contentContainerStyle={styles.screen}>
      <SurfaceCard soft style={styles.notice}>
        <View style={styles.noticeIcon}><AppIcon icon={<Layers />} size={24} color={Colors.light.primary} /></View>
        <View style={styles.flex}>
          <ThemedText type="title">Chọn gói, rồi chốt lịch học</ThemedText>
          <ThemedText type="bodySmall" style={styles.helper}>Các ca cố định được lưu cùng enrollment. Bạn có thể tập ghép giữa những khóa được gói cho phép.</ThemedText>
        </View>
      </SurfaceCard>
      <Section title="1. Học viên">
        <StepChoice icon={<User />} title={selectedStudent?.fullName ?? 'Chọn học viên'} subtitle={selectedStudent ? selectedStudent.personCode : canChooseStudent ? 'Chọn học viên cần đăng ký gói' : 'Không tìm thấy hồ sơ học viên'} locked={!canChooseStudent && !selectedStudent} onPress={() => canChooseStudent && setStudentSheet(true)} />
      </Section>
      <Section title="2. Gói học">
        <StepChoice icon={<Layers />} title={selectedPlan?.name ?? 'Chọn gói học'} subtitle={selectedPlan ? `${selectedPlan.durationMonths} tháng · ${selectedPlan.includedSessionCount} buổi · ${money(selectedPlan.finalPrice)}` : selectedStudent ? 'Gói xác định quota và các khóa được phép học' : 'Chọn học viên trước'} locked={!selectedStudent} onPress={() => selectedStudent && setPlanSheet(true)} />
      </Section>
      <Section title="3. Ngày bắt đầu">
        <StepChoice icon={<Calendar />} title={dateLabel(startDate)} subtitle="Lịch phù hợp được tính lại theo ngày này" onPress={() => setDatePickerOpen(true)} />
      </Section>
      {selectedPlan ? <Section title="4. Chốt lịch cố định">
        {options.isFetching ? <InlineState loading message="Đang tải các lịch phù hợp…" /> : null}
        {options.isError ? <InlineState message="Không thể tải lịch phù hợp." actionLabel="Thử lại" onAction={() => void options.refetch()} /> : null}
        {!options.isFetching && !options.isError && options.data?.recurringRequirements.length === 0 ? <InlineState message="Gói này chưa có quota lịch học để đăng ký." /> : null}
        {options.data?.recurringRequirements.map((requirement) => {
          const ids = schedulesByRequirement[requirement.requirementId] ?? [];
          const complete = ids.length === requirement.sessionsPerWeek;
          return <StepChoice key={requirement.requirementId} icon={<Clock />} completed={complete} title={requirement.label} subtitle={complete ? `Đã chốt ${ids.length}/${requirement.sessionsPerWeek} ca mỗi tuần` : `Cần chọn ${requirement.sessionsPerWeek} ca mỗi tuần · đã chọn ${ids.length}`} onPress={() => setScheduleSheetFor(requirement.requirementId)} />;
        })}
      </Section> : null}
      {selectedPlan && !canConfirm && !options.isFetching ? <ThemedText type="bodySmall" style={styles.helper}>Chọn đủ số ca cho từng quota để tiếp tục thanh toán.</ThemedText> : null}
      <PrimaryActionButton title="Xem lại và thanh toán" disabled={!canConfirm} onPress={() => setConfirmSheet(true)} />
    </StackScreenLayout>

    <BottomSheetWindow visible={studentSheet} title="Chọn học viên" heightRatio={0.72} onClose={() => setStudentSheet(false)}>
      <PickerSheetState loading={students.isPending} error={students.isError} empty={!students.isPending && !students.isError && (students.data?.length ?? 0) === 0} emptyMessage="Không có học viên đang hoạt động." onRetry={() => void students.refetch()} />
      {!students.isPending && !students.isError ? students.data?.map((student) => <AdminListRow key={student.personId} title={student.fullName} subtitle={student.personCode} selected={student.personId === selectedStudent?.personId} onPress={() => { setSelectedStudent(student); setSelectedPlan(undefined); setSchedulesByRequirement({}); setStudentSheet(false); }} leading={<RowIcon icon={<User />} />} />) : null}
    </BottomSheetWindow>
    <BottomSheetWindow visible={planSheet} title="Chọn gói học" heightRatio={0.72} onClose={() => setPlanSheet(false)}>
      <PickerSheetState loading={catalog.isPending} error={catalog.isError} empty={!catalog.isPending && !catalog.isError && (catalog.data?.length ?? 0) === 0} emptyMessage="Hiện chưa có gói học để đăng ký." onRetry={() => void catalog.refetch()} />
      {!catalog.isPending && !catalog.isError ? catalog.data?.map((plan) => <AdminListRow key={plan.trainingPlanId} title={plan.name} subtitle={`${plan.durationMonths} tháng · ${plan.includedSessionCount} buổi · ${money(plan.finalPrice)}`} selected={plan.trainingPlanId === selectedPlan?.trainingPlanId} onPress={() => choosePlan(plan)} leading={<RowIcon icon={<Layers />} />} />) : null}
    </BottomSheetWindow>
    <ScheduleSheet requirement={options.data?.recurringRequirements.find((item) => item.requirementId === scheduleSheetFor)}
      selectedIds={scheduleSheetFor ? schedulesByRequirement[scheduleSheetFor] ?? [] : []} onClose={() => setScheduleSheetFor(undefined)} onToggle={toggleSchedule} />
    <PickerPopover visible={datePickerOpen} title="Ngày bắt đầu" subtitle="Chọn trong 30 ngày tới" options={startDateOptions} selectedValue={startDate} onSelect={(value) => { setStartDate(value); setDatePickerOpen(false); }} onClose={() => setDatePickerOpen(false)} />
    <ConfirmationSheet visible={confirmSheet} plan={selectedPlan} student={selectedStudent} startDate={startDate} requirements={options.data?.recurringRequirements ?? []} selectedIds={schedulesByRequirement} pending={purchase.isPending} onClose={() => !purchase.isPending && setConfirmSheet(false)} onSubmit={submit} />
  </>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={styles.section}><ThemedText type="subtitle">{title}</ThemedText>{children}</View>;
}

function RowIcon({ icon }: { icon: React.ReactNode }) {
  return <View style={styles.rowIcon}><AppIcon icon={icon as never} size={21} color={Colors.light.primary} /></View>;
}

function StepChoice({ icon, title, subtitle, onPress, locked = false, completed = false }: { icon: React.ReactNode; title: string; subtitle?: string; onPress: () => void; locked?: boolean; completed?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled: locked, selected: completed }} disabled={locked} onPress={onPress} style={({ pressed }) => [styles.choice, locked && styles.disabled, completed && styles.choiceComplete, pressed && !locked && effects.pressed]}>
    <View style={[styles.choiceIcon, completed && styles.choiceIconComplete]}><AppIcon icon={icon as never} size={24} color={completed ? Colors.light.success : Colors.light.primary} /></View>
    <View style={styles.flex}><ThemedText type="title" numberOfLines={2}>{title}</ThemedText>{subtitle ? <ThemedText type="bodySmall" style={styles.helper} numberOfLines={3}>{subtitle}</ThemedText> : null}</View>
    <AppIcon icon={<ChevronRight />} size={20} color={completed ? Colors.light.success : Colors.light.textSecondary} />
  </Pressable>;
}

function InlineState({ message, loading = false, actionLabel, onAction }: { message: string; loading?: boolean; actionLabel?: string; onAction?: () => void }) {
  return <SurfaceCard style={styles.inlineState}>{loading ? <ActivityIndicator color={Colors.light.primary} /> : null}<ThemedText type="bodySmall" style={styles.helper}>{message}</ThemedText>{actionLabel && onAction ? <Pressable accessibilityRole="button" onPress={onAction}><ThemedText type="action" style={styles.primaryText}>{actionLabel}</ThemedText></Pressable> : null}</SurfaceCard>;
}

function PickerSheetState({ loading, error, empty, emptyMessage, onRetry }: { loading: boolean; error: boolean; empty: boolean; emptyMessage: string; onRetry: () => void }) {
  if (loading) return <View style={styles.sheetState}><ActivityIndicator color={Colors.light.primary} /><ThemedText type="bodySmall" style={styles.helper}>Đang tải…</ThemedText></View>;
  if (error) return <View style={styles.sheetState}><ThemedText type="bodySmall" style={styles.error}>Không thể tải dữ liệu.</ThemedText><Pressable accessibilityRole="button" onPress={onRetry}><ThemedText type="action" style={styles.primaryText}>Thử lại</ThemedText></Pressable></View>;
  if (empty) return <View style={styles.sheetState}><ThemedText type="bodySmall" style={styles.helper}>{emptyMessage}</ThemedText></View>;
  return null;
}

function ScheduleSheet({ requirement, selectedIds, onClose, onToggle }: { requirement?: { requirementId: string; label: string; sessionsPerWeek: number; options: TrainingPlanScheduleOption[] }; selectedIds: string[]; onClose: () => void; onToggle: (requirementId: string, limit: number, optionId: string) => void }) {
  const full = selectedIds.length === requirement?.sessionsPerWeek;
  return <BottomSheetWindow visible={Boolean(requirement)} title={requirement?.label ?? 'Chọn lịch cố định'} heightRatio={0.76} onClose={onClose} footer={<PrimaryActionButton title={full ? 'Đã chọn đủ · Xong' : `Đã chọn ${selectedIds.length}/${requirement?.sessionsPerWeek ?? 0}`} disabled={!full} onPress={onClose} />}>
    <ThemedText type="bodySmall" style={styles.sheetHint}>Chọn đúng {requirement?.sessionsPerWeek ?? 0} ca mỗi tuần. Bạn có thể tập ghép giữa các khóa được gói cho phép.</ThemedText>
    {requirement?.options.map((option) => { const selected = selectedIds.includes(option.courseScheduleId); const disabled = !selected && full; return <AdminListRow key={option.courseScheduleId} title={`${option.dayOfWeek} · ${option.startTime}–${option.endTime}`} subtitle={`${option.courseName} · ${option.branchName}`} selected={selected} onPress={disabled ? undefined : () => onToggle(requirement.requirementId, requirement.sessionsPerWeek, option.courseScheduleId)} leading={<RowIcon icon={<Calendar />} />} />; })}
  </BottomSheetWindow>;
}

function ConfirmationSheet({ visible, plan, student, startDate, requirements, selectedIds, pending, onClose, onSubmit }: { visible: boolean; plan?: TrainingPlanCatalogItem; student?: Student; startDate: string; requirements: TrainingPlanRecurringRequirement[]; selectedIds: Record<string, string[]>; pending: boolean; onClose: () => void; onSubmit: () => void }) {
  const selections = requirements.flatMap((requirement) => requirement.options.filter((option) => (selectedIds[requirement.requirementId] ?? []).includes(option.courseScheduleId)).map((option) => ({ requirement, option })));
  return <BottomSheetWindow visible={visible} title="Xác nhận mua gói" heightRatio={0.72} onClose={onClose} footer={<PrimaryActionButton title="Thanh toán và chốt lịch" loading={pending} onPress={onSubmit} />}>
    <SurfaceCard style={styles.confirmSummary}><ThemedText type="subtitle">{plan?.name}</ThemedText><ThemedText type="bodySmall" style={styles.helper}>{student?.fullName} · bắt đầu {dateLabel(startDate)}</ThemedText><ThemedText type="heading" style={styles.price}>{money(plan?.finalPrice)}</ThemedText></SurfaceCard>
    <ThemedText type="title">Lịch sẽ được chốt</ThemedText>
    {selections.map(({ requirement, option }) => <View key={`${requirement.requirementId}-${option.courseScheduleId}`} style={styles.confirmRow}><RowIcon icon={<Clock />} /><View style={styles.flex}><ThemedText type="bodySmall" style={styles.helper}>{requirement.label}</ThemedText><ThemedText type="title">{option.dayOfWeek} · {option.startTime}–{option.endTime}</ThemedText><ThemedText type="bodySmall" style={styles.helper}>{option.courseName} · {option.branchName}</ThemedText></View></View>)}
    <ThemedText type="bodySmall" style={styles.helper}>Thanh toán thành công sẽ tạo purchase, enrollment và toàn bộ lịch cố định trong một giao dịch.</ThemedText>
  </BottomSheetWindow>;
}

const styles = StyleSheet.create({
  screen: { paddingTop: Spacing.two, paddingBottom: Spacing.six, gap: Spacing.four },
  section: { gap: Spacing.two },
  flex: { flex: 1, minWidth: 0, gap: Spacing.one },
  notice: { flexDirection: 'row', gap: Spacing.three, padding: Spacing.three },
  noticeIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: Colors.light.primarySoft },
  helper: { color: Colors.light.textSecondary },
  error: { color: Colors.light.error },
  primaryText: { color: Colors.light.primary },
  choice: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: Spacing.three, borderWidth: 1, borderColor: Colors.light.divider, borderRadius: radii.lg, backgroundColor: Colors.light.surface, padding: Spacing.three, ...effects.soft },
  choiceComplete: { borderColor: Colors.light.success },
  choiceIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: Colors.light.primarySoft },
  choiceIconComplete: { backgroundColor: Colors.light.successSoft },
  disabled: { opacity: 0.55 },
  inlineState: { alignItems: 'center', gap: Spacing.two, padding: Spacing.three },
  rowIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: Colors.light.primarySoft },
  sheetState: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.four },
  sheetHint: { color: Colors.light.textSecondary, marginBottom: Spacing.two },
  confirmSummary: { gap: Spacing.one, padding: Spacing.three },
  price: { color: Colors.light.primary, marginTop: Spacing.one },
  confirmRow: { flexDirection: 'row', gap: Spacing.three, paddingVertical: Spacing.two },
});
