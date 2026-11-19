import { Redirect, Stack } from "expo-router";
import { Permission, useCan } from "../../../../features/authorization";

export default function RolesLayout() {
  const allowed = useCan(Permission.ROLE_READ);
  return allowed ? (
    <Stack screenOptions={{ headerShown: false }} />
  ) : (
    <Redirect href="/activities" />
  );
}
