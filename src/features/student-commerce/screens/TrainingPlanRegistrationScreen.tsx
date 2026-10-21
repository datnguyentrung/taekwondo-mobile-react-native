import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/authentication/store/auth.store';
import { useRegistrationStudentSearch } from '@/features/student-commerce/queries/courseRegistrationQueries';
import type { CourseRegistrationStudentView } from '@/features/student-commerce/types';
import { usePurchaseTrainingPlan, useTrainingPlanCatalog, useTrainingPlanOptions } from '@/features/training-plan-registration';
import type { TrainingPlanCatalogItem, TrainingPlanScheduleOption } from '@/features/training-plan-registration';
import StackScreenLayout from '@/routes/navigation/layouts/StackScreenLayout';
import { BottomSheetWindow } from '@/shared/ui/BottomSheetWindow';
import { ThemedText } from '@/shared/ui/ThemedText';
import { PrimaryActionButton, SurfaceCard } from '@/shared/ui/commerce/CommercePrimitives';
import { Colors, radii } from '@/theme';

type Props = { initialCourseId?: string; initialPackageId?: string; studentCode?: string };
type Student = Pick<CourseRegistrationStudentView, 'personId' | 'fullName' | 'personCode'>;

const today = () => new Date().toISOString().slice(0, 10);
const money = (value?: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value ?? 0);

