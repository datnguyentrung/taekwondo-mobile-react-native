import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { ThemedText } from "@/shared/ui/ThemedText";
import { getNameInitials } from "@/shared/utils/getNameInitials";
import { Colors } from "@/theme";

export interface UserAvatarProps {
  name?: string | null;
  imageUrl?: string | null;
  gender?: boolean | null;
  mode?: "initials" | "image";
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function UserAvatar({
  name,
  imageUrl,
  gender,
  mode = "initials",
  size = 40,
  style,
}: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);
  const avatarDimension = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };
  const genderImage =
    gender === true
      ? require("../../../assets/images/nam-avatar.png")
      : gender === false
        ? require("../../../assets/images/nu-avatar.png")
        : null;
  const imageSource = imageUrl ? { uri: imageUrl } : genderImage;

  if (mode === "image" && imageSource && !hasError) {
    return (
      <View style={[avatarDimension, style]}>
        <Image
          source={imageSource}
          style={[styles.avatar, avatarDimension]}
          contentFit="cover"
          transition={200}
          onError={() => setHasError(true)}
          accessibilityLabel={
            name ? `Ảnh đại diện của ${name}` : "Ảnh đại diện"
          }
        />
      </View>
    );
  }

  const initials = getNameInitials(name).slice(0, 2);
  const fontSize = Math.max(11, Math.round(size * 0.38));

  return (
    <View
      style={[styles.fallbackContainer, avatarDimension, style]}
      accessibilityLabel={name ? `Ảnh đại diện của ${name}` : "Ảnh đại diện"}
    >
      <ThemedText
        type="featureLabel"
        style={[styles.initialsText, { fontSize }]}
      >
        {initials}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: Colors.light.backgroundElement,
  },
  fallbackContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.surface,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  initialsText: {
    color: Colors.light.primary,
    fontWeight: "700",
  },
});
