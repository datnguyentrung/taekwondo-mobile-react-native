import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { StyleSheet, View } from "react-native";

import type { RelationshipType } from "@/features/authentication/domain/auth.types";
import type { UserDetail, UserSimpleResponse } from "@/features/user/api/user.dto";
import type { UserStatus } from "@/features/user/constants/user.constants";
import { userStatusLabel } from "@/features/user/domain/userViewModel";
import { AdminChip } from "@/shared/ui/admin/AdministrationPrimitives";
import { ThemedText } from "@/shared/ui/ThemedText";
import { initials } from "@/shared/utils/string";
import { Colors, radii } from "@/theme";

export const userStatuses = [
  "ACTIVE",
  "PENDING",
  "DEACTIVATED",
  "BANNED",
] as const satisfies readonly UserStatus[];

export const userRelationships = [
  "OWNER",
  "GUARDIAN",
  "MANAGER",
] as const satisfies readonly RelationshipType[];

export function useUserId() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  return Array.isArray(userId) ? userId[0] : userId;
}

export function navigate(router: ReturnType<typeof useRouter>, path: string) {
  router.push(path as Href);
}

export function getPrimaryPerson(
  user?: UserSimpleResponse | UserDetail | null,
) {
  if (!user) return null;
  if ("persons" in user && Array.isArray(user.persons)) {
    return user.persons[0] ?? null;
  }
  if ("person" in user && Array.isArray(user.person)) {
    return user.person[0] ?? null;
  }
  return null;
}

export function userMatchesSearch(user: UserSimpleResponse, search: string) {
  const needle = search.trim().toLocaleLowerCase("vi-VN");
  if (!needle) return true;

  const values = [
    user.phoneNumber,
    ...user.persons.flatMap((person) => [person.fullName, person.personCode]),
  ];

  return values.some((value) =>
    value?.toLocaleLowerCase("vi-VN").includes(needle),
  );
}

export function Avatar({ name }: { name?: string | null }) {
  return (
    <View style={userAdminStyles.avatar}>
      <ThemedText type="featureLabel" style={userAdminStyles.avatarText}>
        {initials(name)}
      </ThemedText>
    </View>
  );
}

export function StatusChip({ status }: { status?: UserStatus | null }) {
  const tone =
    status === "ACTIVE"
      ? "success"
      : status === "PENDING"
        ? "warning"
        : status === "BANNED"
          ? "danger"
          : "neutral";

  return <AdminChip label={userStatusLabel(status)} tone={tone} />;
}

export const userAdminStyles = StyleSheet.create({
  list: { overflow: "hidden", borderRadius: radii.md },
  zeroPadding: { padding: 0, overflow: "hidden" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.primarySoft,
  },
  avatarText: { color: Colors.light.primary },
});
