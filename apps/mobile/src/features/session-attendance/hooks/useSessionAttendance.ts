import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  ClassSessionEvaluationResponse,
  EvaluationAttendance,
  EvaluationUpdateResult,
  SessionAttendanceBriefResponse,
  SessionAttendanceResponse,
} from "../api/session-attendance.dto";
import { sessionAttendanceApi } from "../api/sessionAttendanceApi";
import type {
  AttendanceStatus,
  EvaluationStatus,
} from "../constants/session-attendance.constants";
import { calculateAttendanceProgress } from "../domain/attendanceProgress";
import { canEvaluateStudent } from "../domain/sessionAttendancePresentation";
import { waitForAttendanceCommand } from "../services/attendanceCommand";

export const sessionAttendanceKeys = {
  evaluation: (classSessionId?: string) =>
    ["session-evaluation", classSessionId ?? ""] as const,
};

type UseSessionAttendanceOptions = {
  classSessionId?: string;
  onUpdateError: (message?: string) => void;
};

function toEvaluationAttendance(
  response: Pick<
    SessionAttendanceResponse | SessionAttendanceBriefResponse,
    | "sessionAttendanceId"
    | "checkInTime"
    | "attendanceStatus"
    | "evaluationStatus"
    | "note"
  >,
): EvaluationAttendance {
  return {
    sessionAttendanceId: response.sessionAttendanceId,
    checkInTime: response.checkInTime,
    attendanceStatus: response.attendanceStatus,
    evaluationStatus: response.evaluationStatus,
    note: response.note,
  };
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : undefined;
}