export function TrainingPlanRegistrationScreen({ initialCourseId, studentCode: _studentCode }: Props) {
  const context = useAuthStore((state) => state.activeContext);
  const user = useAuthStore((state) => state.user);
  const canChooseStudent = Boolean(user?.roles.some((role) => role === 'SUPER_ADMIN' || role === 'SYSTEM_ADMIN' || role === 'ROLE_MANAGER_SENIOR'));
  const contextStudent = useMemo<Student | undefined>(() => context?.personId ? {
    personId: context.personId,
    personCode: context.personCode ?? context.personId,
    fullName: context.displayName,
  } : undefined, [context]);
  const [selectedStudent, setSelectedStudent] = useState<Student | undefined>(contextStudent);
  const [studentSheet, setStudentSheet] = useState(false);
  const [planSheet, setPlanSheet] = useState(false);
  const [homeCourseSheet, setHomeCourseSheet] = useState(false);
  const [scheduleSheetFor, setScheduleSheetFor] = useState<string>();
  const [confirmSheet, setConfirmSheet] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<TrainingPlanCatalogItem>();
  const [homeCourseId, setHomeCourseId] = useState<string | undefined>(initialCourseId);
  const [startDate, setStartDate] = useState(today());
  const [schedulesByRequirement, setSchedulesByRequirement] = useState<Record<string, string[]>>({});
  const reference = useRef(`TP-MOBILE-${Date.now()}`);
  const queryClient = useQueryClient();
  const students = useRegistrationStudentSearch('', canChooseStudent && studentSheet);
  const catalog = useTrainingPlanCatalog(selectedStudent?.personId);
  const options = useTrainingPlanOptions(selectedPlan?.trainingPlanId, homeCourseId, startDate);
  const purchase = usePurchaseTrainingPlan();

  useEffect(() => {
    if (!canChooseStudent) setSelectedStudent(contextStudent);
  }, [canChooseStudent, contextStudent]);
  useEffect(() => {
    if (!selectedPlan) return;
    const permitted = selectedPlan.homeCourses.some((course) => course.courseId === homeCourseId);
    if (!permitted) setHomeCourseId(initialCourseId && selectedPlan.homeCourses.some((course) => course.courseId === initialCourseId) ? initialCourseId : undefined);
    setSchedulesByRequirement({});
  }, [selectedPlan, homeCourseId, initialCourseId]);
  useEffect(() => setSchedulesByRequirement({}), [homeCourseId, startDate]);

  const validRecurring = options.data?.recurringRequirements.every((requirement) =>
    (schedulesByRequirement[requirement.requirementId] ?? []).length === requirement.sessionsPerWeek,
  ) ?? false;
  const canConfirm = Boolean(selectedStudent && selectedPlan && homeCourseId && options.data && validRecurring);

  const choosePlan = (plan: TrainingPlanCatalogItem) => {
    setSelectedPlan(plan);
    setHomeCourseId(initialCourseId && plan.homeCourses.some((course) => course.courseId === initialCourseId) ? initialCourseId : undefined);
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
    if (!selectedStudent || !selectedPlan || !homeCourseId || !options.data) return;
    purchase.mutate({
      studentPersonId: selectedStudent.personId,
      trainingPlanId: selectedPlan.trainingPlanId,
      homeCourseId,
      startDate,
      recurringSchedules: Object.entries(schedulesByRequirement).flatMap(([requirementId, scheduleIds]) =>
        scheduleIds.map((courseScheduleId) => ({ requirementId, courseScheduleId }))),
      externalReference: reference.current,
      note: `Đăng ký ${selectedPlan.name}`,
    }, {
      onSuccess: () => {
        setConfirmSheet(false);
        void queryClient.invalidateQueries({ queryKey: ['wallet'] });
        void queryClient.invalidateQueries({ queryKey: ['student-enrollments'] });
        void queryClient.invalidateQueries({ queryKey: ['training-plan-registration'] });
      },
    });
  };

  return <>
    <StackScreenLayout title="Đăng ký chương trình" contentContainerStyle={styles.screen}>
      <ThemedText type="bodySmall" style={styles.helper}>Chọn chương trình và lịch cố định. Buổi tập ghép được đặt sau khi đăng ký.</ThemedText>
      <Section title="Học viên">
        <ChoiceCard title={selectedStudent?.fullName ?? 'Chọn học viên'} subtitle={selectedStudent?.personCode}
          locked={!canChooseStudent} onPress={() => canChooseStudent && setStudentSheet(true)} />
      </Section>
      <Section title="Chương trình">
        <ChoiceCard title={selectedPlan?.name ?? 'Chọn chương trình'} subtitle={selectedPlan ? `${selectedPlan.durationMonths} tháng · ${selectedPlan.includedSessionCount} buổi · ${money(selectedPlan.finalPrice)}` : undefined}
          onPress={() => setPlanSheet(true)} />
      </Section>
      <Section title="Lớp chính">
        <ChoiceCard title={selectedPlan?.homeCourses.find((course) => course.courseId === homeCourseId)?.name ?? 'Chọn lớp chính'}
          subtitle={selectedPlan ? 'Chỉ hiển thị lớp được chương trình cho phép' : 'Chọn chương trình trước'}
          disabled={!selectedPlan} onPress={() => setHomeCourseSheet(true)} />
      </Section>
      <Section title="Ngày bắt đầu">
        <SurfaceCard><ThemedText type="body">{startDate}</ThemedText><View style={styles.dateButtons}>
          <PrimaryActionButton title="Hôm nay" variant="outline" onPress={() => setStartDate(today())} />
        </View></SurfaceCard>
      </Section>
      {options.isFetching ? <ThemedText type="bodySmall" style={styles.helper}>Đang tải các lịch phù hợp…</ThemedText> : null}
      {options.data?.recurringRequirements.map((requirement) => {
        const ids = schedulesByRequirement[requirement.requirementId] ?? [];
        return <Section key={requirement.requirementId} title={requirement.label}>
          <ChoiceCard title={ids.length ? `Đã chọn ${ids.length}/${requirement.sessionsPerWeek} lịch` : `Chọn ${requirement.sessionsPerWeek} lịch`}
            subtitle={requirement.homeCourseOnly ? 'Chỉ lớp chính' : 'Có thể tập ghép theo quyền của chương trình'}
            onPress={() => setScheduleSheetFor(requirement.requirementId)} />
        </Section>;
      })}
      {options.data?.flexRequirements.map((requirement) => <SurfaceCard key={requirement.requirementId} style={styles.flexCard}>
        <ThemedText type="subtitle">Quyền tập ghép linh hoạt</ThemedText>
        <ThemedText type="bodySmall" style={styles.helper}>{requirement.description} · {requirement.sessionsPerWeek} buổi/tuần</ThemedText>
      </SurfaceCard>)}
      {purchase.isError ? <ThemedText type="bodySmall" style={styles.error}>Không thể đăng ký. Kiểm tra quota, lịch và số dư rồi thử lại.</ThemedText> : null}
      <PrimaryActionButton title="Xem lại và thanh toán" disabled={!canConfirm} onPress={() => setConfirmSheet(true)} />
    </StackScreenLayout>

    <BottomSheetWindow visible={studentSheet} title="Chọn học viên" heightRatio={0.72} onClose={() => setStudentSheet(false)}>
      {students.data?.map((student) => <Option key={student.personId} title={student.fullName} subtitle={student.personCode}
        selected={student.personId === selectedStudent?.personId} onPress={() => { setSelectedStudent(student); setStudentSheet(false); setSelectedPlan(undefined); }} />)}
    </BottomSheetWindow>
    <BottomSheetWindow visible={planSheet} title="Chọn chương trình" heightRatio={0.72} onClose={() => setPlanSheet(false)}>
      {catalog.data?.map((plan) => <Option key={plan.trainingPlanId} title={plan.name}
        subtitle={`${plan.durationMonths} tháng · ${plan.includedSessionCount} buổi · ${money(plan.finalPrice)}`}
        selected={plan.trainingPlanId === selectedPlan?.trainingPlanId} onPress={() => choosePlan(plan)} />)}
    </BottomSheetWindow>
    <BottomSheetWindow visible={homeCourseSheet} title="Chọn lớp chính" onClose={() => setHomeCourseSheet(false)}>
      {selectedPlan?.homeCourses.map((course) => <Option key={course.courseId} title={course.name} subtitle={`Sức chứa ${course.capacity}`}
        selected={course.courseId === homeCourseId} onPress={() => { setHomeCourseId(course.courseId); setHomeCourseSheet(false); }} />)}
    </BottomSheetWindow>
    <ScheduleSheet requirement={options.data?.recurringRequirements.find((item) => item.requirementId === scheduleSheetFor)}
      selectedIds={scheduleSheetFor ? schedulesByRequirement[scheduleSheetFor] ?? [] : []} onClose={() => setScheduleSheetFor(undefined)} onToggle={toggleSchedule} />
    <BottomSheetWindow visible={confirmSheet} title="Xác nhận đăng ký" heightRatio={0.54} onClose={() => setConfirmSheet(false)} footer={<PrimaryActionButton title="Thanh toán" loading={purchase.isPending} onPress={submit} />}>
      <ThemedText type="subtitle">{selectedPlan?.name}</ThemedText>
      <ThemedText type="bodySmall" style={styles.helper}>{selectedStudent?.fullName} · bắt đầu {startDate}</ThemedText>
      <ThemedText type="heading" style={styles.price}>{money(selectedPlan?.finalPrice)}</ThemedText>
      <ThemedText type="bodySmall" style={styles.helper}>Các buổi linh hoạt sẽ được đặt sau khi enrollment được tạo.</ThemedText>
    </BottomSheetWindow>
  </>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <View style={styles.section}><ThemedText type="subtitle">{title}</ThemedText>{children}</View>; }
