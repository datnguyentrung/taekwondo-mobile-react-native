import { env } from "@/config/env";
import { streamSse, type SseEnvelope } from "@/infrastructure/sse";

import type { ChatPeer, TBotProcessingStatus } from "./chat.types";
import type {
  ChatTransport,
  ChatTransportCallbacks,
  SendMessagePayload,
} from "./chatTransport";
import { formatChatTime } from "./tbotResponder";

export type AdkSseEvent =
  | { type: "session"; sessionId: string; userId: string }
  | {
      type: "status";
      requestId: string;
      status: TBotProcessingStatus;
      message: string;
    }
  | {
      type: "final";
      requestId: string;
      messageId: string;
      content: string;
      createdAt?: string;
    }
  | { type: "error"; requestId?: string; code?: string; error: string }
  | { type: "done"; requestId?: string; sessionId: string; userId: string };

const DEFAULT_STATUS_MESSAGES: Record<TBotProcessingStatus, string> = {
  RECEIVED: "TBot đang xử lý...",
  PROCESSING: "TBot đang suy nghĩ...",
  SEARCHING: "TBot đang tìm thông tin...",
  GENERATING: "TBot đang soạn câu trả lời...",
  COMPLETED: "",
  FAILED: "TBot chưa thể trả lời lúc này. Vui lòng thử lại.",
};

function normalizeStatus(raw: unknown): TBotProcessingStatus {
  switch (raw) {
    case "RECEIVED":
    case "PROCESSING":
    case "SEARCHING":
    case "GENERATING":
    case "COMPLETED":
    case "FAILED":
      return raw;
    default:
      return "PROCESSING";
  }
}

export function decodeAdkSseEnvelope(envelope: SseEnvelope): AdkSseEvent | null {
  if (!envelope.event || !envelope.data) return null;

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(envelope.data) as Record<string, unknown>;
  } catch {
    return null;
  }

  switch (envelope.event) {
    case "session":
      return {
        type: "session",
        sessionId: String(parsed.sessionId ?? ""),
        userId: String(parsed.userId ?? ""),
      };
    case "status": {
      const status = normalizeStatus(parsed.status);
      const message =
        typeof parsed.message === "string" && parsed.message.trim().length > 0
          ? parsed.message
          : DEFAULT_STATUS_MESSAGES[status];
      return {
        type: "status",
        requestId: String(parsed.requestId ?? ""),
        status,
        message,
      };
    }
    case "final":
      return {
        type: "final",
        requestId: String(parsed.requestId ?? ""),
        messageId: String(parsed.messageId ?? ""),
        content: String(parsed.content ?? ""),
        createdAt:
          typeof parsed.createdAt === "string" ? parsed.createdAt : undefined,
      };
    // Backward-compatible fallback while backend still emits `message`
    case "message":
      return {
        type: "final",
        requestId: String(parsed.requestId ?? ""),
        messageId: String(parsed.messageId ?? parsed.invocationId ?? ""),
        content: String(parsed.content ?? parsed.text ?? ""),
        createdAt:
          typeof parsed.createdAt === "string" ? parsed.createdAt : undefined,
      };
    case "error":
      return {
        type: "error",
        requestId:
          typeof parsed.requestId === "string" ? parsed.requestId : undefined,
        code: typeof parsed.code === "string" ? parsed.code : undefined,
        error: String(
          parsed.message ??
            parsed.error ??
            "TBot chưa thể trả lời lúc này. Vui lòng thử lại.",
        ),
      };
    case "tool_call":
    case "tool_response":
      return {
        type: "status",
        requestId: String(parsed.requestId ?? ""),
        status: "SEARCHING",
        message: DEFAULT_STATUS_MESSAGES.SEARCHING,
      };
    case "done":
      return {
        type: "done",
        requestId:
          typeof parsed.requestId === "string" ? parsed.requestId : undefined,
        sessionId: String(parsed.sessionId ?? ""),
        userId: String(parsed.userId ?? ""),
      };
    default:
      return null;
  }
}

function guessImageMimeType(uri: string): { filename: string; mimeType: string } {
  const cleanUri = uri.split("?")[0] ?? uri;
  const rawName = cleanUri.split("/").pop() || `image_${Date.now()}.jpg`;
  const lower = rawName.toLowerCase();
  if (lower.endsWith(".png")) {
    return { filename: rawName, mimeType: "image/png" };
  }
  if (lower.endsWith(".webp")) {
    return { filename: rawName, mimeType: "image/webp" };
  }
  return { filename: rawName, mimeType: "image/jpeg" };
}

export type AdkAgentTransportOptions = {
  baseUrl?: string;
  initialSequenceNo?: number;
  getAuthHeaders?: () => Record<string, string> | Promise<Record<string, string>>;
};

/**
 * Connects TBot chat to the FastAPI ADK Agent SSE router:
 * - POST /api/v1/agent/chat/stream (JSON)
 * - POST /api/v1/agent/chat/upload/stream (multipart/form-data when imageUri is present)
 */
