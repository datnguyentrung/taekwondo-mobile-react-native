import { useEffect, useRef } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Refresh } from "reicon-react-native";

import { DefaultHeaderActions } from "@/routes/navigation/components/DefaultHeaderActions";
import { HeaderActionButton } from "@/routes/navigation/components/HeaderActionButton";
import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import { Colors } from "@/theme";

import { ChatComposerBar } from "../components/ChatComposerBar";
import { ChatHeroBanner } from "../components/ChatHeroBanner";
import { ChatMessageActionSheet } from "../components/ChatMessageActionSheet";
import { ChatMessageBubble } from "../components/ChatMessageBubble";
import { ChatMessageInfoSheet } from "../components/ChatMessageInfoSheet";
import { ChatQuickActionChips } from "../components/ChatQuickActionChips";
import { ChatTypingIndicator } from "../components/ChatTypingIndicator";
import type { ChatRenderItem } from "../domain/chat.types";
import { useChatSession } from "../hooks/useChatSession";

export function ChatScreen({
  peerId = "tbot",
  peerName,
}: {
  peerId?: string;
  peerName?: string;
}) {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ChatRenderItem>>(null);
  const {
    peer,
    renderItems,
    expandedTimestampIds,
    toggleTimestamp,
    draftText,
    setDraftText,
    pendingImageUri,
    clearPendingImage,
    replyingTo,
    cancelReply,
    isPeerTyping,
    showQuickActions,
    toggleQuickActions,
    selectedMessage,
    openMessageActions,
    closeMessageActions,
    infoMessage,
    openMessageInfo,
    closeMessageInfo,
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
  } = useChatSession(peerId, peerName);

  useEffect(() => {
    if (renderItems.length === 0 && !isPeerTyping) return;
    const timer = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(timer);
  }, [isPeerTyping, renderItems.length]);

  return (
    <StackScreenLayout
      title={peer.name}
      scrollEnabled={false}
      refreshEnabled={false}
      rightActions={
        <>
          <HeaderActionButton
            icon={<Refresh />}
            label="Làm mới cuộc trò chuyện"
            onPress={resetConversation}
            testID="chat-reset-button"
          />
          <DefaultHeaderActions />
        </>
      }
      contentContainerStyle={styles.screenContent}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 56 : 0}
      >
        <FlatList
          ref={listRef}
          data={renderItems}
          keyExtractor={(item) => item.message.clientMessageId}
          renderItem={({ item }) => (
            <ChatMessageBubble
              item={item}
              peerName={peer.name}
              isTimestampExpanded={Boolean(
                expandedTimestampIds[item.message.id],
              )}
              onToggleTimestamp={toggleTimestamp}
              onLongPress={openMessageActions}
              onRetry={retryMessage}
            />
          )}
          ListHeaderComponent={
            <ChatHeroBanner peerName={peer.name} peerSubtitle={peer.subtitle} />
          }
          ListFooterComponent={
            isPeerTyping ? (
              <ChatTypingIndicator peerName={peer.name} />
            ) : undefined
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          style={styles.list}
        />

        <View
          style={[
            styles.bottomDock,
            { paddingBottom: Math.max(insets.bottom, 4) },
          ]}
        >
          <ChatQuickActionChips
            visible={showQuickActions}
            onSelect={sendQuickAction}
          />
          <ChatComposerBar
            peerName={peer.name}
            value={draftText}
            onChangeText={setDraftText}
            onSend={() => sendMessage()}
            onPickImage={() => void pickImageAttachment()}
            onToggleQuickActions={toggleQuickActions}
            showQuickActions={showQuickActions}
            pendingImageUri={pendingImageUri}
            onClearPendingImage={clearPendingImage}
            replyingTo={replyingTo}
            onCancelReply={cancelReply}
          />
        </View>
      </KeyboardAvoidingView>

      <ChatMessageActionSheet
        message={selectedMessage}
        onClose={closeMessageActions}
        onReact={toggleReaction}
        onReply={startReply}
        onCopy={(msg) => void copyMessage(msg)}
        onForward={forwardMessage}
        onInfo={openMessageInfo}
        onRecall={recallMessage}
        onReport={reportMessage}
      />

      <ChatMessageInfoSheet
        message={infoMessage}
        onClose={closeMessageInfo}
      />
    </StackScreenLayout>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  list: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
  },
  bottomDock: {
    backgroundColor: Colors.light.surface,
  },
});
