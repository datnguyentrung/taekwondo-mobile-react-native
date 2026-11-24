import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";

import { useAuthStore } from "@/features/authentication/store/auth.store";
import { useToast } from "@/shared/ui/Toast";

import { TBOT_PEER } from "../constants/chat.constants";
import { createAdkAgentTransport } from "../domain/adkAgentTransport";
import type {
  ChatMessage,
  ChatPeer,
  ChatQuickAction,
  ChatReplyPreview,
  ConversationMemberState,
  MessageReactionEmoji,
} from "../domain/chat.types";
import { buildChatRenderItems } from "../domain/chatPresentation";
import { advanceCursor, advanceMessageStatus } from "../domain/chatStateMachine";
import {
  createLocalChatTransport,
  type ChatTransport,
  type ChatTransportCallbacks,
} from "../domain/chatTransport";
import { formatChatTime } from "../domain/tbotResponder";

function resolvePeer(peerId?: string, peerName?: string): ChatPeer {
  if (!peerId || peerId === "tbot") {
    return TBOT_PEER;
  }
  return {
    id: peerId,
    name: peerName?.trim() || "Nhân viên hỗ trợ",
    subtitle: "Hỗ trợ trực tuyến CLB",
    isBot: false,
    isOnline: true,
  };
}

function createInitialPeerState(
  conversationId: string,
  peer: ChatPeer,
): ConversationMemberState {
  const initialSeq = peer.isBot ? 4 : 0;
  return {
    conversationId,
    userId: peer.id,
    deliveredCursor: initialSeq,
    readCursor: initialSeq,
    readReceiptEnabled: true,
  };
}

