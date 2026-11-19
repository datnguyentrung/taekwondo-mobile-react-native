import { Redirect, Stack } from "expo-router";
import { Permission, useCan } from "../../../../features/authorization";

export default function PermissionsLayout() {
  const allowed = useCan(Permission.PERMISSION_READ);
  return allowed ? (
    <Stack screenOptions={{ headerShown: false }} />
  ) : (
    <Redirect href="/activities" />
  );
}