export function createAdkAgentTransport(
  options: AdkAgentTransportOptions = {},
): ChatTransport {
  const baseUrl = (options.baseUrl ?? env.agentApiUrl).replace(/\/+$/, "");
  let nextSequenceNo = options.initialSequenceNo ?? 10;
  let sessionId: string | null = null;
  const activeControllers = new Set<AbortController>();

  const runStream = async (
    payload: SendMessagePayload,
    peer: ChatPeer,
    callbacks: ChatTransportCallbacks,
  ) => {
    const controller = new AbortController();
    activeControllers.add(controller);

    const hasImage = Boolean(payload.imageUri);
    const url = hasImage
      ? `${baseUrl}/api/v1/agent/chat/upload/stream`
      : `${baseUrl}/api/v1/agent/chat/stream`;

    let body: BodyInit;
    let extraHeaders: Record<string, string> = {};

    if (hasImage && payload.imageUri) {
      const formData = new FormData();
      formData.append("message", payload.text);
      formData.append("user_id", payload.senderId);
      if (sessionId) {
        formData.append("session_id", sessionId);
      }
      formData.append("stream_tokens", "false");
      const { filename, mimeType } = guessImageMimeType(payload.imageUri);
      formData.append("files", {
        uri: payload.imageUri,
        name: filename,
        type: mimeType,
      } as unknown as Blob);
      body = formData;
    } else {
      body = JSON.stringify({
        message: payload.text,
        user_id: payload.senderId,
        session_id: sessionId,
        attachments: [],
        stream_tokens: false,
      });
      extraHeaders = { "Content-Type": "application/json" };
    }

    nextSequenceNo += 1;
    const userSeq = nextSequenceNo;
    const requestId = payload.clientMessageId;

    let hasReceivedFinal = false;
    let streamErrored = false;
    let acknowledged = false;

    const markAccepted = () => {
      if (acknowledged) return;
      acknowledged = true;
      const now = Date.now();
      callbacks.onAcknowledged({
        serverMessageId: `srv-${userSeq}-${payload.clientMessageId}`,
        clientMessageId: payload.clientMessageId,
        sequenceNo: userSeq,
        serverAcceptedAt: now,
      });
      callbacks.onDeliveryCursorUpdated(payload.conversationId, userSeq, now);
      callbacks.onReadCursorUpdated(payload.conversationId, userSeq, now);
      callbacks.onPeerTyping(true);
    };

    try {
      const stream = streamSse<AdkSseEvent>({
        url,
        method: "POST",
        body,
        signal: controller.signal,
        reconnect: false,
        headers: async () => ({
          ...(options.getAuthHeaders ? await options.getAuthHeaders() : {}),
          ...extraHeaders,
        }),
        decode: decodeAdkSseEnvelope,
      });

      for await (const event of stream) {
        if (controller.signal.aborted) break;

        switch (event.type) {
          case "session": {
            if (event.sessionId) {
              sessionId = event.sessionId;
            }
            markAccepted();
            break;
          }
          case "status": {
            markAccepted();
            if (hasReceivedFinal || streamErrored) break;
            callbacks.onPeerTyping(true);
            callbacks.onPeerStatus?.({
              requestId: event.requestId || requestId,
              status: event.status,
              message: event.message,
            });
            break;
          }
          case "final": {
            markAccepted();
            if (streamErrored || !event.content.trim()) break;
            hasReceivedFinal = true;
            callbacks.onPeerTyping(false);
            callbacks.onPeerStatus?.({
              requestId: event.requestId || requestId,
              status: "COMPLETED",
              message: "",
            });
            nextSequenceNo += 1;
            const replySeq = nextSequenceNo;
            const createdAtMs = event.createdAt
              ? Date.parse(event.createdAt) || Date.now()
              : Date.now();
            const messageId =
              event.messageId || `tbot-${payload.clientMessageId}`;
            callbacks.onPeerMessage({
              id: messageId,
              clientMessageId: messageId,
              conversationId: payload.conversationId,
              senderId: peer.id,
              sender: "peer",
              sequenceNo: replySeq,
              type: "text",
              text: event.content,
              timestamp: formatChatTime(new Date(createdAtMs)),
              createdAt: createdAtMs,
            });
            break;
          }
          case "error": {
            streamErrored = true;
            callbacks.onPeerTyping(false);
            callbacks.onPeerStatus?.({
              requestId: event.requestId || requestId,
              status: "FAILED",
              message: event.error,
            });
            if (!hasReceivedFinal) {
              callbacks.onFailed(payload.clientMessageId);
            }
            callbacks.onError?.(event.error);
            break;
          }
          case "done": {
            if (event.sessionId) {
              sessionId = event.sessionId;
            }
            callbacks.onPeerTyping(false);
            break;
          }
        }
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      callbacks.onPeerTyping(false);
      if (!hasReceivedFinal) {
        callbacks.onFailed(payload.clientMessageId);
      }
      const message =
        error instanceof Error
          ? error.message
          : "Không thể kết nối tới trợ lý TBot.";
      callbacks.onError?.(message);
    } finally {
      activeControllers.delete(controller);
    }
  };

  return {
    send(payload, peer, callbacks) {
      void runStream(payload, peer, callbacks);
    },
    dispose() {
      for (const controller of activeControllers) {
        controller.abort();
      }
      activeControllers.clear();
      sessionId = null;
    },
  };
}
