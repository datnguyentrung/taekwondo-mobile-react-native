import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { Calendar, Plus, Trash6 } from "reicon-react-native";
import { useLocalSearchParams } from "expo-router";

import { Permission, useCan } from "@/features/authorization";
import { courseApi } from "@/features/course/api/courseApi";
import type { CourseSimpleResponse } from "@/features/course/api/course.dto";
import { getApiErrorMessage } from "@/infrastructure/http/httpError";
import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import { AppIcon } from "@/shared/ui/AppIcon";
import { BottomSheetWindow } from "@/shared/ui/BottomSheetWindow";
import { CancellableLoadingOverlay } from "@/shared/ui/CancellableLoadingOverlay";
import { ConfirmationDialog } from "@/shared/ui/ConfirmationDialog";
import { FloatingActionBar } from "@/shared/ui/FloatingActionBar";
import { PickerPopover } from "@/shared/ui/PickerPopover";
import { ThemedText } from "@/shared/ui/ThemedText";
import { useToast } from "@/shared/ui/Toast";
import { AdminButton, AdminChip, AdminEmptyState, AdminListRow, AdminPickerField, AdminSearchField } from "@/shared/ui/admin/AdministrationPrimitives";
import { activeEffect, Colors, hexToRgba, radii, Spacing } from "@/theme";
import {
  SessionTypeLabel,
  SessionTypeValues,
} from "../constants/training-plan.constants";
import type { SessionType, TrainingPlanAccessRuleSimpleResponse } from "../api/trainingPlan.dto";
import { useCreateTrainingPlanAccessRule, useDeleteTrainingPlanAccessRule, useTrainingPlan, useUpdateTrainingPlanAccessRule } from "../queries/trainingPlanQueries";

const sessions = SessionTypeValues.map((value) => ({
  value,
  label: SessionTypeLabel[value],
})) satisfies readonly { value: SessionType; label: string }[];

