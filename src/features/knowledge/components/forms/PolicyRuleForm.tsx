import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { FormField } from "@/shared/ui/commerce/CommercePrimitives";

import { POLICY_CATEGORY_OPTIONS, WEEKDAY_KEYS } from "../../constants/knowledgeForms";
import type { PolicyCategory, PolicyRuleFormPayload } from "../../domain/knowledge.types";
import {
  KnowledgeDropdownField,
  KnowledgeSectionCard,
  KnowledgeTagListInput,
  useFloatingFormSubmit,
  type FloatingFormProps,
} from "../KnowledgeFormControls";

export function PolicyRuleForm({
  tenantId,
  onSubmit,
  submitRef,
  onValidChange,
}: FloatingFormProps<PolicyRuleFormPayload>) {
  const [policyCode, setPolicyCode] = useState("");
  const [category, setCategory] = useState<PolicyCategory>("TRIAL");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [branchIdStrings, setBranchIdStrings] = useState<string[]>([]);

  // Conditional fields for OPENING_HOURS
  const [operatingHours, setOperatingHours] = useState<Record<string, string>>({
    MON: "17:00 - 21:00",
    TUE: "17:00 - 21:00",
    WED: "17:00 - 21:00",
    THU: "17:00 - 21:00",
    FRI: "17:00 - 21:00",
    SAT: "08:00 - 20:00",
    SUN: "08:00 - 18:00",
  });

  // Conditional fields for PAYMENT
  const [paymentMethod, setPaymentMethod] = useState("Chuyển khoản ngân hàng / Tiền mặt");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const handleSave = () => {
    onSubmit({
      tenant_id: tenantId,
      policy_code: policyCode.trim(),
      category,
      title: title.trim(),
      summary: summary.trim(),
      conditions,
      operating_hours: category === "OPENING_HOURS" ? operatingHours : undefined,
      payment_methods:
        category === "PAYMENT"
          ? [
              {
                method: paymentMethod.trim(),
                bank_name: bankName.trim() || undefined,
                account_number: accountNumber.trim() || undefined,
                account_name: accountName.trim() || undefined,
              },
            ]
          : undefined,
      effective_from: effectiveFrom.trim() || undefined,
      effective_to: effectiveTo.trim() || undefined,
      branch_ids: branchIdStrings
        .map((s) => Number(s))
        .filter((n) => Number.isInteger(n) && n > 0),
    });
  };

  const isValid = Boolean(policyCode.trim() && title.trim() && summary.trim());
  useFloatingFormSubmit(submitRef, handleSave, isValid, onValidChange);

  return (
    <View style={styles.form}>
      <KnowledgeSectionCard
        title="Phân loại & Nội dung chính sách"
        subtitle="1 form dùng chung cho Học thử, Giờ mở cửa, Nội quy, Thi đai, Học phí, Thanh toán"
      >
        <KnowledgeDropdownField
          label="Loại chính sách *"
          options={POLICY_CATEGORY_OPTIONS}
          value={category}
          onChange={setCategory}
        />
        <FormField
          label="Mã chính sách *"
          placeholder="VD: trial-2026, opening-hours"
          value={policyCode}
          onChangeText={setPolicyCode}
          autoCapitalize="none"
        />
        <FormField
          label="Tiêu đề chính sách *"
          placeholder="VD: Chính sách học thử miễn phí 1 buổi"
          value={title}
          onChangeText={setTitle}
        />
        <FormField
          label="Nội dung tóm tắt *"
          placeholder="Mô tả chi tiết quy định..."
          value={summary}
          onChangeText={setSummary}
          multiline
          style={styles.multiline}
        />
        <KnowledgeTagListInput
          label="Điều kiện áp dụng"
          placeholder="Nhập 1 điều kiện rồi nhấn +"
          items={conditions}
          onChange={setConditions}
        />
      </KnowledgeSectionCard>

      {category === "OPENING_HOURS" ? (
        <KnowledgeSectionCard title="Giờ mở cửa theo thứ">
          {WEEKDAY_KEYS.map((day) => (
            <FormField
              key={day.key}
              label={day.label}
              placeholder="VD: 17:00 - 21:00 hoặc Nghỉ"
              value={operatingHours[day.key] ?? ""}
              onChangeText={(text) =>
                setOperatingHours((prev) => ({ ...prev, [day.key]: text }))
              }
            />
          ))}
        </KnowledgeSectionCard>
      ) : null}

      {category === "PAYMENT" ? (
        <KnowledgeSectionCard title="Thông tin thanh toán">
          <FormField
            label="Hình thức thanh toán"
            value={paymentMethod}
            onChangeText={setPaymentMethod}
          />
          <FormField
            label="Ngân hàng"
            placeholder="VD: Vietcombank"
            value={bankName}
            onChangeText={setBankName}
          />
          <FormField
            label="Số tài khoản"
            placeholder="VD: 0123456789"
            value={accountNumber}
            onChangeText={setAccountNumber}
          />
          <FormField
            label="Chủ tài khoản"
            placeholder="VD: CLB TAEKWONDO VAN QUAN"
            value={accountName}
            onChangeText={setAccountName}
          />
        </KnowledgeSectionCard>
      ) : null}

      <KnowledgeSectionCard title="Hiệu lực & Cơ sở áp dụng">
        <View style={styles.row}>
          <View style={styles.half}>
            <FormField
              label="Hiệu lực từ (YYYY-MM-DD)"
              placeholder="2026-01-01"
              value={effectiveFrom}
              onChangeText={setEffectiveFrom}
            />
          </View>
          <View style={styles.half}>
            <FormField
              label="Đến ngày (YYYY-MM-DD)"
              placeholder="2026-12-31"
              value={effectiveTo}
              onChangeText={setEffectiveTo}
            />
          </View>
        </View>
        <KnowledgeTagListInput
          label="Cơ sở áp dụng (tùy chọn)"
          placeholder="Nhập mã cơ sở (VD: 1)"
          items={branchIdStrings}
          onChange={setBranchIdStrings}
        />
      </KnowledgeSectionCard>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  multiline: { minHeight: 96, textAlignVertical: "top", paddingTop: 12 },
  row: { flexDirection: "row", gap: 10 },
  half: { flex: 1 },
});
