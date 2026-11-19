import { Redirect, Stack } from "expo-router";
import { Permission, useCan } from "../../../../features/authorization";

export default function UsersLayout() {
  const allowed = useCan(Permission.USER_READ);
  return allowed ? (
    <Stack screenOptions={{ headerShown: false }} />
  ) : (
    <Redirect href="/activities" />
  );
}