function createClientMessageId(): string {
  return `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useChatSession(peerId?: string, peerName?: string) {
  const toast = useToast();
  const currentUserId =
    useAuthStore((state) => state.user?.userId) ?? "default_user";
  const accessToken = useAuthStore((state) => state.accessToken);
  const accessTokenRef = useRef(accessToken);

  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  const peer = useMemo(
    () => resolvePeer(peerId, peerName),
    [peerId, peerName],
  );
  const conversationId = useMemo(() => `conv-${peer.id}`, [peer.id]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [peerState, setPeerState] = useState<ConversationMemberState>(() =>
    createInitialPeerState(conversationId, peer),
  );
  const [draftText, setDraftText] = useState("");
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatReplyPreview | null>(null);
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const [peerStatusMessage, setPeerStatusMessage] = useState<string | null>(
    null,
  );
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(
    null,
  );
  const [infoMessage, setInfoMessage] = useState<ChatMessage | null>(null);
  const [expandedTimestampIds, setExpandedTimestampIds] = useState<
    Record<string, boolean>
  >({});
  const [isAppActive, setIsAppActive] = useState(
    AppState.currentState === "active",
  );

  const transportRef = useRef<ChatTransport | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      setIsAppActive(nextState === "active");
    });
    return () => subscription.remove();
  }, []);

  const createTransport = useCallback((): ChatTransport => {
    if (peer.isBot) {
      return createAdkAgentTransport({
        initialSequenceNo: 10,
        getAuthHeaders: (): Record<string, string> => {
          const token = accessTokenRef.current;
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      });
    }
    return createLocalChatTransport(100);
  }, [peer.isBot]);

  useEffect(() => {
    transportRef.current?.dispose();
    transportRef.current = createTransport();

    return () => {
      transportRef.current?.dispose();
      transportRef.current = null;
    };
  }, [createTransport]);

  const buildTransportCallbacks = useCallback(
    (): ChatTransportCallbacks => ({
      onAcknowledged: (ack) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.clientMessageId === ack.clientMessageId
              ? {
                  ...msg,
                  id: ack.serverMessageId,
                  sequenceNo: ack.sequenceNo,
                  serverAcceptedAt: ack.serverAcceptedAt,
                  status: advanceMessageStatus(msg.status, "SENT"),
                }
              : msg,
          ),
        );
      },
      onFailed: (clientMessageId) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.clientMessageId === clientMessageId
              ? {
                  ...msg,
                  status: advanceMessageStatus(msg.status, "FAILED"),
                }
              : msg,
          ),
        );
      },
      onDeliveryCursorUpdated: (convId, deliveredCursor, deliveredAt) => {
        setPeerState((prev) => {
          if (prev.conversationId !== convId) return prev;
          const nextCursor = advanceCursor(
            prev.deliveredCursor,
            deliveredCursor,
          );
          if (nextCursor === prev.deliveredCursor) return prev;
          return { ...prev, deliveredCursor: nextCursor, deliveredAt };
        });
        setMessages((prev) =>
          prev.map((msg) =>
            msg.sender === "user" &&
            msg.sequenceNo != null &&
            msg.sequenceNo <= deliveredCursor
              ? {
                  ...msg,
                  deliveredAt: msg.deliveredAt ?? deliveredAt,
                  status: advanceMessageStatus(msg.status, "DELIVERED"),
                }
              : msg,
          ),
        );
      },
      onReadCursorUpdated: (convId, readCursor, readAt) => {
        setPeerState((prev) => {
          if (prev.conversationId !== convId) return prev;
          const nextRead = advanceCursor(prev.readCursor, readCursor);
          const nextDelivered = advanceCursor(prev.deliveredCursor, nextRead);
          return {
            ...prev,
            deliveredCursor: nextDelivered,
            readCursor: nextRead,
            readAt,
          };
        });
        setMessages((prev) =>
          prev.map((msg) =>
            msg.sender === "user" &&
            msg.sequenceNo != null &&
            msg.sequenceNo <= readCursor
              ? {
                  ...msg,
                  deliveredAt: msg.deliveredAt ?? readAt,
                  readAt: msg.readAt ?? readAt,
                  status: advanceMessageStatus(msg.status, "READ"),
                }
              : msg,
          ),
        );
      },
      onPeerTyping: (typing) => {
        setIsPeerTyping(typing);
        if (!typing) {
          setPeerStatusMessage(null);
        }
      },
      onPeerStatus: (update) => {
        if (update.status === "COMPLETED" || update.status === "FAILED") {
          setPeerStatusMessage(null);
          return;
        }
        setPeerStatusMessage(update.message);
      },
      onPeerMessage: (incoming) => {
        setPeerStatusMessage(null);
        setIsPeerTyping(false);
        setMessages((prev) => {
          // Deduplicate by clientMessageId or id
          if (
            prev.some(
              (m) =>
                m.id === incoming.id ||
                m.clientMessageId === incoming.clientMessageId,
            )
          ) {
            return prev;
          }
          const now = Date.now();
          const enriched: ChatMessage = isAppActive
            ? { ...incoming, deliveredAt: now, readAt: now }
            : { ...incoming, deliveredAt: now };
          return [...prev, enriched];
        });
      },
      onPeerStreamUpdate: (update) => {
        setMessages((prev) => {
          const existingIdx = prev.findIndex((m) => m.id === update.messageId);
          if (existingIdx !== -1) {
            return prev.map((m) =>
              m.id === update.messageId ? { ...m, text: update.text } : m,
            );
          }
          const now = Date.now();
          const streamedMsg: ChatMessage = {
            id: update.messageId,
            clientMessageId: update.messageId,
            conversationId: update.conversationId,
            senderId: update.peerId,
            sender: "peer",
            type: "text",
            text: update.text,
            timestamp: formatChatTime(new Date(update.createdAt)),
            createdAt: update.createdAt,
            serverAcceptedAt: update.createdAt,
            deliveredAt: now,
            readAt: isAppActive ? now : undefined,
          };
          return [...prev, streamedMsg];
        });
      },
      onError: (message) => {
        toast.show({
          message,
          variant: "error",
        });
      },
    }),
    [isAppActive, toast],
  );

  const dispatchMessage = useCallback(
    (message: ChatMessage) => {
      if (!transportRef.current) return;
      transportRef.current.send(
        {
          clientMessageId: message.clientMessageId,
          conversationId: message.conversationId,
          senderId: message.senderId,
          text: message.text,
          imageUri: message.imageUri,
          replyTo: message.replyTo,
          createdAt: message.createdAt,
        },
        peer,
        buildTransportCallbacks(),
      );
    },
    [buildTransportCallbacks, peer],
  );

  const sendMessage = useCallback(
    (overrideText?: string) => {
      const text = (overrideText ?? draftText).trim();
      const imageUri = overrideText ? undefined : (pendingImageUri ?? undefined);
      if (!text && !imageUri) return;

      const now = Date.now();
      const clientMessageId = createClientMessageId();
      const optimisticMessage: ChatMessage = {
        id: clientMessageId,
        clientMessageId,
        conversationId,
        senderId: currentUserId,
        sender: "user",
        type: imageUri && !text ? "image" : "text",
        text,
        timestamp: formatChatTime(new Date(now)),
        createdAt: now,
        status: "SENDING",
        imageUri,
        replyTo: replyingTo ?? undefined,
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      if (!overrideText) {
        setDraftText("");
        setPendingImageUri(null);
      }
      setReplyingTo(null);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
        () => {},
      );

      dispatchMessage(optimisticMessage);
    },
    [
      conversationId,
      currentUserId,
      dispatchMessage,
      draftText,
      pendingImageUri,
      replyingTo,
    ],
  );

  const retryMessage = useCallback(
    (clientMessageId: string) => {
      const target = messages.find(
        (m) => m.clientMessageId === clientMessageId && m.status === "FAILED",
      );
      if (!target) return;

      const cleanedText = target.text.replace(/\s*\[fail\]\s*/g, " ").trim();
      const retriedMessage: ChatMessage = {
        ...target,
        text: cleanedText || target.text,
        status: "SENDING",
      };

      setMessages((prev) =>
        prev.map((m) =>
          m.clientMessageId === clientMessageId ? retriedMessage : m,
        ),
      );
      dispatchMessage(retriedMessage);
    },
    [dispatchMessage, messages],
  );

  const sendQuickAction = useCallback(
    (action: ChatQuickAction) => {
      sendMessage(action.prompt);
    },
    [sendMessage],
  );

  const pickImageAttachment = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        setPendingImageUri(result.assets[0].uri);
      }
    } catch {
      toast.show({
        message: "Không thể mở thư viện ảnh trên thiết bị này.",
        variant: "error",
      });
    }
  }, [toast]);

  const toggleTimestamp = useCallback((messageId: string) => {
    setExpandedTimestampIds((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  }, []);

  const toggleReaction = useCallback(
    (messageId: string, emoji: MessageReactionEmoji) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== messageId || msg.isRecalled) return msg;
          const existing = msg.reactions ?? [];
          const next = existing.includes(emoji)
            ? existing.filter((item) => item !== emoji)
            : [...existing, emoji];
          return { ...msg, reactions: next };
        }),
      );
      setSelectedMessage(null);
      void Haptics.selectionAsync().catch(() => {});
    },
    [],
  );

  const startReply = useCallback(
    (message: ChatMessage) => {
      if (message.isRecalled) return;
      setReplyingTo({
        messageId: message.id,
        senderName: message.sender === "user" ? "Bạn" : peer.name,
        snippet:
          message.text || (message.imageUri ? "[Hình ảnh]" : "Tin nhắn"),
      });
      setSelectedMessage(null);
    },
    [peer.name],
  );

  const copyMessage = useCallback(
    async (message: ChatMessage) => {
      if (message.isRecalled || !message.text) {
        setSelectedMessage(null);
        return;
      }
      await Clipboard.setStringAsync(message.text);
      setSelectedMessage(null);
      toast.show({
        message: "Đã sao chép nội dung tin nhắn.",
        variant: "success",
      });
    },
    [toast],
  );

  const forwardMessage = useCallback(
    (message: ChatMessage) => {
      setSelectedMessage(null);
      if (message.isRecalled) return;
      toast.show({
        message: "Đã chuẩn bị chuyển tiếp tin nhắn.",
        variant: "info",
      });
    },
    [toast],
  );

  const reportMessage = useCallback(
    (message: ChatMessage) => {
      setSelectedMessage(null);
      if (message.sender !== "peer") return;
      toast.show({
        message: "Đã gửi báo cáo tin nhắn tới quản trị viên CLB.",
        variant: "info",
      });
    },
    [toast],
  );

  const openMessageInfo = useCallback((message: ChatMessage) => {
    setSelectedMessage(null);
    setInfoMessage(message);
  }, []);

  const recallMessage = useCallback((messageId: string) => {
    const recalledAt = Date.now();
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId && msg.sender === "user"
          ? {
              ...msg,
              text: "Bạn đã thu hồi một tin nhắn",
              imageUri: undefined,
              reactions: undefined,
              recalledAt,
              isRecalled: true,
            }
          : msg,
      ),
    );
    setSelectedMessage(null);
  }, []);

  const resetConversation = useCallback(() => {
    transportRef.current?.dispose();
    transportRef.current = createTransport();
    setMessages([]);
    setPeerState(createInitialPeerState(conversationId, peer));
    setDraftText("");
    setPendingImageUri(null);
    setReplyingTo(null);
    setIsPeerTyping(false);
    setPeerStatusMessage(null);
    setSelectedMessage(null);
    setInfoMessage(null);
    setExpandedTimestampIds({});
    toast.show({
      message: "Đã làm mới cuộc trò chuyện.",
      variant: "info",
    });
  }, [conversationId, createTransport, peer, toast]);

  const renderItems = useMemo(
    () => buildChatRenderItems(messages, peerState),
    [messages, peerState],
  );

  return {
    peer,
    messages,
    renderItems,
    expandedTimestampIds,
    toggleTimestamp,
    draftText,
    setDraftText,
    pendingImageUri,
    clearPendingImage: () => setPendingImageUri(null),
    replyingTo,
    cancelReply: () => setReplyingTo(null),
    isPeerTyping,
    peerStatusMessage,
    showQuickActions,
    toggleQuickActions: () => setShowQuickActions((prev) => !prev),
    selectedMessage,
    openMessageActions: setSelectedMessage,
    closeMessageActions: () => setSelectedMessage(null),
    infoMessage,
    openMessageInfo,
    closeMessageInfo: () => setInfoMessage(null),
    sendMessage,
    retryMessage,
    sendQuickAction,
    pickImageAttachment,
    toggleReaction,
    startReply,
    copyMessage,
    forwardMessage,
    reportMessage,
    recallMessage,
    resetConversation,
  };
}
