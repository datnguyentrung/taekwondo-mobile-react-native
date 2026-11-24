import type {
  ChatMessage,
  ChatMessageStatus,
  ChatReceiptDisplay,
  ChatRenderItem,
  ConversationMemberState,
} from "./chat.types";
import { advanceMessageStatus, formatReceiptLabel } from "./chatStateMachine";

export const MESSAGE_GROUP_WINDOW_MS = 2 * 60 * 1000;

/**
 * Derives effective status for an outgoing message by combining its own status
 * with the recipient's deliveredCursor / readCursor (Phases 6, 7, 22).
 */
export function resolveEffectiveOutgoingStatus(
  message: ChatMessage,
  peerState?: ConversationMemberState,
): ChatMessageStatus {
  const baseStatus = message.status ?? "SENT";
  if (baseStatus === "SENDING" || baseStatus === "FAILED") {
    return baseStatus;
  }

  if (message.sequenceNo != null && peerState) {
    if (
      peerState.readReceiptEnabled &&
      message.sequenceNo <= peerState.readCursor
    ) {
      return advanceMessageStatus(baseStatus, "READ");
    }
    if (message.sequenceNo <= peerState.deliveredCursor) {
      return advanceMessageStatus(baseStatus, "DELIVERED");
    }
  }

  return baseStatus;
}

/**
 * Computes which messages should display a receipt label (Phases 4, 5, 12, 16, 17, 22, 23).
 *
 * Rules:
 * - Incoming (peer) or recalled messages never show a receipt.
 * - FAILED and SENDING messages always show their status so the user can see progress or retry.
 * - Only the latest non-recalled outgoing message shows its current status by default.
 * - If the recipient has partially read an outgoing streak (readCursor lands on an earlier
 *   outgoing message while newer outgoing messages remain unread), show "Đã xem" at the
 *   readCursor anchor AND show the latest outgoing message's status ("Đã nhận" / "Đã gửi").
 * - If the peer has already replied after the latest outgoing message and it is READ,
 *   hide the "Đã xem" marker from the UI (Phase 12) while keeping backend state intact.
 */
export function computeReceiptMap(
  messages: readonly ChatMessage[],
  peerState?: ConversationMemberState,
): Map<string, ChatReceiptDisplay> {
  const result = new Map<string, ChatReceiptDisplay>();

  let latestOutgoingIndex = -1;
  let lastPeerIndex = -1;

  for (let i = 0; i < messages.length; i += 1) {
    const msg = messages[i];
    if (msg.sender === "peer" && msg.type !== "system") {
      lastPeerIndex = i;
    }
    if (msg.sender === "user" && !msg.isRecalled) {
      latestOutgoingIndex = i;
      const effective = resolveEffectiveOutgoingStatus(msg, peerState);
      if (effective === "FAILED" || effective === "SENDING") {
        result.set(msg.id, {
          status: effective,
          label: formatReceiptLabel(effective),
          isError: effective === "FAILED",
        });
      }
    }
  }

  if (latestOutgoingIndex === -1) {
    return result;
  }

  const latestOutgoing = messages[latestOutgoingIndex];
  const latestEffective = resolveEffectiveOutgoingStatus(
    latestOutgoing,
    peerState,
  );
  const peerRepliedAfterLatest = lastPeerIndex > latestOutgoingIndex;

  if (latestEffective !== "FAILED" && latestEffective !== "SENDING") {
    const shouldHideReadBecausePeerReplied =
      latestEffective === "READ" && peerRepliedAfterLatest;

    if (!shouldHideReadBecausePeerReplied) {
      result.set(latestOutgoing.id, {
        status: latestEffective,
        label: formatReceiptLabel(latestEffective),
        isError: false,
      });
    }
  }

  // Phase 5: Partial read anchor when there are newer unread outgoing messages after readCursor.
  if (
    peerState &&
    peerState.readReceiptEnabled &&
    peerState.readCursor > 0 &&
    latestEffective !== "READ"
  ) {
    let readAnchorMessage: ChatMessage | null = null;
    for (let i = latestOutgoingIndex - 1; i >= 0; i -= 1) {
      const msg = messages[i];
      if (msg.sender !== "user" || msg.isRecalled) continue;
      if (msg.sequenceNo != null && msg.sequenceNo <= peerState.readCursor) {
        readAnchorMessage = msg;
        break;
      }
      if (msg.sequenceNo == null && msg.status === "READ") {
        readAnchorMessage = msg;
        break;
      }
    }

    if (readAnchorMessage && !result.has(readAnchorMessage.id)) {
      const anchorIndex = messages.indexOf(readAnchorMessage);
      const hasPeerReplyAfterAnchor = lastPeerIndex > anchorIndex;
      if (!hasPeerReplyAfterAnchor) {
        result.set(readAnchorMessage.id, {
          status: "READ",
          label: formatReceiptLabel("READ"),
          isError: false,
        });
      }
    }
  }

  return result;
}

/**
 * Groups consecutive messages from the same sender within 2 minutes (Phase 8)
 * and inserts time separators + receipt anchors (Phases 9 & 22).
 */
export function buildChatRenderItems(
  messages: readonly ChatMessage[],
  peerState?: ConversationMemberState,
): ChatRenderItem[] {
  const receiptMap = computeReceiptMap(messages, peerState);

  return messages.map((message, index) => {
    const prev = index > 0 ? messages[index - 1] : undefined;
    const next = index < messages.length - 1 ? messages[index + 1] : undefined;

    const sameSenderAsPrev =
      Boolean(prev) &&
      prev!.sender === message.sender &&
      prev!.type !== "system" &&
      message.type !== "system" &&
      message.createdAt - prev!.createdAt <= MESSAGE_GROUP_WINDOW_MS;

    const sameSenderAsNext =
      Boolean(next) &&
      next!.sender === message.sender &&
      next!.type !== "system" &&
      message.type !== "system" &&
      next!.createdAt - message.createdAt <= MESSAGE_GROUP_WINDOW_MS;

    const showTimeSeparator =
      !prev ||
      message.createdAt - prev.createdAt > MESSAGE_GROUP_WINDOW_MS;

    return {
      message,
      isClusterStart: !sameSenderAsPrev,
      isClusterEnd: !sameSenderAsNext,
      showTimeSeparator,
      receipt: receiptMap.get(message.id) ?? null,
    };
  });
}
