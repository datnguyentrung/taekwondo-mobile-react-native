import type { ChatMessageStatus } from "./chat.types";

const STATUS_RANK: Record<ChatMessageStatus, number> = {
  FAILED: 0,
  SENDING: 1,
  SENT: 2,
  DELIVERED: 3,
  READ: 4,
};

/**
 * Enforces the forward-only message state machine (Phase 19):
 * - FAILED -> SENDING (retry)
 * - SENDING -> SENT | FAILED
 * - SENT -> DELIVERED | READ
 * - DELIVERED -> READ
 * Rollbacks such as READ -> DELIVERED or DELIVERED -> SENT are rejected.
 */
export function canTransitionStatus(
  from: ChatMessageStatus | undefined,
  to: ChatMessageStatus,
): boolean {
  if (!from) return true;
  if (from === to) return true;
  if (from === "FAILED") {
    return to === "SENDING";
  }
  if (from === "SENDING") {
    return to === "SENT" || to === "FAILED";
  }
  return STATUS_RANK[to] > STATUS_RANK[from];
}

export function advanceMessageStatus(
  current: ChatMessageStatus | undefined,
  next: ChatMessageStatus,
): ChatMessageStatus {
  if (!current) return next;
  return canTransitionStatus(current, next) ? next : current;
}

/**
 * Advances a monotonic cursor (deliveredCursor / readCursor). Never rolls back.
 */
export function advanceCursor(current: number, next: number): number {
  return next > current ? next : current;
}

export function formatReceiptLabel(status: ChatMessageStatus): string {
  switch (status) {
    case "SENDING":
      return "Đang gửi…";
    case "FAILED":
      return "Không gửi được · Thử lại";
    case "SENT":
      return "Đã gửi";
    case "DELIVERED":
      return "Đã nhận";
    case "READ":
      return "Đã xem";
  }
}
