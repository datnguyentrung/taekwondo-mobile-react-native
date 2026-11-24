export type MessageReactionEmoji = "❤️" | "👍" | "🔥" | "👏" | "😊";

export type ChatPeer = {
  id: string;
  name: string;
  subtitle: string;
  isBot?: boolean;
  isOnline?: boolean;
};

export type ChatReplyPreview = {
  messageId: string;
  senderName: string;
  snippet: string;
};

/**
 * Forward-only message delivery lifecycle (Phase 19).
 * SENDING -> SENT | FAILED
 * FAILED  -> SENDING (retry with same clientMessageId)
 * SENT    -> DELIVERED -> READ
 */
export type ChatMessageStatus =
  | "SENDING"
  | "FAILED"
  | "SENT"
  | "DELIVERED"
  | "READ";

export type ChatMessageType = "text" | "image" | "system";

export type ChatMessage = {
  id: string;
  clientMessageId: string;
  conversationId: string;
  senderId: string;
  sender: "user" | "peer";
  sequenceNo?: number;
  type: ChatMessageType;
  text: string;
  /** Formatted HH:mm label for UI display. */
  timestamp: string;
  /** Epoch milliseconds when the client created the message. */
  createdAt: number;
  serverAcceptedAt?: number;
  deliveredAt?: number;
  readAt?: number;
  status?: ChatMessageStatus;
  imageUri?: string;
  replyTo?: ChatReplyPreview;
  reactions?: MessageReactionEmoji[];
  editedAt?: number;
  recalledAt?: number;
  isRecalled?: boolean;
};

export type ConversationMemberState = {
  conversationId: string;
  userId: string;
  deliveredCursor: number;
  readCursor: number;
  deliveredAt?: number;
  readAt?: number;
  manualUnreadFrom?: number;
  readReceiptEnabled: boolean;
};

export type ChatQuickAction = {
  id: string;
  title: string;
  prompt: string;
  iconKey: "class-advice" | "tuition" | "trial";
};

export type ChatReceiptDisplay = {
  status: ChatMessageStatus;
  label: string;
  isError: boolean;
};

export type TBotProcessingStatus =
  | "RECEIVED"
  | "PROCESSING"
  | "SEARCHING"
  | "GENERATING"
  | "COMPLETED"
  | "FAILED";

export type TBotStatusUpdate = {
  requestId: string;
  status: TBotProcessingStatus;
  message: string;
};

export type ChatRenderItem = {
  message: ChatMessage;
  isClusterStart: boolean;
  isClusterEnd: boolean;
  showTimeSeparator: boolean;
  receipt: ChatReceiptDisplay | null;
};
