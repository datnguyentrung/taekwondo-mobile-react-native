import type { ChatMessage, ConversationMemberState } from "./chat.types";
import {
  buildChatRenderItems,
  computeReceiptMap,
} from "./chatPresentation";
import {
  advanceCursor,
  advanceMessageStatus,
  canTransitionStatus,
} from "./chatStateMachine";

function makeMessage(
  overrides: Partial<ChatMessage> & { id: string },
): ChatMessage {
  return {
    clientMessageId: `client-${overrides.id}`,
    conversationId: "conv-1",
    senderId: overrides.sender === "peer" ? "peer-1" : "current-user",
    sender: "user",
    type: "text",
    text: `Message ${overrides.id}`,
    timestamp: "20:41",
    createdAt: 1_700_000_000_000,
    ...overrides,
  };
}

describe("chatStateMachine", () => {
  it("enforces forward-only status transitions", () => {
    expect(canTransitionStatus("SENDING", "SENT")).toBe(true);
    expect(canTransitionStatus("SENDING", "FAILED")).toBe(true);
    expect(canTransitionStatus("FAILED", "SENDING")).toBe(true);
    expect(canTransitionStatus("SENT", "DELIVERED")).toBe(true);
    expect(canTransitionStatus("DELIVERED", "READ")).toBe(true);

    expect(canTransitionStatus("READ", "DELIVERED")).toBe(false);
    expect(canTransitionStatus("DELIVERED", "SENT")).toBe(false);
    expect(canTransitionStatus("SENT", "SENDING")).toBe(false);
    expect(advanceMessageStatus("READ", "SENT")).toBe("READ");
  });

  it("never rolls back monotonic cursors", () => {
    expect(advanceCursor(103, 105)).toBe(105);
    expect(advanceCursor(105, 103)).toBe(105);
  });
});

describe("computeReceiptMap", () => {
  it("shows receipt only on the latest outgoing message in a streak", () => {
    const messages: ChatMessage[] = [
      makeMessage({ id: "m1", sequenceNo: 101, status: "READ" }),
      makeMessage({ id: "m2", sequenceNo: 102, status: "READ" }),
      makeMessage({ id: "m3", sequenceNo: 103, status: "READ" }),
    ];
    const peerState: ConversationMemberState = {
      conversationId: "conv-1",
      userId: "peer-1",
      deliveredCursor: 103,
      readCursor: 103,
      readReceiptEnabled: true,
    };

    const receipts = computeReceiptMap(messages, peerState);
    expect(receipts.has("m1")).toBe(false);
    expect(receipts.has("m2")).toBe(false);
    expect(receipts.get("m3")?.label).toBe("Đã xem");
  });

  it("shows Đã xem at readCursor and Đã nhận at latest outgoing on partial read", () => {
    const messages: ChatMessage[] = [
      makeMessage({ id: "m1", sequenceNo: 101, status: "DELIVERED" }),
      makeMessage({ id: "m2", sequenceNo: 102, status: "DELIVERED" }),
      makeMessage({ id: "m3", sequenceNo: 103, status: "DELIVERED" }),
      makeMessage({ id: "m4", sequenceNo: 104, status: "DELIVERED" }),
      makeMessage({ id: "m5", sequenceNo: 105, status: "DELIVERED" }),
    ];
    const peerState: ConversationMemberState = {
      conversationId: "conv-1",
      userId: "peer-1",
      deliveredCursor: 105,
      readCursor: 103,
      readReceiptEnabled: true,
    };

    const receipts = computeReceiptMap(messages, peerState);
    expect(receipts.has("m1")).toBe(false);
    expect(receipts.has("m2")).toBe(false);
    expect(receipts.get("m3")?.label).toBe("Đã xem");
    expect(receipts.has("m4")).toBe(false);
    expect(receipts.get("m5")?.label).toBe("Đã nhận");
  });

  it("hides Đã xem once the peer replies after the latest outgoing message", () => {
    const messages: ChatMessage[] = [
      makeMessage({ id: "m1", sequenceNo: 101, status: "READ" }),
      makeMessage({
        id: "m2",
        sender: "peer",
        sequenceNo: 102,
        text: "Vâng ạ.",
      }),
    ];
    const peerState: ConversationMemberState = {
      conversationId: "conv-1",
      userId: "peer-1",
      deliveredCursor: 101,
      readCursor: 101,
      readReceiptEnabled: true,
    };

    const receipts = computeReceiptMap(messages, peerState);
    expect(receipts.has("m1")).toBe(false);
  });

  it("always shows FAILED and SENDING statuses and hides recalled receipts", () => {
    const messages: ChatMessage[] = [
      makeMessage({ id: "m1", status: "FAILED" }),
      makeMessage({ id: "m2", status: "SENDING" }),
      makeMessage({ id: "m3", status: "READ", isRecalled: true }),
    ];

    const receipts = computeReceiptMap(messages);
    expect(receipts.get("m1")?.isError).toBe(true);
    expect(receipts.get("m2")?.label).toBe("Đang gửi…");
    expect(receipts.has("m3")).toBe(false);
  });
});

describe("buildChatRenderItems", () => {
  it("groups consecutive messages within 2 minutes and splits beyond 2 minutes", () => {
    const base = 1_700_000_000_000;
    const messages: ChatMessage[] = [
      makeMessage({ id: "m1", sender: "peer", createdAt: base }),
      makeMessage({ id: "m2", sender: "peer", createdAt: base + 30_000 }),
      makeMessage({ id: "m3", sender: "peer", createdAt: base + 180_000 }),
    ];

    const items = buildChatRenderItems(messages);
    expect(items[0].showTimeSeparator).toBe(true);
    expect(items[0].isClusterStart).toBe(true);
    expect(items[0].isClusterEnd).toBe(false);

    expect(items[1].showTimeSeparator).toBe(false);
    expect(items[1].isClusterStart).toBe(false);
    expect(items[1].isClusterEnd).toBe(true);

    expect(items[2].showTimeSeparator).toBe(true);
    expect(items[2].isClusterStart).toBe(true);
    expect(items[2].isClusterEnd).toBe(true);
  });
});