function ChoiceCard({ title, subtitle, onPress, disabled, locked }: { title: string; subtitle?: string; onPress?: () => void; disabled?: boolean; locked?: boolean }) {
  return <Pressable disabled={disabled || locked} onPress={onPress} accessibilityRole="button" accessibilityState={{ disabled: Boolean(disabled || locked) }} style={({ pressed }) => [styles.choice, (disabled || locked) ? styles.disabled : null, pressed ? styles.pressed : null]}>
    <ThemedText type="body">{title}</ThemedText>{subtitle ? <ThemedText type="bodySmall" style={styles.helper}>{subtitle}</ThemedText> : null}
  </Pressable>;
}
function Option({ title, subtitle, selected, onPress }: { title: string; subtitle?: string; selected?: boolean; onPress: () => void }) { return <ChoiceCard title={title} subtitle={[subtitle, selected ? 'Đã chọn' : undefined].filter(Boolean).join(' · ')} onPress={onPress} />; }
function ScheduleSheet({ requirement, selectedIds, onClose, onToggle }: { requirement?: { requirementId: string; label: string; sessionsPerWeek: number; options: TrainingPlanScheduleOption[] }; selectedIds: string[]; onClose: () => void; onToggle: (requirementId: string, limit: number, optionId: string) => void }) {
  return <BottomSheetWindow visible={Boolean(requirement)} title={requirement?.label ?? 'Chọn lịch'} heightRatio={0.72} onClose={onClose}>
    {requirement?.options.map((option) => <Option key={option.courseScheduleId} title={`${option.dayOfWeek} · ${option.startTime}–${option.endTime}`} subtitle={`${option.courseName} · ${option.branchName}${selectedIds.includes(option.courseScheduleId) ? ' · Đã chọn' : ''}`} onPress={() => onToggle(requirement.requirementId, requirement.sessionsPerWeek, option.courseScheduleId)} />)}
  </BottomSheetWindow>;
}

const styles = StyleSheet.create({
  screen: { paddingTop: 20, paddingBottom: 40, gap: 16 }, section: { gap: 8 }, helper: { color: Colors.light.textSecondary }, error: { color: Colors.light.error },
  choice: { borderWidth: 1, borderColor: Colors.light.divider, borderRadius: radii.lg, backgroundColor: Colors.light.surface, padding: 16, gap: 4 },
  disabled: { opacity: 0.55 }, pressed: { opacity: 0.75 }, flexCard: { gap: 6 }, dateButtons: { marginTop: 10, alignSelf: 'flex-start', minWidth: 120 }, price: { color: Colors.light.primary, marginTop: 18 },
});