export function useSessionAttendance({
  classSessionId,
  onUpdateError,
}: UseSessionAttendanceOptions) {
  const queryClient = useQueryClient();
  const queryKey = sessionAttendanceKeys.evaluation(classSessionId);
  const pendingStudentIdsRef = useRef(new Set<string>());
  const pendingCountByStudentRef = useRef(new Map<string, number>());
  const latestMutationByStudentRef = useRef(new Map<string, number>());
  const activeControllersByStudentRef = useRef(new Map<string, AbortController>());
  const isMountedRef = useRef(true);
  const [pendingStudentIds, setPendingStudentIds] = useState<Set<string>>(
    () => new Set(),
  );

  useEffect(() => {
    const controllers = activeControllersByStudentRef.current;
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      controllers.forEach((controller) => {
        controller.abort();
      });
      controllers.clear();
    };
  }, []);

  useEffect(() => {
    activeControllersByStudentRef.current.forEach((controller) => {
      controller.abort();
    });
    activeControllersByStudentRef.current.clear();
  }, [classSessionId]);
  const query = useQuery<ClassSessionEvaluationResponse>({
    queryKey,
    queryFn: () => sessionAttendanceApi.getEvaluation(classSessionId as string),
    enabled: Boolean(classSessionId),
  });
  const students = useMemo(
    () => query.data?.students ?? [],
    [query.data?.students],
  );
  const stats = useMemo(() => calculateAttendanceProgress(students), [students]);

  const reconcileWithServer = useCallback(async () => {
    if (!classSessionId) return;

    try {
      await queryClient.fetchQuery({
        queryKey,
        queryFn: () => sessionAttendanceApi.getEvaluation(classSessionId),
        staleTime: 0,
      });
    } catch {
      // The command has already succeeded. Preserve the optimistic state and
      // let the next refresh reconcile when the network becomes available.
    }
  }, [classSessionId, queryClient, queryKey]);

  const setStudentPending = useCallback(
    (studentEnrollmentId: string, pending: boolean) => {
      const nextCount = Math.max(
        0,
        (pendingCountByStudentRef.current.get(studentEnrollmentId) ?? 0) +
          (pending ? 1 : -1),
      );
      if (nextCount === 0) {
        pendingCountByStudentRef.current.delete(studentEnrollmentId);
      } else {
        pendingCountByStudentRef.current.set(studentEnrollmentId, nextCount);
      }

      const next = new Set(pendingStudentIdsRef.current);
      if (nextCount > 0) next.add(studentEnrollmentId);
      else next.delete(studentEnrollmentId);
      pendingStudentIdsRef.current = next;
      setPendingStudentIds(next);
    },
    [],
  );

  const beginStudentMutation = useCallback(
    (studentEnrollmentId: string) => {
      const mutationVersion =
        (latestMutationByStudentRef.current.get(studentEnrollmentId) ?? 0) + 1;
      latestMutationByStudentRef.current.set(studentEnrollmentId, mutationVersion);
      setStudentPending(studentEnrollmentId, true);
      return mutationVersion;
    },
    [setStudentPending],
  );

  const updateAttendanceStatus = useCallback(
    async (studentEnrollmentId: string, newStatus: AttendanceStatus) => {
      if (!classSessionId) {
        return false;
      }

      await queryClient.cancelQueries({ queryKey });
      const previousData =
        queryClient.getQueryData<ClassSessionEvaluationResponse>(queryKey);
      const targetStudent = previousData?.students.find(
        ({ studentEnrollment }) =>
          studentEnrollment.studentEnrollmentId === studentEnrollmentId,
      );
      if (!previousData || !targetStudent) return false;

      const previousAttendance = targetStudent.attendance;
      const checkInTime =
        previousAttendance?.checkInTime ??
        (newStatus === "ABSENT" ? null : new Date().toISOString());
      const mutationVersion = beginStudentMutation(studentEnrollmentId);
      queryClient.setQueryData<ClassSessionEvaluationResponse>(queryKey, (current) =>
        current
          ? {
              ...current,
              students: current.students.map((item) =>
                item.studentEnrollment.studentEnrollmentId === studentEnrollmentId
                  ? {
                      ...item,
                      attendance: {
                        sessionAttendanceId:
                          previousAttendance?.sessionAttendanceId ?? "",
                        checkInTime,
                        attendanceStatus: newStatus,
                        evaluationStatus:
                          previousAttendance?.evaluationStatus ?? "PENDING",
                        note: previousAttendance?.note ?? null,
                      },
                      recorded: true,
                    }
                  : item,
              ),
            }
          : current,
      );

      try {
        if (previousAttendance?.sessionAttendanceId) {
          const receipt = await sessionAttendanceApi.updateStatus(
            previousAttendance.sessionAttendanceId,
            { attendanceStatus: newStatus },
          );
          await waitForAttendanceCommand(() =>
            sessionAttendanceApi.getCommand(receipt.requestId),
          );
          return true;
        }

        const created = await sessionAttendanceApi.create({
          classSessionId,
          studentEnrollmentId,
          attendanceStatus: newStatus,
          evaluationStatus: "PENDING",
          checkInTime,
          note: null,
        });
        if (
          latestMutationByStudentRef.current.get(studentEnrollmentId) ===
          mutationVersion
        ) {
          queryClient.setQueryData<ClassSessionEvaluationResponse>(queryKey, (current) =>
            current
            ? {
                ...current,
                students: current.students.map((item) =>
                  item.studentEnrollment.studentEnrollmentId === studentEnrollmentId
                    ? {
                        ...item,
                        attendance: toEvaluationAttendance(created),
                        recorded: true,
                      }
                    : item,
                ),
              }
              : current,
          );
        }
        return true;
      } catch (error) {
        if (
          latestMutationByStudentRef.current.get(studentEnrollmentId) ===
          mutationVersion
        ) {
          queryClient.setQueryData(queryKey, previousData);
          onUpdateError(getErrorMessage(error));
        }
        return false;
      } finally {
        setStudentPending(studentEnrollmentId, false);
        if (
          pendingCountByStudentRef.current.get(studentEnrollmentId) == null &&
          latestMutationByStudentRef.current.get(studentEnrollmentId) === mutationVersion
        ) {
          await reconcileWithServer();
        }
      }
    },
    [
      classSessionId,
      beginStudentMutation,
      onUpdateError,
      queryClient,
      queryKey,
      reconcileWithServer,
      setStudentPending,
    ],
  );

  const updateEvaluationStatus = useCallback(
    async (
      studentEnrollmentId: string,
      newStatus: EvaluationStatus,
      note?: string | null,
    ) => {
      if (!classSessionId) {
        return false;
      }

      await queryClient.cancelQueries({ queryKey });
      const previousData =
        queryClient.getQueryData<ClassSessionEvaluationResponse>(queryKey);
      const targetStudent = previousData?.students.find(
        ({ studentEnrollment }) =>
          studentEnrollment.studentEnrollmentId === studentEnrollmentId,
      );
      if (!previousData || !targetStudent || !canEvaluateStudent(targetStudent)) {
        return false;
      }

      const previousAttendance = targetStudent.attendance;
      if (!previousAttendance?.sessionAttendanceId) return false;

      activeControllersByStudentRef.current.get(studentEnrollmentId)?.abort();
      const abortController = new AbortController();
      activeControllersByStudentRef.current.set(
        studentEnrollmentId,
        abortController,
      );

      const mutationVersion = beginStudentMutation(studentEnrollmentId);
      queryClient.setQueryData<ClassSessionEvaluationResponse>(queryKey, (current) =>
        current
          ? {
              ...current,
              students: current.students.map((item) =>
                item.studentEnrollment.studentEnrollmentId === studentEnrollmentId
                  ? {
                      ...item,
                      attendance: item.attendance
                        ? {
                            ...item.attendance,
                            evaluationStatus: newStatus,
                            note: note === undefined ? item.attendance.note : note,
                          }
                        : null,
                    }
                  : item,
              ),
            }
          : current,
      );

      try {
        const receipt = await sessionAttendanceApi.updateEvaluation(
          previousAttendance.sessionAttendanceId,
          {
            evaluationStatus: newStatus,
            ...(note === undefined ? {} : { note: note ?? "" }),
          },
        );
        const command =
          await waitForAttendanceCommand<EvaluationUpdateResult>(
            () =>
              sessionAttendanceApi.getCommand<EvaluationUpdateResult>(
                receipt.requestId,
                abortController.signal,
              ),
            { signal: abortController.signal },
          );

        if (
          latestMutationByStudentRef.current.get(studentEnrollmentId) ===
          mutationVersion
        ) {
          const result = command.result;
          if (!result) {
            throw new Error("Command completed without an evaluation result.");
          }

          queryClient.setQueryData<ClassSessionEvaluationResponse>(
              queryKey,
              (current) =>
                current
                  ? {
                      ...current,
                      students: current.students.map((item) =>
                        item.studentEnrollment.studentEnrollmentId ===
                        studentEnrollmentId
                          ? {
                              ...item,
                              attendance: item.attendance
                                ? {
                                    ...item.attendance,
                                    sessionAttendanceId:
                                      result.sessionAttendanceId ||
                                      item.attendance.sessionAttendanceId,
                                    evaluationStatus:
                                      result.evaluationStatus ??
                                      item.attendance.evaluationStatus,
                                    note:
                                      result.note !== undefined
                                        ? result.note
                                        : item.attendance.note,
                                  }
                                : null,
                            }
                          : item,
                      ),
                    }
                  : current,
            );
        }
        return true;
      } catch (error) {
        if (abortController.signal.aborted || !isMountedRef.current) {
          return false;
        }
        if (
          latestMutationByStudentRef.current.get(studentEnrollmentId) ===
          mutationVersion
        ) {
          queryClient.setQueryData(queryKey, previousData);
          onUpdateError(getErrorMessage(error));
        }
        return false;
      } finally {
        if (
          activeControllersByStudentRef.current.get(studentEnrollmentId) ===
          abortController
        ) {
          activeControllersByStudentRef.current.delete(studentEnrollmentId);
        }
        if (isMountedRef.current) {
          setStudentPending(studentEnrollmentId, false);
        }
      }
    },
    [
      classSessionId,
      beginStudentMutation,
      onUpdateError,
      queryClient,
      queryKey,
      setStudentPending,
    ],
  );

  return {
    ...query,
    students,
    stats,
    pendingStudentIds,
    updateAttendanceStatus,
    updateEvaluationStatus,
  };
}
