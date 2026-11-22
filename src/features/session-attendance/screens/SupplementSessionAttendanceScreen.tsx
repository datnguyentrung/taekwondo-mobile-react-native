import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { ChevronRight, Plus, User } from "reicon-react-native";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { useClassSessionDetail } from "@/features/class-session/queries/classSessionQueries";
import { usePeople, type PersonSimpleResponse } from "@/features/person";
import {
  AttendanceStatusLabel,
  AttendanceStatusValues,
  EvaluationStatusLabel,
  type AttendanceStatus,
  type EvaluationStatus,
} from "@/features/session-attendance/constants/session-attendance.constants";
import { useCreateSessionAttendance } from "@/features/session-attendance/hooks/useCreateSessionAttendance";
import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { AppIcon } from "@/shared/ui/AppIcon";
import { AdminPickerSheet } from "@/shared/ui/admin/AdministrationPrimitives";
import { BottomSheetWindow } from "@/shared/ui/BottomSheetWindow";
import { FloatingActionBar } from "@/shared/ui/FloatingActionBar";
import { ThemedText } from "@/shared/ui/ThemedText";
import { useToast } from "@/shared/ui/Toast/ToastProvider";
import { Colors, effects, radii } from "@/theme";

type Picker = "person" | "attendance" | "evaluation" | null;

const evaluationStatuses: EvaluationStatus[] = ["PENDING", "GOOD", "AVERAGE", "WEAK"];