export function TrainingPlanCoursesListScreen() {
  const { trainingPlanId } = useLocalSearchParams<{ trainingPlanId: string }>();
  const toast = useToast();
  const planQuery = useTrainingPlan(trainingPlanId);
  const coursesQuery = useQuery({ queryKey: ["courses", "access-rule-options"], queryFn: () => courseApi.list({ page: 0, size: 200 }) });
  const createRule = useCreateTrainingPlanAccessRule();
  const updateRule = useUpdateTrainingPlanAccessRule();
  const deleteRule = useDeleteTrainingPlanAccessRule();
  const canCreate = useCan(Permission.TRAINING_PLAN_ACCESS_RULE_CREATE);
  const canUpdate = useCan(Permission.TRAINING_PLAN_ACCESS_RULE_UPDATE);
  const canDelete = useCan(Permission.TRAINING_PLAN_ACCESS_RULE_DELETE);
  const deleteAbortRef = useRef<AbortController | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<TrainingPlanAccessRuleSimpleResponse>();
  const [editor, setEditor] = useState<TrainingPlanAccessRuleSimpleResponse | null | undefined>();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [courseId, setCourseId] = useState("");
  const [sessionType, setSessionType] = useState<SessionType>("STANDARD");
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { const id = setTimeout(() => setSearch(searchInput.trim().toLocaleLowerCase("vi-VN")), 250); return () => clearTimeout(id); }, [searchInput]);
  const rules = useMemo(() => (planQuery.data?.accessRules ?? []).filter((rule) => !search || [rule.targetCourseName, sessionLabel(rule.sessionType)].join(" ").toLocaleLowerCase("vi-VN").includes(search)), [planQuery.data?.accessRules, search]);
  const courses = useMemo(() => [...(coursesQuery.data?.content ?? [])].sort((a, b) => a.name.localeCompare(b.name, "vi")), [coursesQuery.data?.content]);
  const course = courses.find((item) => item.courseId === courseId);
  const openCreate = () => { setCourseId(""); setSessionType("STANDARD"); setEditor(null); };
  const openEdit = () => {
    if (!selected) return;

    setCourseId(selected.targetCourseId);
    setSessionType(selected.sessionType);
    setSelected(undefined);
    setEditor(selected);
  };
  const save = async () => {
    if (!trainingPlanId || !courseId) { toast.show({ message: "Hãy chọn khóa học.", variant: "error" }); return; }
    try {
      if (editor) await updateRule.mutateAsync({ id: editor.trainingPlanAccessRuleId, request: { targetCourseId: courseId, sessionType } });
      else await createRule.mutateAsync({ trainingPlanId, targetCourseId: courseId, sessionType });
      setEditor(undefined); setSelected(undefined);
      toast.show({ message: editor ? "Đã cập nhật khóa học áp dụng." : "Đã thêm khóa học áp dụng.", variant: "success" });
    } catch (error) { toast.show({ message: getApiErrorMessage(error, "Không thể lưu cấu hình khóa học."), variant: "error" }); }
  };
  const remove = async () => {
    if (!selected) return;
    setConfirming(false); setDeleting(true);
    const controller = new AbortController(); deleteAbortRef.current = controller;
    try { await deleteRule.mutateAsync({ id: selected.trainingPlanAccessRuleId, signal: controller.signal }); setSelected(undefined); toast.show({ message: "Đã xóa khóa học áp dụng.", variant: "success" }); }
    catch (error) { if ((error as { name?: string }).name !== "AbortError") toast.show({ message: getApiErrorMessage(error, "Không thể xóa khóa học áp dụng."), variant: "error" }); }
    finally { deleteAbortRef.current = null; setDeleting(false); }
  };
  if (planQuery.isPending) return <StackScreenLayout title="Khóa học áp dụng"><View style={styles.state}><ActivityIndicator color={Colors.light.primary} /></View></StackScreenLayout>;
  if (!planQuery.data) return <StackScreenLayout title="Khóa học áp dụng"><AdminEmptyState message="Không tìm thấy gói học." /></StackScreenLayout>;
  return <>
    <StackScreenLayout title="Khóa học áp dụng" contentContainerStyle={styles.content} refreshing={planQuery.isRefetching} onRefresh={async () => { await planQuery.refetch(); }}>
      <View style={styles.searchRow}><View style={styles.searchField}><AdminSearchField value={searchInput} onChangeText={setSearchInput} placeholder="Tìm khóa học hoặc loại buổi..." /></View>{canCreate ? <Pressable accessibilityRole="button" accessibilityLabel="Thêm khóa học áp dụng" onPress={openCreate} style={({ pressed }) => [styles.addButton, activeEffect(pressed, "pressed")]}><AppIcon icon={<Plus />} size={24} color={Colors.light.surface} /></Pressable> : null}</View>
      {rules.length ? <View style={styles.list}>{rules.map((rule) => <AdminListRow key={rule.trainingPlanAccessRuleId} title={rule.targetCourseName} subtitle={`Được dùng cho quota ${sessionLabel(rule.sessionType).toLocaleLowerCase("vi-VN")}`} leading={<View style={styles.rowIcon}><AppIcon icon={<Calendar />} size={18} color={Colors.light.primary} /></View>} meta={<View style={styles.badge}><ThemedText type="caption" style={styles.badgeText}>{sessionLabel(rule.sessionType)}</ThemedText></View>} onPress={() => setSelected(rule)} />)}</View> : <View style={styles.state}><ThemedText type="bodySmall" style={styles.empty}>{search ? "Không tìm thấy khóa học phù hợp." : "Chưa có khóa học áp dụng."}</ThemedText></View>}
    </StackScreenLayout>
    <DetailSheet
      rule={selected}
      canEdit={canUpdate}
      canDelete={canDelete}
      onClose={() => setSelected(undefined)}
      onEdit={openEdit}
      onDelete={() => setConfirming(true)}
      overlay={
        <>
          <ConfirmationDialog visible={confirming} presentation="inline" title="Xóa khóa học áp dụng" description="Thao tác này không thể hoàn tác." confirmLabel="Xóa" confirmVariant="danger" onCancel={() => setConfirming(false)} onConfirm={() => void remove()} />
          <CancellableLoadingOverlay visible={deleting} message="Đang xóa khóa học áp dụng..." onCancel={() => deleteAbortRef.current?.abort()} />
        </>
      }
    />
    <EditorSheet visible={editor !== undefined} editing={Boolean(editor)} course={course} courseOptions={courses.map((item) => ({ value: item.courseId, label: item.name, subtitle: `${item.currentStudentCount}/${item.capacity} học viên` }))} pickerVisible={pickerOpen} sessionType={sessionType} submitting={createRule.isPending || updateRule.isPending} onClose={() => { setEditor(undefined); setPickerOpen(false); }} onPickCourse={() => setPickerOpen(true)} onSelectCourse={setCourseId} onClosePicker={() => setPickerOpen(false)} onSessionTypeChange={setSessionType} onSubmit={() => void save()} />
  </>;
}

