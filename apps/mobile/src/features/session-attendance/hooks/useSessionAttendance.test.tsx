import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import React from "react";

import type {
  ClassSessionEvaluationResponse,
  EvaluationStudent,
} from "../api/session-attendance.dto";
import { sessionAttendanceApi } from "../api/sessionAttendanceApi";
import { waitForAttendanceCommand } from "../services/attendanceCommand";
import { useSessionAttendance } from "./useSessionAttendance";

jest.mock("../api/sessionAttendanceApi", () => ({
  sessionAttendanceApi: {
    getEvaluation: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
    updateEvaluation: jest.fn(),
    getCommand: jest.fn(),
  },
}));

jest.mock("../services/attendanceCommand", () => ({
  waitForAttendanceCommand: jest.fn().mockResolvedValue({ status: "SUCCEEDED" }),
}));

const api = sessionAttendanceApi as jest.Mocked<typeof sessionAttendanceApi>;

function student(
  attendanceStatus: "PRESENT" | "LATE" | "ABSENT" = "PRESENT",
  evaluationStatus: "PENDING" | "GOOD" | "AVERAGE" | "WEAK" = "PENDING",
): EvaluationStudent {
  return {
    studentEnrollment: {
      studentEnrollmentId: "enrollment-1",
      studentPerson: {
        personId: "person-1",
        fullName: "Nguyễn Văn A",
        currentBelt: "C10",
      },
    },
    attendance: {
      sessionAttendanceId: "attendance-1",
      attendanceStatus,
      evaluationStatus,
      checkInTime: "2026-11-08T09:00:00",
      note: null,
    },
    recorded: true,
  };
}

function response(studentRow: EvaluationStudent): ClassSessionEvaluationResponse {
  return {
    classSession: {
      classSessionId: "session-1",
      course: { courseId: "course-1", name: "Taekwondo", level: "BASIC" },
      scheduleLevel: "BASIC",
      sessionDate: "2026-11-08",
      status: "ACTIVE",
      attendanceClosed: false,
      startTime: "09:00:00",
      endTime: "10:00:00",
    },
    students: [studentRow],
  };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  function TestQueryClientProvider({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return TestQueryClientProvider;
}

describe("useSessionAttendance optimistic updates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reconciles an optimistic attendance status with the server result", async () => {
    api.getEvaluation
      .mockResolvedValueOnce(response(student("PRESENT")))
      .mockResolvedValueOnce(response(student("LATE")));
    api.updateStatus.mockResolvedValue({
      requestId: "command-1",
      type: "SESSION_ATTENDANCE_STATUS_UPDATE",
      status: "QUEUED",
      message: "Queued",
    });

    const rendered = renderHook(
      () =>
        useSessionAttendance({
          classSessionId: "session-1",
          onUpdateError: jest.fn(),
        }),
      { wrapper: createWrapper() },
    );
    const { result } = await rendered;

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await act(async () => {
      await result.current.updateAttendanceStatus("enrollment-1", "PRESENT");
    });

    expect(result.current.students[0].attendance?.attendanceStatus).toBe("LATE");
    expect(api.getEvaluation).toHaveBeenCalledTimes(2);
  });

  it("rolls back an optimistic evaluation when Java rejects the update request", async () => {
    const onUpdateError = jest.fn();
    api.getEvaluation.mockResolvedValue(response(student("PRESENT", "AVERAGE")));
    api.updateEvaluation.mockRejectedValue(new Error("Điểm danh đã đóng"));

    const rendered = renderHook(
      () =>
        useSessionAttendance({
          classSessionId: "session-1",
          onUpdateError,
        }),
      { wrapper: createWrapper() },
    );
    const { result } = await rendered;

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await act(async () => {
      await result.current.updateEvaluationStatus("enrollment-1", "GOOD");
    });

    expect(result.current.students[0].attendance?.evaluationStatus).toBe("AVERAGE");
    expect(onUpdateError).toHaveBeenCalledWith("Điểm danh đã đóng");
  });

  it("updates evaluation using command result and does not fetch full evaluation on success", async () => {
    const onUpdateError = jest.fn();
    api.getEvaluation.mockResolvedValue(response(student("PRESENT", "AVERAGE")));
    api.updateEvaluation.mockResolvedValue({
      requestId: "command-eval-1",
      type: "SESSION_ATTENDANCE_EVALUATION_UPDATE",
      status: "QUEUED",
      message: "Queued",
    });
    (waitForAttendanceCommand as jest.Mock).mockResolvedValueOnce({
      requestId: "command-eval-1",
      type: "SESSION_ATTENDANCE_EVALUATION_UPDATE",
      status: "SUCCEEDED",
      result: {
        sessionAttendanceId: "att-1",
        classSessionId: "session-1",
        evaluationStatus: "GOOD",
        note: "Tập luyện rất tích cực",
      },
    });

    const rendered = renderHook(
      () =>
        useSessionAttendance({
          classSessionId: "session-1",
          onUpdateError,
        }),
      { wrapper: createWrapper() },
    );
    const { result } = await rendered;

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.getEvaluation).toHaveBeenCalledTimes(1);

    await act(async () => {
      const success = await result.current.updateEvaluationStatus(
        "enrollment-1",
        "GOOD",
        "Tập luyện rất tích cực",
      );
      expect(success).toBe(true);
    });

    // Directly updated in cache from command result
    expect(result.current.students[0].attendance?.evaluationStatus).toBe("GOOD");
    expect(result.current.students[0].attendance?.note).toBe("Tập luyện rất tích cực");
    // Verify GET evaluation was NOT called again
    expect(api.getEvaluation).toHaveBeenCalledTimes(1);
    expect(onUpdateError).not.toHaveBeenCalled();
  });

  it("rolls back and reports a contract error when SUCCEEDED has no result", async () => {
    const onUpdateError = jest.fn();
    api.getEvaluation.mockResolvedValue(response(student("PRESENT", "AVERAGE")));
    api.updateEvaluation.mockResolvedValue({
      requestId: "command-eval-empty",
      type: "SESSION_ATTENDANCE_EVALUATION_UPDATE",
      status: "QUEUED",
      message: "Queued",
    });
    (waitForAttendanceCommand as jest.Mock).mockResolvedValueOnce({
      requestId: "command-eval-empty",
      type: "SESSION_ATTENDANCE_EVALUATION_UPDATE",
      status: "SUCCEEDED",
      result: null,
    });

    const rendered = renderHook(
      () => useSessionAttendance({ classSessionId: "session-1", onUpdateError }),
      { wrapper: createWrapper() },
    );
    const { result } = await rendered;
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(async () => {
      expect(
        await result.current.updateEvaluationStatus("enrollment-1", "GOOD", "Ghi chú"),
      ).toBe(false);
    });

    expect(result.current.students[0].attendance?.evaluationStatus).toBe("AVERAGE");
    expect(onUpdateError).toHaveBeenCalledWith(
      "Command completed without an evaluation result.",
    );
  });
});
