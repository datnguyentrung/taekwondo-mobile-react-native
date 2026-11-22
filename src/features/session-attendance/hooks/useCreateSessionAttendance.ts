import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { SessionAttendanceCreateRequest } from "../api/session-attendance.dto";
import { sessionAttendanceApi } from "../api/sessionAttendanceApi";
import { sessionAttendanceKeys } from "./useSessionAttendance";

export function useCreateSessionAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: SessionAttendanceCreateRequest) =>
      sessionAttendanceApi.create(request),
    onSuccess: async (_response, request) => {
      await queryClient.invalidateQueries({
        queryKey: sessionAttendanceKeys.evaluation(request.classSessionId),
      });
    },
  });
}
