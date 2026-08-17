import { useAuthStore } from "@/store/authStore";

export function useCurrentUserCode() {
  return useAuthStore(
    (state) =>
      state.activeProfile?.userInfo?.userCode ??
      state.activeContext?.userCode ??
      undefined,
  );
}
