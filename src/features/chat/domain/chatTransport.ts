import type {
  ChatMessage,
  ChatPeer,
  ChatReplyPreview,
  TBotStatusUpdate,
} from "./chat.types";
import { buildPeerReply, formatChatTime } from "./tbotResponder";

export type SendMessageAck = {
  serverMessageId: string;
  clientMessageId: string;
  sequenceNo: number;
  serverAcceptedAt: number;
};

export type SendMessagePayload = {
  clientMessageId: string;
  conversationId: string;
  senderId: string;
  text: string;
  imageUri?: string;
  replyTo?: ChatReplyPreview;
  createdAt: number;
};

export type PeerStreamUpdate = {
  messageId: string;
  conversationId: string;
  peerId: string;
  text: string;
  isFinal: boolean;
  createdAt: number;
};

export type ChatTransportCallbacks = {
  onAcknowledged: (ack: SendMessageAck) => void;
  onFailed: (clientMessageId: string) => void;
  onDeliveryCursorUpdated: (
    conversationId: string,
    deliveredCursor: number,
    deliveredAt: number,
  ) => void;
  onReadCursorUpdated: (
    conversationId: string,
    readCursor: number,
    readAt: number,
  ) => void;
  onPeerTyping: (isTyping: boolean) => void;
  onPeerStatus?: (update: TBotStatusUpdate) => void;
  onPeerMessage: (message: ChatMessage) => void;
  onPeerStreamUpdate?: (update: PeerStreamUpdate) => void;
  onError?: (message: string) => void;
};

export interface ChatTransport {
  send(
    payload: SendMessagePayload,
    peer: ChatPeer,
    callbacks: ChatTransportCallbacks,
  ): void;
  dispose(): void;
}

/**
 * Local/mock transport simulating:
 * SENDING -> SENT (ACK + sequenceNo) -> DELIVERED -> READ -> Peer reply
 * Includes idempotent clientMessageId deduplication and `[fail]` trigger for testing Retry.
 */
export function createLocalChatTransport(
  initialSequenceNo = 100,
): ChatTransport {
  let nextSequenceNo = initialSequenceNo;
  const ackedByClientId = new Map<string, SendMessageAck>();
  const timers = new Set<ReturnType<typeof setTimeout>>();

  const schedule = (fn: () => void, ms: number) => {
    const timer = setTimeout(() => {
      timers.delete(timer);
      fn();
    }, ms);
    timers.add(timer);
  };

  return {
    send(payload, peer, callbacks) {
      // Simulate network failure if message explicitly contains `[fail]`
      if (payload.text.includes("[fail]")) {
        schedule(() => {
          callbacks.onFailed(payload.clientMessageId);
        }, 350);
        return;
      }

      // Idempotent retry: reuse existing ACK if clientMessageId was already accepted
      const existingAck = ackedByClientId.get(payload.clientMessageId);
      if (existingAck) {
        schedule(() => {
          callbacks.onAcknowledged(existingAck);
        }, 120);
        return;
      }

      schedule(() => {
        nextSequenceNo += 1;
        const seq = nextSequenceNo;
        const serverAcceptedAt = Date.now();
        const ack: SendMessageAck = {
          serverMessageId: `srv-${seq}-${payload.clientMessageId}`,
          clientMessageId: payload.clientMessageId,
          sequenceNo: seq,
          serverAcceptedAt,
        };
        ackedByClientId.set(payload.clientMessageId, ack);
        callbacks.onAcknowledged(ack);

        // Phase 2: DELIVERED
        schedule(() => {
          callbacks.onDeliveryCursorUpdated(
            payload.conversationId,
            seq,
            Date.now(),
          );
        }, 350);

        // Phase 3: READ
        schedule(() => {
          callbacks.onReadCursorUpdated(
            payload.conversationId,
            seq,
            Date.now(),
          );
          callbacks.onPeerTyping(true);
        }, 700);

        // Peer reply (Phase 12: hides "Đã xem" once peer replies)
        const replyText = buildPeerReply(
          payload.text,
          peer,
          Boolean(payload.imageUri),
        );
        schedule(() => {
          callbacks.onPeerTyping(false);
          nextSequenceNo += 1;
          const replySeq = nextSequenceNo;
          const now = Date.now();
          callbacks.onPeerMessage({
            id: `reply-${now}-${replySeq}`,
            clientMessageId: `peer-${now}-${replySeq}`,
            conversationId: payload.conversationId,
            senderId: peer.id,
            sender: "peer",
            sequenceNo: replySeq,
            type: "text",
            text: replyText,
            timestamp: formatChatTime(new Date(now)),
            createdAt: now,
            serverAcceptedAt: now,
          });
        }, 1350);
      }, 220);
    },

    dispose() {
      for (const timer of timers) {
        clearTimeout(timer);
      }
      timers.clear();
    },
  };
}
