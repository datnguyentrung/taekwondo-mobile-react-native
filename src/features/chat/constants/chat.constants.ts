import type {
  ChatMessage,
  ChatPeer,
  ChatQuickAction,
  MessageReactionEmoji,
} from "../domain/chat.types";

export const TBOT_PEER: ChatPeer = {
  id: "tbot",
  name: "TBot",
  subtitle: "Trợ lý AI của TaekLink",
  isBot: true,
  isOnline: true,
};

export const REACTION_EMOJIS: readonly MessageReactionEmoji[] = [
  "❤️",
  "👍",
  "🔥",
  "👏",
  "😊",
];

const SEED_BASE_MS = Date.now() - 10 * 60 * 1000;

export const INITIAL_TBOT_MESSAGES: readonly ChatMessage[] = [
  {
    id: "seed-1",
    clientMessageId: "seed-client-1",
    conversationId: "conv-tbot",
    senderId: "current-user",
    sender: "user",
    sequenceNo: 1,
    type: "text",
    text: "Bé 8 tuổi có lớp nào phù hợp không?",
    timestamp: "09:40",
    createdAt: SEED_BASE_MS,
    serverAcceptedAt: SEED_BASE_MS + 200,
    deliveredAt: SEED_BASE_MS + 500,
    readAt: SEED_BASE_MS + 900,
    status: "READ",
  },
  {
    id: "seed-2",
    clientMessageId: "seed-client-2",
    conversationId: "conv-tbot",
    senderId: "tbot",
    sender: "peer",
    sequenceNo: 2,
    type: "text",
    text: "Dạ có ạ. Bé 8 tuổi phù hợp lớp Cơ bản thiếu nhi. 🥋",
    timestamp: "09:40",
    createdAt: SEED_BASE_MS + 15_000,
    serverAcceptedAt: SEED_BASE_MS + 15_200,
  },
  {
    id: "seed-3",
    clientMessageId: "seed-client-3",
    conversationId: "conv-tbot",
    senderId: "current-user",
    sender: "user",
    sequenceNo: 3,
    type: "text",
    text: "Học phí thế nào?",
    timestamp: "09:41",
    createdAt: SEED_BASE_MS + 60_000,
    serverAcceptedAt: SEED_BASE_MS + 60_200,
    deliveredAt: SEED_BASE_MS + 60_500,
    readAt: SEED_BASE_MS + 60_900,
    status: "READ",
  },
  {
    id: "seed-4",
    clientMessageId: "seed-client-4",
    conversationId: "conv-tbot",
    senderId: "tbot",
    sender: "peer",
    sequenceNo: 4,
    type: "text",
    text: "Em có thể gửi học phí, lịch học và đăng ký học thử ngay cho anh/chị. 😊",
    timestamp: "09:41",
    createdAt: SEED_BASE_MS + 75_000,
    serverAcceptedAt: SEED_BASE_MS + 75_200,
  },
];

export const CHAT_QUICK_ACTIONS: readonly ChatQuickAction[] = [
  {
    id: "class-advice",
    title: "Tư vấn\nlớp học",
    prompt: "Tư vấn giúp mình lớp học phù hợp theo độ tuổi",
    iconKey: "class-advice",
  },
  {
    id: "tuition",
    title: "Xem\nhọc phí",
    prompt: "Cho mình xem bảng học phí các gói tập hiện tại",
    iconKey: "tuition",
  },
  {
    id: "trial",
    title: "Đăng ký\nhọc thử",
    prompt: "Mình muốn đăng ký buổi học thử miễn phí",
    iconKey: "trial",
  },
];
