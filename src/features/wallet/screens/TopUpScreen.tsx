import { useState } from "react";
import { Pressable, StyleSheet } from "react-native";

import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors } from "@/theme";

import {
  BalanceCard,
  FormField,
  PrimaryActionButton,
  StudentSummaryCard,
  SurfaceCard,
} from "@/features/student-commerce/components/StudentCommercePrimitives";
import type { StudentRouteProps, TopUpDraft } from "@/features/student-commerce/types";
import {
  calculateBalanceAfterTopUp,
  formatVnd,
  getCommerceState,
} from "@/features/student-commerce/utils/studentCommerceUtils";

export function TopUpScreen({ studentCode: _studentCode }: StudentRouteProps) {
  const state = getCommerceState();
  const [draft, setDraft] = useState<TopUpDraft>({
    amount: 2000000,
    externalReference: "ZALO-13092026",
    note: "PH chuyển khoản qua Zalo",
    hasTransferImage: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const balanceBefore = state.wallet.balance - draft.amount;

  return (
    <StackScreenLayout title="Nạp tiền" contentContainerStyle={styles.content}>
      <StudentSummaryCard student={state.selectedStudent} />
      <BalanceCard label="Số dư hiện tại" amount={balanceBefore} />
      <FormField
        label="Số tiền"
        value={formatVnd(draft.amount)}
        keyboardType="numeric"
        helper="Tiền sẽ được cộng trực tiếp vào ví học viên"
        onChangeText={(value) =>
          setDraft((current) => ({
            ...current,
            amount: Number(value.replace(/\D/g, "")) || 0,
          }))
        }
      />
      <FormField
        label="Mã tham chiếu"
        value={draft.externalReference}
        onChangeText={(externalReference) =>
          setDraft((current) => ({ ...current, externalReference }))
        }
      />
      <FormField
        label="Ghi chú"
        value={draft.note}
        onChangeText={(note) => setDraft((current) => ({ ...current, note }))}
      />
      <SurfaceCard soft style={styles.uploadBox}>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            setDraft((current) => ({
              ...current,
              hasTransferImage: !current.hasTransferImage,
            }))
          }
        >
          <ThemedText type="bodySmall" style={styles.primaryText}>
            {draft.hasTransferImage
              ? "Đã thêm ảnh chuyển khoản"
              : "＋ Thêm ảnh chuyển khoản"}
          </ThemedText>
        </Pressable>
      </SurfaceCard>
      <ThemedText type="bodySmall" style={styles.secondaryText}>
        JPG / PNG
      </ThemedText>
      <BalanceCard
        label="Số dư sau giao dịch"
        amount={calculateBalanceAfterTopUp(
          { ...state.wallet, balance: balanceBefore },
          draft.amount,
        )}
      />
      <PrimaryActionButton
        title="Xác nhận nạp tiền"
        loading={submitting}
        disabled={!draft.amount || draft.externalReference.trim().length === 0}
        onPress={() => {
          setSubmitting(true);
          setTimeout(() => setSubmitting(false), 450);
        }}
      />
      <ThemedText type="bodySmall" style={styles.blackText}>
        Giao dịch sẽ tạo TOP_UP / CREDIT sau khi xác nhận.
      </ThemedText>
    </StackScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 20,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  uploadBox: {
    height: 96,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    color: Colors.light.primary,
  },
  secondaryText: {
    color: Colors.light.textSecondary,
  },
  blackText: {
    color: Colors.light.text,
  },
});
