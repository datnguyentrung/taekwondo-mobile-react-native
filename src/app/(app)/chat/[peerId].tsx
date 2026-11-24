import { useLocalSearchParams } from "expo-router";

import { ChatScreen } from "@/features/chat";

export default function ChatPeerRoute() {
  const { peerId, name } = useLocalSearchParams<{
    peerId?: string;
    name?: string;
  }>();

  return <ChatScreen peerId={peerId} peerName={name} />;
}
