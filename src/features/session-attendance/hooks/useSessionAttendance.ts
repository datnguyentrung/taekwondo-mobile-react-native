import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useRef, useState } from "react";

import type {
  ClassSessionEvaluationResponse,
  EvaluationAttendance,
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
  response: SessionAttendanceResponse,
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
  const [pendingStudentIds, setPendingStudentIds] = useState<Set<string>>(
    () => new Set(),
  );
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
      const next = new Set(pendingStudentIdsRef.current);
      if (pending) next.add(studentEnrollmentId);
      else next.delete(studentEnrollmentId);
      pendingStudentIdsRef.current = next;
      setPendingStudentIds(next);
    },
    [],
  );

  const updateAttendanceStatus = useCallback(
    async (studentEnrollmentId: string, newStatus: AttendanceStatus) => {
      if (!classSessionId || pendingStudentIdsRef.current.has(studentEnrollmentId)) {
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
      setStudentPending(studentEnrollmentId, true);
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
          await reconcileWithServer();
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
        await reconcileWithServer();
        return true;
      } catch (error) {
        queryClient.setQueryData(queryKey, previousData);
        onUpdateError(getErrorMessage(error));
        return false;
      } finally {
        setStudentPending(studentEnrollmentId, false);
      }
    },
    [
      classSessionId,
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
      if (!classSessionId || pendingStudentIdsRef.current.has(studentEnrollmentId)) {
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

      setStudentPending(studentEnrollmentId, true);
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
        await waitForAttendanceCommand(() =>
          sessionAttendanceApi.getCommand(receipt.requestId),
        );
        await reconcileWithServer();
        return true;
      } catch (error) {
        queryClient.setQueryData(queryKey, previousData);
        onUpdateError(getErrorMessage(error));
        return false;
      } finally {
        setStudentPending(studentEnrollmentId, false);
      }
    },
    [
      classSessionId,
      onUpdateError,
      queryClient,
      queryKey,
      reconcileWithServer,
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
