import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import { AppIcon } from "@/shared/ui/AppIcon";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors } from "@/theme";

import {
  asHref,
  getCommerceState,
} from "@/features/student-commerce/utils/studentCommerceUtils";
import { StudentListItem } from "@/features/student/components/StudentListItem";
import { StudentStatsCard } from "@/features/student/components/StudentStatsCard";
import {
  filterStudentsByTab,
  STUDENT_TABS,
  type StudentListTab,
} from "@/features/student/utils/studentListViewModel";

export function StudentListScreen() {
  const router = useRouter();
  const state = getCommerceState();
  const [activeTab, setActiveTab] = useState<StudentListTab>("all");

  const visibleStudents = useMemo(
    () => filterStudentsByTab(state.students, activeTab),
    [activeTab, state.students],
  );

  return (
    <StackScreenLayout title="Học viên" contentContainerStyle={styles.content}>
      <StudentStatsCard totalCount={467} activeCount={216} />
      <SegmentedControl
        options={STUDENT_TABS}
        value={activeTab}
        onChange={setActiveTab}
        style={styles.tabs}
      />
      <View style={styles.studentList}>
        {visibleStudents.map((student) => (
          <StudentListItem
            key={student.studentCode}
            student={student}
            onPress={() =>
              router.push(asHref(`/students/${student.studentCode}`))
            }
          />
        ))}
      </View>
      {visibleStudents.length === 0 ? (
        <ThemedText type="bodySmall" style={styles.helperText}>
          Chưa có học viên trong trạng thái này.
        </ThemedText>
      ) : null}
      <View style={styles.footerNote}>
        <AppIcon name="fiRrInfo" size={22} color={Colors.light.textSecondary} />
        <ThemedText type="bodySmall" style={styles.helperText}>
          Chọn học viên để xem hồ sơ, ví và khóa học.
        </ThemedText>
      </View>
    </StackScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 10,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  tabs: {
    // marginTop: 14,
    // minHeight: 52,
  },
  studentList: {
    gap: 12,
  },
  footerNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 4,
  },
  helperText: {
    flex: 1,
    color: Colors.light.textSecondary,
  },
});
