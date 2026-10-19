import { useMemo } from "react";
import { CheckListNotes, DocText, Wallet } from "reicon-react-native";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { BeltLabel, PersonStatusLabel } from "@/features/person/constants/person.constants";
import { usePerson } from "@/features/person/queries/personQueries";
import {
  PrimaryActionButton,
  StudentSummaryCard,
  SurfaceCard,
} from "@/features/student-commerce/components/StudentCommercePrimitives";
import type { StudentRouteProps, StudentSummaryView } from "@/features/student-commerce/types";
import { asHref, formatVnd } from "@/features/student-commerce/utils/studentCommerceUtils";
import { useScreenRefresh } from "@/infrastructure/query/useScreenRefresh";
import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import { useDynamicDetailTitle } from "@/routes/navigation/utils/screenTitle";
import { AppIcon } from "@/shared/ui/AppIcon";
import { NavigationMenu, NavigationMenuItem } from "@/shared/ui/NavigationMenu";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors } from "@/theme";

export function StudentDetailScreen({ studentCode }: StudentRouteProps) {
  const router = useRouter();
  const personQuery = usePerson(studentCode);
  const { refreshing, onRefresh } = useScreenRefresh([personQuery]);

  const person = personQuery.data;

  const student: StudentSummaryView | null = useMemo(() => {
    if (!person) return null;
    return {
      personId: person.personId,
      personCode: person.personCode || person.personId.substring(0, 8).toUpperCase(),
      fullName: person.fullName,
      beltLabel: BeltLabel[person.currentBelt] || person.currentBelt || "Chưa có đai",
      statusLabel: PersonStatusLabel[person.status] || person.status || "Đang hoạt động",
    };
  }, [person]);

  const title = useDynamicDetailTitle(student, { fallback: "Học viên" });
  const activeStudentId = student?.personId || studentCode || "";

  if (personQuery.isLoading && !student) {
    return (
      <StackScreenLayout
        title={title}
        contentContainerStyle={[styles.content, styles.center]}
        refreshing={refreshing}
        onRefresh={onRefresh}
      >
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </StackScreenLayout>
    );
  }

  if (!personQuery.isLoading && !student) {
    return (
      <StackScreenLayout
        title={title}
        contentContainerStyle={[styles.content, styles.center]}
        refreshing={refreshing}
        onRefresh={onRefresh}
      >
        <ThemedText type="bodySmall" style={styles.blackText}>
          Không tìm thấy thông tin học viên.
        </ThemedText>
      </StackScreenLayout>
    );
  }

  return (
    <StackScreenLayout
      title={title}
      contentContainerStyle={styles.content}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {student ? <StudentSummaryCard student={student} /> : null}

      <View style={styles.actionRow}>
        <PrimaryActionButton
          title="Nạp tiền"
          variant="outline"
          onPress={() =>
            router.push(asHref(`/students/${activeStudentId}/top-up`))
          }
        />
        <PrimaryActionButton
          title="Đăng ký khóa học"
          onPress={() =>
            router.push(
              asHref(`/students/${activeStudentId}/course-registration`),
            )
          }
        />
      </View>

      <SurfaceCard>
        <View style={styles.row}>
          <AppIcon icon={<Wallet />} size={24} color={Colors.light.primary} />
          <ThemedText type="bodySmall" style={styles.blackText}>
            Ví điện tử
          </ThemedText>
        </View>
        <ThemedText type="heading" style={styles.blackText}>
          {formatVnd(0)}
        </ThemedText>
        <ThemedText type="bodySmall" style={styles.blackText}>
          Số dư khả dụng
        </ThemedText>
        <Pressable
          onPress={() =>
            router.push(asHref(`/students/${activeStudentId}/wallet`))
          }
        >
          <ThemedText type="action" style={styles.primaryText}>
            Xem chi tiết ví ›
          </ThemedText>
        </Pressable>
      </SurfaceCard>

      <NavigationMenu>
        <NavigationMenuItem
          icon={<DocText />}
          title="Khóa học đang học"
          count={0}
          onPress={() =>
            router.push(asHref(`/students/${activeStudentId}/courses`))
          }
        />
        <NavigationMenuItem
          icon={<CheckListNotes />}
          title="Lịch sử tập luyện"
          onPress={() => router.push(asHref("/history/student"))}
        />
      </NavigationMenu>
    </StackScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 20,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  blackText: {
    color: Colors.light.text,
  },
  primaryText: {
    color: Colors.light.primary,
  },
});
