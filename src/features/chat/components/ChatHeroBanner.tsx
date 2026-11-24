import { Image, ImageBackground, StyleSheet, View } from "react-native";

import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, effects, hexToRgba, radii, Spacing } from "@/theme";

const HERO_BG = require("../../../../assets/images/chibi/background.png");
const TBOT_MASCOT = require("../../../../assets/images/chibi/chibi-2.png");

export function ChatHeroBanner({
  peerName,
  peerSubtitle,
}: {
  peerName: string;
  peerSubtitle: string;
}) {
  const isTBot = peerName === "TBot";

  return (
    <View style={styles.container}>
      <ImageBackground
        source={HERO_BG}
        resizeMode="cover"
        style={styles.bannerCard}
        imageStyle={styles.bannerImage}
      >
        <View style={styles.mascotWrap}>
          <Image
            source={TBOT_MASCOT}
            style={styles.mascot}
            resizeMode="contain"
          />
        </View>

        <View style={styles.brandBlock}>
          {isTBot ? (
            <View style={styles.brandWordmarkRow}>
              <ThemedText type="subtitle" style={styles.brandT}>
                T
              </ThemedText>
              <ThemedText type="subtitle" style={styles.brandBot}>
                Bot
              </ThemedText>
            </View>
          ) : (
            <ThemedText type="subtitle" style={styles.brandT}>
              {peerName}
            </ThemedText>
          )}
          <View style={styles.subtitlePill}>
            <ThemedText type="caption" style={styles.subtitleText}>
              {peerSubtitle}
            </ThemedText>
          </View>
        </View>
      </ImageBackground>

      <View style={styles.introCard}>
        <View style={styles.introAccentBar} />
        <View style={styles.introContent}>
          <ThemedText type="title" style={styles.introTitle}>
            Xin chào! Em là{" "}
            <ThemedText type="title" style={styles.introTitleAccent}>
              {peerName}
            </ThemedText>{" "}
            👋
          </ThemedText>
          <ThemedText type="bodySmall" style={styles.introSubtitle}>
            {peerSubtitle}
          </ThemedText>
          <ThemedText type="bodySmall" style={styles.introBody}>
            Em sẵn sàng hỗ trợ anh/chị và các bạn học viên về lớp học, học phí,
            lịch học, đăng ký học thử và mọi thông tin về Taekwondo tại CLB. 🥋
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    marginBottom: Spacing.three,
  },
  bannerCard: {
    minHeight: 142,
    borderRadius: radii.xl,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: hexToRgba(Colors.light.primary, 0.06),
  },
  bannerImage: {
    borderRadius: radii.xl,
  },
  mascotWrap: {
    width: 112,
    height: 118,
    alignItems: "center",
    justifyContent: "center",
  },
  mascot: {
    width: 112,
    height: 118,
  },
  brandBlock: {
    flex: 1,
    alignItems: "flex-start",
    gap: 6,
  },
  brandWordmarkRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  brandT: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "900",
    fontStyle: "italic",
    color: Colors.light.text,
    letterSpacing: -0.5,
  },
  brandBot: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "900",
    fontStyle: "italic",
    color: Colors.light.primary,
    letterSpacing: -0.5,
  },
  subtitlePill: {
    backgroundColor: hexToRgba(Colors.light.primary, 0.08),
    borderWidth: 1,
    borderColor: hexToRgba(Colors.light.primary, 0.16),
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  subtitleText: {
    color: Colors.light.text,
    fontWeight: "600",
  },
  introCard: {
    flexDirection: "row",
    backgroundColor: Colors.light.surface,
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.divider,
    ...effects.soft,
  },
  introAccentBar: {
    width: 4,
    backgroundColor: Colors.light.primary,
  },
  introContent: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 4,
  },
  introTitle: {
    color: Colors.light.text,
    fontWeight: "700",
  },
  introTitleAccent: {
    color: Colors.light.primary,
    fontWeight: "800",
  },
  introSubtitle: {
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  introBody: {
    color: Colors.light.text,
    lineHeight: 21,
  },
});