export function SupplementSessionAttendanceScreen({
  classSessionId,
}: {
  classSessionId?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [picker, setPicker] = useState<Picker>(null);
  const [selectedPerson, setSelectedPerson] =
    useState<PersonSimpleResponse | null>(null);
  const [attendanceStatus, setAttendanceStatus] =
    useState<AttendanceStatus>("PRESENT");
  const [evaluationStatus, setEvaluationStatus] =
    useState<EvaluationStatus>("PENDING");
  const [note, setNote] = useState("");
  const [personSearch, setPersonSearch] = useState("");
  const debouncedPersonSearch = useDebounce(personSearch, 350);
  const peopleQuery = usePeople({
    isStudent: true,
    search: debouncedPersonSearch.trim() || undefined,
    size: 200,
    sort: "fullName,asc",
  });
  const sessionQuery = useClassSessionDetail(classSessionId);
  const createAttendance = useCreateSessionAttendance();
  const people = useMemo(() => peopleQuery.data?.content ?? [], [peopleQuery.data]);
  const personOptions = useMemo(
    () =>
      people.map((person) => ({
        value: person.personId,
        label: person.fullName,
        description: person.personCode ?? "Chưa có mã học viên",
      })),
    [people],
  );
  const session = sessionQuery.data;

  const submit = async () => {
    if (!classSessionId || !selectedPerson) return;

    try {
      await createAttendance.mutateAsync({
        classSessionId,
        personId: selectedPerson.personId,
        attendanceStatus,
        evaluationStatus,
        checkInTime: new Date().toISOString(),
        note: note.trim() || null,
      });
      toast.show({ message: "Đã bổ sung điểm danh.", variant: "success" });
      router.back();
    } catch (error) {
      toast.show({
        message:
          error instanceof Error
            ? error.message
            : "Không thể bổ sung điểm danh. Vui lòng thử lại.",
        variant: "error",
      });
    }
  };

  const pickerTitle =
    picker === "person"
      ? "Chọn học viên"
      : picker === "attendance"
        ? "Trạng thái điểm danh"
        : "Trạng thái đánh giá";

  return (
    <StackScreenLayout
      title="Bổ sung điểm danh"
      refreshEnabled={false}
      floatingContent={
        <FloatingActionBar
          actions={[
            {
              label: "Bổ sung điểm danh",
              variant: "primary",
              disabled: !classSessionId || !selectedPerson,
              loading: createAttendance.isPending,
              onPress: submit,
              accessibilityLabel: "Lưu bổ sung điểm danh",
              icon: <AppIcon icon={<Plus />} size={20} color={Colors.light.surface} />,
            },
          ]}
        />
      }
    >
      <View style={styles.content}>
        {!classSessionId ? (
          <View style={styles.stateBox}>
            <ThemedText type="body" style={styles.stateTitle}>
              Thiếu mã buổi tập
            </ThemedText>
          </View>
        ) : (
          <>
          <View style={styles.introCard}>
            <View style={styles.introIcon}>
              <AppIcon icon={<User />} size={24} color={Colors.light.primary} />
            </View>
            <View style={styles.introCopy}>
              <ThemedText type="title" style={styles.title}>
                Bổ sung điểm danh
              </ThemedText>
              <ThemedText type="bodySmall" style={styles.description}>
                Ghi nhận thêm một học viên cho đúng buổi học hiện tại.
              </ThemedText>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText type="subtitle" style={styles.fieldLabel}>
              Buổi học
            </ThemedText>
            <View style={styles.readonlyField}>
              <ThemedText type="body" style={styles.selectValue} numberOfLines={1}>
                {session?.course?.name ?? "Buổi học đang chọn"}
              </ThemedText>
              <ThemedText type="bodySmall" style={styles.personCode}>
                {session
                  ? `${session.sessionDate} · ${session.startTime ?? ""}`
                  : "Đang tải thông tin buổi học..."}
              </ThemedText>
            </View>
          </View>

          <FieldSelect
            label="Học viên"
            value={selectedPerson?.fullName ?? "Chọn học viên"}
            detail={selectedPerson?.personCode}
            placeholder={!selectedPerson}
            onPress={() => setPicker("person")}
          />
          <FieldSelect
            label="Điểm danh"
            value={AttendanceStatusLabel[attendanceStatus]}
            onPress={() => setPicker("attendance")}
          />
          <FieldSelect
            label="Đánh giá"
            value={EvaluationStatusLabel[evaluationStatus]}
            onPress={() => setPicker("evaluation")}
          />

          <View style={styles.fieldGroup}>
            <ThemedText type="subtitle" style={styles.fieldLabel}>
              Ghi chú
            </ThemedText>
            <TextInput
              accessibilityLabel="Ghi chú điểm danh"
              value={note}
              onChangeText={setNote}
              placeholder="Nhập ghi chú (nếu có)"
              placeholderTextColor={Colors.light.textSecondary}
              multiline
              maxLength={500}
              style={styles.noteInput}
            />
          </View>

          <AdminPickerSheet
            visible={picker === "person"}
            title="Chọn học viên"
            options={personOptions}
            selectedValue={selectedPerson?.personId}
            searchable
            searchPlaceholder="Tìm tên hoặc mã học viên..."
            searchValue={personSearch}
            onSearchChange={setPersonSearch}
            loading={peopleQuery.isFetching}
            onSelect={(personId) => {
              const person = people.find((item) => item.personId === personId);
              if (person) setSelectedPerson(person);
            }}
            onClose={() => {
              setPersonSearch("");
              setPicker(null);
            }}
          />

          <BottomSheetWindow
            visible={picker === "attendance" || picker === "evaluation"}
            title={pickerTitle}
            accessibilityLabel={pickerTitle}
            onClose={() => setPicker(null)}
          >
            <View style={styles.optionList}>
                {(picker === "attendance" ? AttendanceStatusValues : evaluationStatuses).map(
                  (status) => {
                    const selected =
                      picker === "attendance"
                        ? attendanceStatus === status
                        : evaluationStatus === status;
                    const label =
                      picker === "attendance"
                        ? AttendanceStatusLabel[status as AttendanceStatus]
                        : EvaluationStatusLabel[status as EvaluationStatus];
                    return (
                      <Pressable
                        key={status}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        onPress={() => {
                          if (picker === "attendance") {
                            setAttendanceStatus(status as AttendanceStatus);
                          } else {
                            setEvaluationStatus(status as EvaluationStatus);
                          }
                          setPicker(null);
                        }}
                        style={({ pressed }) => [
                          styles.statusOption,
                          selected ? styles.personOptionSelected : null,
                          pressed ? styles.pressed : null,
                        ]}
                      >
                        <ThemedText type="body" style={styles.selectValue}>
                          {label}
                        </ThemedText>
                      </Pressable>
                    );
                  },
                )}
            </View>
          </BottomSheetWindow>
          </>
        )}
      </View>
    </StackScreenLayout>
  );
}

function FieldSelect({
  label,
  value,
  detail,
  placeholder = false,
  onPress,
}: {
  label: string;
  value: string;
  detail?: string | null;
  placeholder?: boolean;
  onPress: () => void;
}) {
  return (
    <View style={styles.fieldGroup}>
      <ThemedText type="subtitle" style={styles.fieldLabel}>
        {label}
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={({ pressed }) => [styles.selectField, pressed ? styles.pressed : null]}
      >
        <View style={styles.selectTextWrap}>
          <ThemedText
            type="body"
            numberOfLines={1}
            style={placeholder ? styles.placeholder : styles.selectValue}
          >
            {value}
          </ThemedText>
          {detail ? (
            <ThemedText type="bodySmall" style={styles.personCode}>
              {detail}
            </ThemedText>
          ) : null}
        </View>
        <AppIcon icon={<ChevronRight />} size={18} color={Colors.light.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 20, paddingHorizontal: 16, paddingBottom: 128 },
  stateBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  stateTitle: { color: Colors.light.text, fontWeight: "700" },
  introCard: {
    flexDirection: "row",
    gap: 14,
    padding: 16,
    borderRadius: radii.md,
    backgroundColor: Colors.light.surface,
    ...effects.soft,
  },
  introIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    backgroundColor: Colors.light.backgroundElement,
  },
  introCopy: { flex: 1, gap: 4 },
  title: { color: Colors.light.text },
  description: { color: Colors.light.textSecondary },
  fieldGroup: { marginTop: 24 },
  fieldLabel: { color: Colors.light.text, marginBottom: 12 },
  selectField: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 20,
    borderRadius: radii.md,
    backgroundColor: Colors.light.surface,
    ...effects.soft,
  },
  readonlyField: {
    gap: 3,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: radii.md,
    backgroundColor: Colors.light.backgroundElement,
  },
  selectTextWrap: { flex: 1, gap: 2 },
  selectValue: { color: Colors.light.text },
  placeholder: { color: Colors.light.textSecondary },
  personCode: { color: Colors.light.textSecondary },
  noteInput: {
    minHeight: 96,
    padding: 16,
    borderRadius: radii.md,
    color: Colors.light.text,
    backgroundColor: Colors.light.surface,
    textAlignVertical: "top",
    ...effects.soft,
  },
  optionList: { gap: 8, paddingBottom: 12 },
  statusOption: {
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: radii.md,
    backgroundColor: Colors.light.surface,
  },
  personOptionSelected: { borderWidth: 1, borderColor: Colors.light.primary },
  pressed: { opacity: 0.75 },
});
