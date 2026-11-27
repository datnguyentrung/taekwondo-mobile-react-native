import { fetch as expoFetch } from "expo/fetch";

import { TBOT_PEER } from "../constants/chat.constants";
import {
  createAdkAgentTransport,
  decodeAdkSseEnvelope,
} from "./adkAgentTransport";

jest.mock("expo/fetch", () => ({ fetch: jest.fn() }));

function mockSseResponse(chunks: string[]) {
  const reader = {
    read: jest.fn(),
    cancel: jest.fn().mockResolvedValue(undefined),
    releaseLock: jest.fn(),
  };
  for (const chunk of chunks) {
    reader.read.mockResolvedValueOnce({
      done: false,
      value: new TextEncoder().encode(chunk),
    });
  }
  reader.read.mockResolvedValueOnce({ done: true, value: undefined });

  return {
    ok: true,
    status: 200,
    body: { getReader: () => reader },
    headers: { get: () => "text/event-stream" },
  };
}

describe("decodeAdkSseEnvelope", () => {
  it("decodes session, status, final, error, and done events", () => {
    expect(
      decodeAdkSseEnvelope({
        event: "session",
        data: JSON.stringify({ sessionId: "s-1", userId: "u-1" }),
      }),
    ).toEqual({ type: "session", sessionId: "s-1", userId: "u-1" });

    expect(
      decodeAdkSseEnvelope({
        event: "status",
        data: JSON.stringify({ requestId: "req-1", status: "SEARCHING", message: "Đang tìm..." }),
      }),
    ).toEqual({ type: "status", requestId: "req-1", status: "SEARCHING", message: "Đang tìm..." });

    expect(
      decodeAdkSseEnvelope({
        event: "final",
        data: JSON.stringify({ requestId: "req-1", messageId: "m-1", content: "Xin chào!" }),
      }),
    ).toEqual({
      type: "final",
      requestId: "req-1",
      messageId: "m-1",
      content: "Xin chào!",
      createdAt: undefined,
    });

    expect(
      decodeAdkSseEnvelope({
        event: "error",
        data: JSON.stringify({ requestId: "req-1", code: "AI_ERROR", message: "Boom" }),
      }),
    ).toEqual({ type: "error", requestId: "req-1", code: "AI_ERROR", error: "Boom" });

    expect(
      decodeAdkSseEnvelope({
        event: "done",
        data: JSON.stringify({ requestId: "req-1", sessionId: "s-1", userId: "u-1" }),
      }),
    ).toEqual({ type: "done", requestId: "req-1", sessionId: "s-1", userId: "u-1" });
  });
});

describe("createAdkAgentTransport", () => {
  const fetchMock = jest.mocked(expoFetch);

  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("streams final response via Java gateway /ai/chat/stream and reuses sessionId", async () => {
    fetchMock
      .mockResolvedValueOnce(
        mockSseResponse([
          'event: session\ndata: {"sessionId":"sess-123","userId":"u-1"}\n\n',
          'event: status\ndata: {"requestId":"c-1","status":"SEARCHING","message":"Đang tìm..."}\n\n',
          'event: final\ndata: {"requestId":"c-1","messageId":"m-1","content":"Chào bạn!"}\n\n',
          'event: done\ndata: {"sessionId":"sess-123","userId":"u-1"}\n\n',
        ]) as never,
      )
      .mockResolvedValueOnce(
        mockSseResponse([
          'event: session\ndata: {"sessionId":"sess-123","userId":"u-1"}\n\n',
          'event: final\ndata: {"requestId":"c-2","messageId":"m-2","content":"Lần 2"}\n\n',
          'event: done\ndata: {"sessionId":"sess-123","userId":"u-1"}\n\n',
        ]) as never,
      );

    const transport = createAdkAgentTransport({
      baseUrl: "http://localhost:8080/api/v1",
    });

    const peerMessages: string[] = [];
    const acks: string[] = [];

    await new Promise<void>((resolve) => {
      transport.send(
        {
          clientMessageId: "c-1",
          conversationId: "conv-tbot",
          senderId: "u-1",
          text: "Xin chào",
          createdAt: Date.now(),
        },
        TBOT_PEER,
        {
          onAcknowledged: (ack) => acks.push(ack.clientMessageId),
          onFailed: jest.fn(),
          onDeliveryCursorUpdated: jest.fn(),
          onReadCursorUpdated: jest.fn(),
          onPeerTyping: jest.fn(),
          onPeerMessage: (msg) => {
            peerMessages.push(msg.text);
            resolve();
          },
        },
      );
    });

    expect(acks).toEqual(["c-1"]);
    expect(peerMessages).toEqual(["Chào bạn!"]);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/ai/chat/stream",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          message: "Xin chào",
          user_id: "u-1",
          session_id: null,
          attachments: [],
          stream_tokens: false,
        }),
      }),
    );

    // Second turn should reuse sess-123
    await new Promise<void>((resolve) => {
      transport.send(
        {
          clientMessageId: "c-2",
          conversationId: "conv-tbot",
          senderId: "u-1",
          text: "Hỏi tiếp",
          createdAt: Date.now(),
        },
        TBOT_PEER,
        {
          onAcknowledged: jest.fn(),
          onFailed: jest.fn(),
          onDeliveryCursorUpdated: jest.fn(),
          onReadCursorUpdated: jest.fn(),
          onPeerTyping: jest.fn(),
          onPeerMessage: () => resolve(),
        },
      );
    });

    expect(fetchMock).toHaveBeenLastCalledWith(
      "http://localhost:8080/api/v1/ai/chat/stream",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          message: "Hỏi tiếp",
          user_id: "u-1",
          session_id: "sess-123",
          attachments: [],
          stream_tokens: false,
        }),
      }),
    );
  });

  it("marks message FAILED when the SSE request fails", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Network error"));
    const transport = createAdkAgentTransport({
      baseUrl: "http://localhost:8080/api/v1",
    });

    const failedIds: string[] = [];
    const errors: string[] = [];

    await new Promise<void>((resolve) => {
      transport.send(
        {
          clientMessageId: "c-err",
          conversationId: "conv-tbot",
          senderId: "u-1",
          text: "Test",
          createdAt: Date.now(),
        },
        TBOT_PEER,
        {
          onAcknowledged: jest.fn(),
          onFailed: (id) => failedIds.push(id),
          onDeliveryCursorUpdated: jest.fn(),
          onReadCursorUpdated: jest.fn(),
          onPeerTyping: jest.fn(),
          onPeerMessage: jest.fn(),
          onError: (msg) => {
            errors.push(msg);
            resolve();
          },
        },
      );
    });

    expect(failedIds).toEqual(["c-err"]);
    expect(errors.length).toBe(1);
  });
});
