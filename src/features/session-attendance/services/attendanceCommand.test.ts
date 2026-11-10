import type { AttendanceCommandResponse } from "../api/session-attendance.dto";
import {
  AttendanceCommandError,
  waitForAttendanceCommand,
} from "./attendanceCommand";

function command(
  status: AttendanceCommandResponse["status"],
  detail?: string,
): AttendanceCommandResponse {
  return {
    requestId: "request-1",
    type: "SESSION_ATTENDANCE_STATUS_UPDATE",
    status,
    result: null,
    error: detail ? { code: "UPDATE_REJECTED", detail } : null,
    createdAt: "2026-11-08T00:00:00",
    updatedAt: "2026-11-08T00:00:00",
    completedAt: null,
  };
}

describe("waitForAttendanceCommand", () => {
  it("waits through queued states until Java confirms success", async () => {
    const getCommand = jest
      .fn<Promise<AttendanceCommandResponse>, []>()
      .mockResolvedValueOnce(command("QUEUED"))
      .mockResolvedValueOnce(command("PROCESSING"))
      .mockResolvedValueOnce(command("SUCCEEDED"));

    await expect(
      waitForAttendanceCommand(getCommand, { sleep: async () => undefined }),
    ).resolves.toMatchObject({ status: "SUCCEEDED" });
    expect(getCommand).toHaveBeenCalledTimes(3);
  });

  it("exposes the backend rejection detail", async () => {
    await expect(
      waitForAttendanceCommand(
        async () => command("REJECTED", "Điểm danh đã đóng"),
        { sleep: async () => undefined },
      ),
    ).rejects.toEqual(
      expect.objectContaining<Partial<AttendanceCommandError>>({
        name: "AttendanceCommandError",
        message: "Điểm danh đã đóng",
        status: "REJECTED",
      }),
    );
  });

  it("polls sequentially with backoff schedule: 250ms, 500ms, 1000ms, 2000ms then caps at 3000ms", async () => {
    const sleepDelays: number[] = [];
    const getCommand = jest
      .fn<Promise<AttendanceCommandResponse>, []>()
      .mockResolvedValueOnce(command("QUEUED"))
      .mockResolvedValueOnce(command("PROCESSING"))
      .mockResolvedValueOnce(command("PROCESSING"))
      .mockResolvedValueOnce(command("PROCESSING"))
      .mockResolvedValueOnce(command("PROCESSING"))
      .mockResolvedValueOnce(command("SUCCEEDED"));

    const result = await waitForAttendanceCommand(getCommand, {
      sleep: async (delay) => {
        sleepDelays.push(delay);
      },
    });

    expect(result.status).toBe("SUCCEEDED");
    expect(getCommand).toHaveBeenCalledTimes(6);
    expect(sleepDelays).toEqual([250, 500, 1000, 2000, 3000]);
  });

  it("aborts polling when AbortSignal is triggered", async () => {
    const controller = new AbortController();
    const getCommand = jest
      .fn<Promise<AttendanceCommandResponse>, []>()
      .mockImplementation(async () => {
        controller.abort();
        return command("PROCESSING");
      });

    await expect(
      waitForAttendanceCommand(getCommand, {
        signal: controller.signal,
        sleep: async () => undefined,
      }),
    ).rejects.toThrow("Command polling aborted");
  });
});
