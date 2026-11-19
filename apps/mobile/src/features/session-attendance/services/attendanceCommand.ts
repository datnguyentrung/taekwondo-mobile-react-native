import type { AttendanceCommandResponse } from "../api/session-attendance.dto";

const TERMINAL_STATUSES = new Set([
  "SUCCEEDED",
  "REJECTED",
  "FAILED",
  "EXPIRED",
]);

export const DEFAULT_ATTENDANCE_POLL_SCHEDULE = [
  250, 500, 1000, 2000,
] as const;
export const MAX_ATTENDANCE_POLL_INTERVAL_MS = 3000;

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

export type WaitForAttendanceCommandOptions = {
  intervalsMs?: readonly number[];
  maxIntervalMs?: number;
  intervalMs?: number;
  timeoutMs?: number;
  sleep?: (delayMs: number) => Promise<void>;
  now?: () => number;
  signal?: AbortSignal;
};

function defaultSleep(delayMs: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Command polling aborted"));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, delayMs);

    const onAbort = () => {
      clearTimeout(timer);
      reject(new Error("Command polling aborted"));
    };

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export async function waitForAttendanceCommand<TResult = unknown>(
  getCommand: () => Promise<AttendanceCommandResponse<TResult>>,
  {
    intervalsMs = DEFAULT_ATTENDANCE_POLL_SCHEDULE,
    maxIntervalMs = MAX_ATTENDANCE_POLL_INTERVAL_MS,
    intervalMs,
    timeoutMs = 15_000,
    sleep,
    now = Date.now,
    signal,
  }: WaitForAttendanceCommandOptions = {},
): Promise<AttendanceCommandResponse<TResult>> {
  const startedAt = now();
  const sleepFn = sleep ?? ((delayMs) => defaultSleep(delayMs, signal));
  let pollIndex = 0;

  while (now() - startedAt < timeoutMs) {
    if (signal?.aborted) {
      throw new Error("Command polling aborted");
    }

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

    if (signal?.aborted) {
      throw new Error("Command polling aborted");
    }

    const delay =
      intervalMs ??
      (pollIndex < intervalsMs.length
        ? intervalsMs[pollIndex]
        : maxIntervalMs);
    pollIndex++;

    await sleepFn(delay);
  }

  throw new AttendanceCommandError(
    "Hệ thống chưa xác nhận cập nhật. Vui lòng thử lại.",
    "EXPIRED",
    "COMMAND_TIMEOUT",
  );
}
