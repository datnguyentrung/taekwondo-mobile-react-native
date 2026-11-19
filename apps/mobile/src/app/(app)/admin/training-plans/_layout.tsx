import { Redirect, Stack } from "expo-router";
import { Permission, useCan } from "../../../../features/authorization";
export default function TrainingPlansLayout() {
  return useCan(Permission.TRAINING_PLAN_READ) ? (
    <Stack screenOptions={{ headerShown: false }} />
  ) : (
    <Redirect href="/activities" />
  );
}
