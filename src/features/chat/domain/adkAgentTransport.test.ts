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
  it("decodes session, token, message, error, and done events", () => {
    expect(
      decodeAdkSseEnvelope({
        event: "session",
        data: JSON.stringify({ sessionId: "s-1", userId: "u-1" }),
      }),
    ).toEqual({ type: "session", sessionId: "s-1", userId: "u-1" });

    expect(
      decodeAdkSseEnvelope({
        event: "token",
        data: JSON.stringify({ author: "tbot", text: "Xin " }),
      }),
    ).toEqual({ type: "token", author: "tbot", text: "Xin " });

    expect(
      decodeAdkSseEnvelope({
        event: "message",
        data: JSON.stringify({ author: "tbot", text: "Xin chào!" }),
      }),
    ).toEqual({ type: "message", author: "tbot", text: "Xin chào!" });

    expect(
      decodeAdkSseEnvelope({
        event: "error",
        data: JSON.stringify({ errorType: "RuntimeError", error: "Boom" }),
      }),
    ).toEqual({ type: "error", errorType: "RuntimeError", error: "Boom" });

    expect(
      decodeAdkSseEnvelope({
        event: "done",
        data: JSON.stringify({ sessionId: "s-1", userId: "u-1" }),
      }),
    ).toEqual({ type: "done", sessionId: "s-1", userId: "u-1" });
  });
});

describe("createAdkAgentTransport", () => {
  const fetchMock = jest.mocked(expoFetch);

  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("streams tokens from /api/v1/agent/chat/stream and reuses sessionId", async () => {
    fetchMock
      .mockResolvedValueOnce(
        mockSseResponse([
          'event: session\ndata: {"sessionId":"sess-123","userId":"u-1"}\n\n',
          'event: token\ndata: {"author":"tbot","text":"Chào "}\n\n',
          'event: token\ndata: {"author":"tbot","text":"bạn!"}\n\n',
          'event: message\ndata: {"author":"tbot","text":"Chào bạn!"}\n\n',
          'event: done\ndata: {"sessionId":"sess-123","userId":"u-1"}\n\n',
        ]) as never,
      )
      .mockResolvedValueOnce(
        mockSseResponse([
          'event: session\ndata: {"sessionId":"sess-123","userId":"u-1"}\n\n',
          'event: message\ndata: {"author":"tbot","text":"Lần 2"}\n\n',
          'event: done\ndata: {"sessionId":"sess-123","userId":"u-1"}\n\n',
        ]) as never,
      );

    const transport = createAdkAgentTransport({
      baseUrl: "http://localhost:8000",
    });

    const updates: string[] = [];
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
          onPeerMessage: jest.fn(),
          onPeerStreamUpdate: (u) => {
            updates.push(u.text);
            if (u.isFinal) resolve();
          },
        },
      );
    });

    expect(acks).toEqual(["c-1"]);
    expect(updates).toEqual(["Chào ", "Chào bạn!", "Chào bạn!"]);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/agent/chat/stream",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          message: "Xin chào",
          user_id: "u-1",
          session_id: null,
          attachments: [],
          stream_tokens: true,
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
          onPeerMessage: jest.fn(),
          onPeerStreamUpdate: (u) => {
            if (u.isFinal) resolve();
          },
        },
      );
    });

    expect(fetchMock).toHaveBeenLastCalledWith(
      "http://localhost:8000/api/v1/agent/chat/stream",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          message: "Hỏi tiếp",
          user_id: "u-1",
          session_id: "sess-123",
          attachments: [],
          stream_tokens: true,
        }),
      }),
    );
  });

  it("marks message FAILED when the SSE request fails", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Network error"));
    const transport = createAdkAgentTransport({
      baseUrl: "http://localhost:8000",
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