function DetailSheet({ rule, canEdit, canDelete, onClose, onEdit, onDelete, overlay }: { rule?: TrainingPlanAccessRuleSimpleResponse; canEdit: boolean; canDelete: boolean; onClose: () => void; onEdit: () => void; onDelete: () => void; overlay?: ReactNode }) {
  const actions = [
    ...(canEdit ? [{ label: "Chỉnh sửa", variant: "outline" as const, onPress: onEdit }] : []),
    ...(canDelete ? [{ key: "delete", label: "", accessibilityLabel: "Xóa khóa học áp dụng", variant: "outline" as const, flex: 0, onPress: onDelete, icon: <AppIcon icon={<Trash6 />} size={26} color={Colors.light.error} /> }] : []),
  ];

  return <BottomSheetWindow
    visible={Boolean(rule)}
    title="Khóa học áp dụng"
    heightRatio={0.5}
    onClose={onClose}
    overlay={overlay}
    footer={
      <View style={styles.detailFooterActions}>
        <FloatingActionBar compact includeBottomSafeArea={false} paddingHorizontal={0} paddingTop={0} minBottomInset={0} backgroundColor="transparent" actions={actions} />
      </View>
    }
  >
    {rule ? <View style={styles.detail}><Detail label="Khóa học" value={rule.targetCourseName} /><Detail label="Quota áp dụng" value={sessionLabel(rule.sessionType)} /></View> : null}
  </BottomSheetWindow>;
}
function EditorSheet({ visible, editing, course, courseOptions, pickerVisible, sessionType, submitting, onClose, onPickCourse, onSelectCourse, onClosePicker, onSessionTypeChange, onSubmit }: { visible: boolean; editing: boolean; course?: CourseSimpleResponse; courseOptions: { value: string; label: string; subtitle: string }[]; pickerVisible: boolean; sessionType: SessionType; submitting: boolean; onClose: () => void; onPickCourse: () => void; onSelectCourse: (courseId: string) => void; onClosePicker: () => void; onSessionTypeChange: (value: SessionType) => void; onSubmit: () => void }) { return <BottomSheetWindow visible={visible} title={editing ? "Chỉnh sửa khóa học áp dụng" : "Thêm khóa học áp dụng"} onClose={onClose} overlay={<PickerPopover visible={pickerVisible} useModal={false} title="Chọn khóa học" subtitle="Khóa học khả dụng" options={courseOptions} selectedValue={course?.courseId} onSelect={onSelectCourse} onClose={onClosePicker} />} footer={<AdminButton label={editing ? "Lưu thay đổi" : "Tạo mới"} loading={submitting} onPress={onSubmit} />}><View style={styles.editor}><AdminPickerField label="Khóa học *" valueLabel={course?.name} placeholder="Chọn khóa học" onPress={onPickCourse} /><ChoiceGroup label="Quota áp dụng" options={sessions} value={sessionType} onChange={onSessionTypeChange} /></View></BottomSheetWindow>; }
function ChoiceGroup<T extends string>({ label, options, value, onChange }: { label: string; options: readonly { value: T; label: string }[]; value: T; onChange: (value: T) => void }) { return <View style={styles.choice}><ThemedText type="featureLabel">{label}</ThemedText><View style={styles.choices}>{options.map((option) => <AdminChip key={option.value} label={option.label} selected={option.value === value} onPress={() => onChange(option.value)} />)}</View></View>; }
function Detail({ label, value }: { label: string; value: string }) { return <View style={styles.detailRow}><ThemedText type="bodySmall" style={styles.muted}>{label}</ThemedText><ThemedText type="bodySmall" style={styles.detailValue}>{value}</ThemedText></View>; }
function sessionLabel(value: SessionType) { return sessions.find((item) => item.value === value)?.label ?? value; }
const styles = StyleSheet.create({ content: { paddingTop: Spacing.two, paddingBottom: Spacing.four, gap: Spacing.four }, searchRow: { flexDirection: "row", alignItems: "center", gap: Spacing.three }, searchField: { flex: 1, minWidth: 0 }, addButton: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: radii.md, backgroundColor: Colors.light.primary }, list: { overflow: "hidden" }, rowIcon: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: radii.pill, backgroundColor: hexToRgba(Colors.light.primary, 0.1) }, muted: { color: Colors.light.textSecondary }, badge: { borderRadius: radii.pill, backgroundColor: hexToRgba(Colors.light.primary, 0.1), paddingHorizontal: 8, paddingVertical: 3 }, badgeText: { color: Colors.light.primary, fontWeight: "700" }, state: { paddingVertical: 48, alignItems: "center" }, empty: { color: Colors.light.textSecondary, textAlign: "center" }, detail: { gap: 4 }, detailRow: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Spacing.two, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.light.divider }, detailValue: { flex: 1, textAlign: "right", color: Colors.light.text }, detailFooterActions: { height: 48 }, editor: { gap: Spacing.four }, choice: { gap: Spacing.two }, choices: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two } });
