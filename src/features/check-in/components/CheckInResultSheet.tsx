import { memo } from "react";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";
import { User, UserScan, X } from "reicon-react-native";

import { AppIcon } from "@/shared/ui/AppIcon";
import { BottomSheetWindow } from "@/shared/ui/BottomSheetWindow";
import { FloatingActionBar } from "@/shared/ui/FloatingActionBar";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, radii } from "@/theme";

import type { CheckInFailure, CheckInRecord } from "../types/faceScanner.types";
import { getCheckInResultPresentation } from "./checkInResultPresentation";

type CheckInResultSheetProps = {
  visible: boolean;
  isPending?: boolean;
  progressMessage?: string;
  record: CheckInRecord | null;
  failure?: CheckInFailure | null;
  onNextScan: () => void;
  onClose: () => void;
  onCancel?: () => void;
};

function RecognizedPersonCard({ record }: { record: CheckInRecord }) {
  const isStudent = record.role === "STUDENT";
  const confidenceLabel =
    typeof record.confidence === "number"
      ? `${Math.round(record.confidence * 100)}%`
      : null;

  return (
    <View style={styles.personCard}>
      {record.avatarUrl ? (
        <Image
          source={{ uri: record.avatarUrl }}
          style={styles.avatar}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <AppIcon icon={<User />} size={24} color={Colors.light.textSecondary} />
        </View>
      )}

      <View style={styles.personInfo}>
        <ThemedText type="heading" style={styles.personName} numberOfLines={1}>
          {record.fullName}
        </ThemedText>
        <ThemedText type="bodySmall" style={styles.personCode}>
          {isStudent ? `Mã HV: ${record.code}` : `Mã NV: ${record.code}`}
        </ThemedText>
        {record.courseName ? (
          <ThemedText type="caption" style={styles.courseText} numberOfLines={1}>
            {record.courseName}
            {record.sessionTime ? ` · ${record.sessionTime}` : ""}
          </ThemedText>
        ) : null}
      </View>

      {confidenceLabel ? (
        <View style={styles.confidencePill}>
          <ThemedText style={styles.confidencePillText}>{confidenceLabel}</ThemedText>
        </View>
      ) : null}
    </View>
  );
}

