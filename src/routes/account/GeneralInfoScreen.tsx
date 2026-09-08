import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import StackScreenLayout, {
  StackHeaderAction,
} from "@/routes/navigation/layouts/StackScreenLayout";
import { AppIcon } from "@/shared/ui/AppIcon";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, effects, figmaColors, radii, typography } from "@/theme";
import type { AppIconName } from "@/theme/icons";
import { router } from "expo-router";

type GeneralInfoItem = {
  label: string;
  value: string;
  icon: AppIconName;
};

const GENERAL_INFO_ITEMS: GeneralInfoItem[] = [
  { label: "Giới tính", value: "Nam", icon: "profileUser" },
  { label: "Ngày sinh", value: "31-10-2005", icon: "dateRangeDuotoneLine" },
  { label: "Email", value: "vq@gmail.com", icon: "profileMail" },
  { label: "Số điện thoại", value: "0912345678", icon: "profilePhone" },
  { label: "Chiều cao", value: "180 cm", icon: "profileHeight" },
  { label: "Cân nặng", value: "80 kg", icon: "profileWeight" },
  { label: "Cấp độ đai", value: "Đen", icon: "profileBelt" },
  { label: "Điểm rèn luyện quý gần nhất", value: "8/10", icon: "profileScore" },
];

export default function GeneralInfoScreen() {
  const labelName = "Nguyễn Trung Đạt".toLocaleUpperCase("vi-VN");

  const actions: StackHeaderAction[] = [
    {
      icon: "bellOutline",
      label: "Thông báo",
      onPress: () => router.push("/notifications"),
    },
    {
      icon: "homeOutline",
      label: "Trang chủ",
      onPress: () => router.push("/"),
    },
  ];

  return (
    <StackScreenLayout
      title="Thông tin chung"
      contentContainerStyle={styles.content}
      floatingContent={<SupportButtons />}
      rightActions={actions}
    >
      <View style={styles.card}>
        <View style={styles.avatarWrap}>
          <AppIcon name="profileAvatar" size={90} />
          <View style={styles.editBadge}>
            <AppIcon name="profileEdit" size={21} />
          </View>
        </View>

        <ThemedText type="title" style={styles.name}>
          {labelName}
        </ThemedText>

        <View style={styles.infoList}>
          {GENERAL_INFO_ITEMS.map((item, index) => (
            <GeneralInfoRow
              key={item.label}
              item={item}
              showDivider={index < GENERAL_INFO_ITEMS.length - 1}
            />
          ))}
        </View>
      </View>
    </StackScreenLayout>
  );
}

function GeneralInfoRow({
  item,
  showDivider,
}: {
  item: GeneralInfoItem;
  showDivider: boolean;
}) {
  return (
    <View style={[styles.infoRow, !showDivider ? styles.infoRowLast : null]}>
      <AppIcon
        name={item.icon}
        color={figmaColors.color1}
        size={30}
        style={styles.infoIcon}
      />
      <View style={styles.infoCopy}>
        <ThemedText type="bodySmall" style={styles.infoLabel}>
          {item.label}
        </ThemedText>
        <ThemedText type="body" style={styles.infoValue}>
          {item.value}
        </ThemedText>
      </View>
      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

function SupportButtons() {
  return (
    <View pointerEvents="box-none" style={styles.supportButtons}>
      <View style={styles.supportButton}>
        <AppIcon name="headphonesFill" size={35} color={Colors.light.accent} />
      </View>
      <Image
        source={require("@/assets/images/zalo-support.png")}
        style={styles.zaloButton}
        contentFit="cover"
        accessibilityLabel="Zalo"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 22,
  },
  card: {
    borderWidth: 1,
    borderColor: Colors.light.divider,
    borderRadius: radii.md,
    backgroundColor: Colors.light.surface,
    paddingTop: 66,
    overflow: "visible",
    ...effects.soft,
  },
  avatarWrap: {
    position: "absolute",
    top: -39,
    alignSelf: "center",
    width: 90,
    height: 90,
  },
  editBadge: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    color: Colors.light.text,
    textAlign: "center",
    ...typography.title,
  },
  infoList: {
    paddingHorizontal: 14,
    marginVertical: 23,
  },
  infoRow: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 4,
    paddingRight: 2,
  },
  infoRowLast: {
    height: 55,
  },
  infoIcon: {
    marginTop: 7,
  },
  infoCopy: {
    flex: 1,
    marginLeft: 20,
  },
  infoLabel: {
    color: Colors.light.divider,
  },
  infoValue: {
    marginTop: 1,
    color: Colors.light.text,
  },
  divider: {
    position: "absolute",
    left: 0,
    right: 2,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.light.divider,
  },
  supportButtons: {
    position: "absolute",
    right: 31,
    bottom: 64,
    gap: 12,
  },
  supportButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.surface,
    ...effects.card,
  },
  zaloButton: {
    width: 56,
    height: 55,
    borderRadius: 10,
    ...effects.card,
  },
});
