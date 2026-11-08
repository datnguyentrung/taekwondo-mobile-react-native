import type { AttendanceCommandResponse } from "../api/session-attendance.dto";

const TERMINAL_STATUSES = new Set([
  "SUCCEEDED",
  "REJECTED",
  "FAILED",
  "EXPIRED",
]);

export class AttendanceCommandError extends Error {
  constructor(
    message: string,
    readonly status: AttendanceCommandResponse["status"],
    readonly code?: string | null,
  ) {
    super(message);
    this.name = "AttendanceCommandError";
  }
}

type WaitForAttendanceCommandOptions = {
  intervalMs?: number;
  timeoutMs?: number;
  sleep?: (delayMs: number) => Promise<void>;
  now?: () => number;
};

function defaultSleep(delayMs: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, delayMs));
}

export async function waitForAttendanceCommand(
  getCommand: () => Promise<AttendanceCommandResponse>,
  {
    intervalMs = 350,
    timeoutMs = 15_000,
    sleep = defaultSleep,
    now = Date.now,
  }: WaitForAttendanceCommandOptions = {},
) {
  const startedAt = now();

  while (now() - startedAt < timeoutMs) {
    const command = await getCommand();

    if (command.status === "SUCCEEDED") {
      return command;
    }

    if (TERMINAL_STATUSES.has(command.status)) {
      throw new AttendanceCommandError(
        command.error?.detail ||
          command.error?.title ||
          "Không thể hoàn tất cập nhật điểm danh.",
        command.status,
        command.error?.code,
      );
    }

    await sleep(intervalMs);
  }

  throw new AttendanceCommandError(
    "Hệ thống chưa xác nhận cập nhật. Vui lòng thử lại.",
    "EXPIRED",
    "COMMAND_TIMEOUT",
  );
}