function CheckInResultSheetComponent({
  visible,
  isPending = false,
  progressMessage = "Đang đối chiếu dữ liệu...",
  record,
  failure,
  onNextScan,
  onClose,
  onCancel,
}: CheckInResultSheetProps) {
  if (!record && !failure && !isPending) return null;

  if (isPending) {
    return (
      <BottomSheetWindow
        visible={visible}
        title="Đang xử lý điểm danh..."
        onClose={onCancel || onClose}
        footer={
          <FloatingActionBar
            placement="sheet"
            actions={[
              {
                key: "cancel-check-in",
                label: "Hủy thao tác",
                accessibilityLabel: "Hủy thao tác điểm danh",
                onPress: onCancel || onClose,
                variant: "outline",
                icon: (
                  <AppIcon icon={<X />} size={18} color={Colors.light.primary} />
                ),
              },
            ]}
          />
        }
      >
        <View style={styles.pendingContent}>
          <View style={styles.pendingHeading}>
            <ActivityIndicator size="small" color={Colors.light.primary} />
            <ThemedText type="heading" style={styles.pendingTitle}>
              {progressMessage}
            </ThemedText>
          </View>

          {record ? (
            <RecognizedPersonCard record={record} />
          ) : (
            <View style={styles.pendingNoticeCard}>
              <ThemedText type="bodySmall" style={styles.pendingNoticeText}>
                {progressMessage}
              </ThemedText>
            </View>
          )}
        </View>
      </BottomSheetWindow>
    );
  }

  const presentation = getCheckInResultPresentation(record, failure);
  const actionHandler =
    failure?.errorType === "ACCESS_DENIED" ? onClose : onNextScan;

  return (
    <BottomSheetWindow
      visible={visible}
      title={presentation.title}
      headerVariant="close-only"
      accessibilityLabel={`Kết quả điểm danh: ${presentation.title}`}
      contentContainerStyle={styles.resultScrollContent}
      onClose={onClose}
      footer={
        <FloatingActionBar
          placement="sheet"
          actions={[
            {
              key: "scan-next-person",
              label: presentation.ctaLabel,
              accessibilityLabel: presentation.ctaLabel,
              onPress: actionHandler,
              variant: "primary",
              icon: (
                <AppIcon
                  icon={<UserScan />}
                  size={20}
                  color={Colors.light.surface}
                />
              ),
              style: styles.resultAction,
              textStyle: styles.resultActionText,
            },
          ]}
        />
      }
    >
      <View style={styles.resultContent}>
        <Image
          testID={`check-in-result-artwork-${presentation.artworkGroup}`}
          accessibilityLabel={`Minh họa kết quả ${presentation.artworkGroup}`}
          source={presentation.artwork}
          style={styles.resultArtwork}
          resizeMode="contain"
        />

        <ThemedText
          type="heading"
          style={[styles.resultTitle, { color: presentation.accentColor }]}
        >
          {presentation.title}
        </ThemedText>
        <ThemedText type="body" style={styles.resultMessage}>
          {presentation.message}
        </ThemedText>

        {record ? <RecognizedPersonCard record={record} /> : null}

        {record && !failure ? (
          <View style={styles.successMetaRow}>
            <ThemedText type="caption" style={styles.successMetaText}>
              {record.statusLabel}
            </ThemedText>
            <ThemedText type="caption" style={styles.successMetaText}>
              {record.checkInTime} · {record.dateLabel}
            </ThemedText>
          </View>
        ) : null}

        {failure?.detail && failure.detail !== failure.message ? (
          <ThemedText type="caption" style={styles.failureDetail}>
            {failure.detail}
          </ThemedText>
        ) : null}
        {failure?.correlationId ? (
          <ThemedText type="caption" style={styles.correlationText}>
            Mã hỗ trợ: {failure.correlationId}
          </ThemedText>
        ) : null}
      </View>
    </BottomSheetWindow>
  );
}

const styles = StyleSheet.create({
  pendingContent: {
    paddingTop: 12,
    gap: 16,
  },
  pendingHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  pendingTitle: {
    color: Colors.light.primary,
    fontSize: 16,
    fontWeight: "700",
  },
  pendingNoticeCard: {
    backgroundColor: Colors.light.background,
    borderRadius: radii.md,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  pendingNoticeText: {
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  resultScrollContent: {
    paddingTop: 0,
  },
  resultContent: {
    alignItems: "center",
    gap: 12,
    paddingBottom: 4,
  },
  resultArtwork: {
    width: 250,
    height: 188,
    marginTop: -6,
    marginBottom: 2,
  },
  resultTitle: {
    width: "100%",
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    textAlign: "center",
  },
  resultMessage: {
    maxWidth: 330,
    color: Colors.light.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 8,
  },
  personCard: {
    width: "100%",
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: radii.lg,
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.divider,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: Colors.light.divider,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.primarySoft,
  },
  personInfo: {
    flex: 1,
    gap: 3,
  },
  personName: {
    color: Colors.light.text,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
  },
  personCode: {
    color: Colors.light.textSecondary,
    fontSize: 13,
  },
  courseText: {
    color: Colors.light.textSecondary,
    fontSize: 11,
  },
  confidencePill: {
    minWidth: 48,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    alignItems: "center",
    backgroundColor: Colors.light.primarySoft,
  },
  confidencePillText: {
    color: Colors.light.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  successMetaRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  successMetaText: {
    color: Colors.light.textSecondary,
    fontSize: 12,
  },
  failureDetail: {
    color: Colors.light.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  correlationText: {
    color: Colors.light.textSecondary,
    fontSize: 11,
  },
  resultAction: {
    borderRadius: radii.lg,
  },
  resultActionText: {
    fontSize: 15,
    fontWeight: "700",
  },
});

export const CheckInResultSheet = memo(CheckInResultSheetComponent);
