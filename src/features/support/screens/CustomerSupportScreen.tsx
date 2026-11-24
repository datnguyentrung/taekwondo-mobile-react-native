import { useRouter, type Href } from "expo-router";
import { StyleSheet, View } from "react-native";

import { useAuthSession } from "@/features/authentication";
import { DefaultHeaderActions } from "@/routes/navigation/components/DefaultHeaderActions";
import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import { useToast } from "@/shared/ui/Toast";
import { Colors, Spacing, hexToRgba } from "@/theme";

import { SupportHeroSection } from "../components/SupportHeroSection";
import { SupportQuickCards } from "../components/SupportQuickCards";
import { SupportRequestsSection } from "../components/SupportRequestsSection";

export function CustomerSupportScreen() {
  const router = useRouter();
  const toast = useToast();
  const { activeContext, user } = useAuthSession();
  const displayName = (
    activeContext?.displayName ??
    user?.phoneNumber ??
    "HỘI VIÊN"
  ).toLocaleUpperCase("vi-VN");

  const showComingSoon = (label: string) => {
    toast.show({
      message: `Tính năng "${label}" đang được phát triển.`,
      variant: "info",
    });
  };

  return (
    <StackScreenLayout
      title="Hỗ trợ khách hàng"
      rightActions={<DefaultHeaderActions />}
      contentContainerStyle={styles.content}
    >
      <View style={styles.heroBand}>
        <SupportHeroSection
          displayName={displayName}
          onPressChat={() => router.push("/chat/tbot" as Href)}
          onPressHotline={() => showComingSoon("Hotline TKD")}
        />
        <SupportQuickCards
          onSelectCard={(item) =>
            showComingSoon(item.title.replace("\n", " "))
          }
        />
      </View>

      <View style={styles.requestsBand}>
        <SupportRequestsSection />
      </View>
    </StackScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  heroBand: {
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
    paddingHorizontal: 20,
    gap: Spacing.three,
    backgroundColor: hexToRgba(Colors.light.primary, 0.02),
    experimental_backgroundImage: `linear-gradient(155deg, ${hexToRgba(Colors.light.primary, 0.045)} 0%, rgba(255, 197, 51, 0.035) 38%, ${hexToRgba(Colors.light.primary, 0.015)} 72%, ${Colors.light.background} 100%)`,
  },
  requestsBand: {
    paddingHorizontal: 20,
  },
});
