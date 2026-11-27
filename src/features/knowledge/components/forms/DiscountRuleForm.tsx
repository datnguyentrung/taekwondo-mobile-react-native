import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { FormField } from "@/shared/ui/commerce/CommercePrimitives";

import { DISCOUNT_TYPE_OPTIONS } from "../../constants/knowledgeForms";
import type { DiscountRuleFormPayload, DiscountType } from "../../domain/knowledge.types";
import {
  KnowledgeRadioGroup,
  KnowledgeSectionCard,
  KnowledgeSwitchRow,
  KnowledgeTagListInput,
  useFloatingFormSubmit,
  type FloatingFormProps,
} from "../KnowledgeFormControls";

export function DiscountRuleForm({
  tenantId,
  onSubmit,
  submitRef,
  onValidChange,
}: FloatingFormProps<DiscountRuleFormPayload>) {
  const [ruleCode, setRuleCode] = useState("");
  const [name, setName] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [minMonths, setMinMonths] = useState("1");
  const [minStudents, setMinStudents] = useState("1");
  const [promoCode, setPromoCode] = useState("");
  const [stackable, setStackable] = useState(false);
  const [priority, setPriority] = useState("10");
  const [applicablePlanIds, setApplicablePlanIds] = useState<string[]>([]);
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [description, setDescription] = useState("");
  const [branchIdStrings, setBranchIdStrings] = useState<string[]>([]);

  const parsedValue = Number(discountValue);
  const parsedMonths = Number(minMonths);
  const parsedStudents = Number(minStudents);
  const parsedPriority = Number(priority);
  const validValue =
    Number.isFinite(parsedValue) &&
    parsedValue > 0 &&
    (discountType !== "PERCENTAGE" || parsedValue <= 100);

  const handleSave = () => {
    onSubmit({
      tenant_id: tenantId,
      rule_code: ruleCode.trim(),
      name: name.trim(),
      discount_type: discountType,
      discount_value: parsedValue,
      min_months: Math.max(1, Number.isInteger(parsedMonths) ? parsedMonths : 1),
      min_students: Math.max(1, Number.isInteger(parsedStudents) ? parsedStudents : 1),
      promo_code: promoCode.trim() || undefined,
      stackable,
      priority: Math.max(0, Number.isInteger(parsedPriority) ? parsedPriority : 10),
      applicable_plan_ids: applicablePlanIds,
      valid_from: validFrom.trim() || undefined,
      valid_to: validTo.trim() || undefined,
      description: description.trim() || undefined,
      branch_ids: branchIdStrings
        .map((s) => Number(s))
        .filter((n) => Number.isInteger(n) && n > 0),
    });
  };

  const isValid = Boolean(ruleCode.trim() && name.trim() && validValue);
  useFloatingFormSubmit(submitRef, handleSave, isValid, onValidChange);

  return (
    <View style={styles.form}>
      <KnowledgeSectionCard
        title="Thông tin quy tắc ưu đãi"
      >
        <FormField
          label="Mã ưu đãi *"
          placeholder="VD: LONG_6M"
          value={ruleCode}
          onChangeText={setRuleCode}
          autoCapitalize="characters"
        />
        <FormField
          label="Tên chương trình ưu đãi *"
          placeholder="VD: Ưu đãi đóng học phí 6 tháng"
          value={name}
          onChangeText={setName}
        />
        <KnowledgeRadioGroup
          label="Loại giảm giá *"
          options={DISCOUNT_TYPE_OPTIONS}
          value={discountType}
          onChange={setDiscountType}
        />
        <FormField
          label={discountType === "PERCENTAGE" ? "Giá trị giảm (%) *" : "Số tiền giảm (VNĐ) *"}
          placeholder={discountType === "PERCENTAGE" ? "VD: 10" : "VD: 200000"}
          value={discountValue}
          onChangeText={setDiscountValue}
          keyboardType="decimal-pad"
        />
      </KnowledgeSectionCard>

      <KnowledgeSectionCard title="Điều kiện áp dụng & Cộng dồn">
        <View style={styles.row}>
          <View style={styles.half}>
            <FormField
              label="Số tháng tối thiểu *"
              value={minMonths}
              onChangeText={setMinMonths}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.half}>
            <FormField
              label="Số học viên tối thiểu *"
              value={minStudents}
              onChangeText={setMinStudents}
              keyboardType="number-pad"
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.half}>
            <FormField
              label="Mã nhập khuyến mãi (nếu có)"
              placeholder="VD: TKD2026"
              value={promoCode}
              onChangeText={setPromoCode}
              autoCapitalize="characters"
            />
          </View>
          <View style={styles.half}>
            <FormField
              label="Thứ tự ưu tiên"
              value={priority}
              onChangeText={setPriority}
              keyboardType="number-pad"
            />
          </View>
        </View>
        <KnowledgeSwitchRow
          label="Cho phép cộng dồn ưu đãi"
          helper="Bật nếu ưu đãi này được áp dụng cùng lúc với ưu đãi khác"
          value={stackable}
          onValueChange={setStackable}
        />
        <View style={styles.row}>
          <View style={styles.half}>
            <FormField
              label="Từ ngày (YYYY-MM-DD)"
              placeholder="2026-01-01"
              value={validFrom}
              onChangeText={setValidFrom}
            />
          </View>
          <View style={styles.half}>
            <FormField
              label="Đến ngày (YYYY-MM-DD)"
              placeholder="2026-12-31"
              value={validTo}
              onChangeText={setValidTo}
            />
          </View>
        </View>
        <KnowledgeTagListInput
          label="Các gói học áp dụng (tùy chọn)"
          placeholder="Nhập mã gói học phí rồi nhấn Thêm"
          items={applicablePlanIds}
          onChange={setApplicablePlanIds}
        />
        <KnowledgeTagListInput
          label="Cơ sở áp dụng (tùy chọn)"
          placeholder="Nhập mã cơ sở (VD: 1)"
          items={branchIdStrings}
          onChange={setBranchIdStrings}
        />
        <FormField
          label="Mô tả điều kiện ưu đãi"
          placeholder="Ghi chú thêm cho tư vấn viên & chatbot..."
          value={description}
          onChangeText={setDescription}
          multiline
          style={styles.multiline}
        />
      </KnowledgeSectionCard>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  multiline: { minHeight: 88, textAlignVertical: "top", paddingTop: 12 },
  row: { flexDirection: "row", gap: 10 },
  half: { flex: 1 },
});
