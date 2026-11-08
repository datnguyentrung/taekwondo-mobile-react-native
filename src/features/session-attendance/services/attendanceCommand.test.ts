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
    message: status,
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

  it("fails when Java never produces a terminal result", async () => {
    let now = 0;
    await expect(
      waitForAttendanceCommand(async () => command("PROCESSING"), {
        timeoutMs: 100,
        intervalMs: 50,
        now: () => now,
        sleep: async (delay) => {
          now += delay;
        },
      }),
    ).rejects.toMatchObject({
      status: "EXPIRED",
      code: "COMMAND_TIMEOUT",
    });
  });
});
