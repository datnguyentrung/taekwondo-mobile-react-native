import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { FormField } from "@/shared/ui/commerce/CommercePrimitives";

import { ENROLLMENT_CHANNEL_OPTIONS } from "../../constants/knowledgeForms";
import type { EnrollmentChannel, EnrollmentStepFormPayload } from "../../domain/knowledge.types";
import {
  KnowledgeRadioGroup,
  KnowledgeSectionCard,
  KnowledgeTagListInput,
  useFloatingFormSubmit,
  type FloatingFormProps,
} from "../KnowledgeFormControls";

export function EnrollmentStepForm({
  tenantId,
  onSubmit,
  submitRef,
  onValidChange,
}: FloatingFormProps<EnrollmentStepFormPayload>) {
  const [stepCode, setStepCode] = useState("");
  const [stepOrder, setStepOrder] = useState("1");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requiredDocuments, setRequiredDocuments] = useState<string[]>([]);
  const [channel, setChannel] = useState<EnrollmentChannel>("HYBRID");
  const [trainingPlanIds, setTrainingPlanIds] = useState<string[]>([]);

  const parsedOrder = Number(stepOrder);
  const validOrder = Number.isInteger(parsedOrder) && parsedOrder >= 1;

  const handleSave = () => {
    onSubmit({
      tenant_id: tenantId,
      step_code: stepCode.trim(),
      step_order: parsedOrder,
      title: title.trim(),
      description: description.trim(),
      required_documents: requiredDocuments,
      channel,
      training_plan_ids: trainingPlanIds,
    });
  };

  const isValid = Boolean(stepCode.trim() && title.trim() && description.trim() && validOrder);
  useFloatingFormSubmit(submitRef, handleSave, isValid, onValidChange);

  return (
    <View style={styles.form}>
      <KnowledgeSectionCard
        title="Chi tiết bước đăng ký"
      >
        <View style={styles.row}>
          <View style={styles.codeCol}>
            <FormField
              label="Mã bước *"
              placeholder="VD: step-1-form"
              value={stepCode}
              onChangeText={setStepCode}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.orderCol}>
            <FormField
              label="Thứ tự *"
              value={stepOrder}
              onChangeText={setStepOrder}
              keyboardType="number-pad"
            />
          </View>
        </View>
        <FormField
          label="Tên bước *"
          placeholder="VD: Đăng ký thông tin & chọn lịch tập"
          value={title}
          onChangeText={setTitle}
        />
        <FormField
          label="Hướng dẫn chi tiết *"
          placeholder="Mô tả thao tác phụ huynh/học viên cần làm..."
          value={description}
          onChangeText={setDescription}
          multiline
          style={styles.multiline}
        />
        <KnowledgeRadioGroup
          label="Kênh thực hiện *"
          options={ENROLLMENT_CHANNEL_OPTIONS}
          value={channel}
          onChange={setChannel}
        />
        <KnowledgeTagListInput
          label="Hồ sơ cần chuẩn bị"
          placeholder="VD: 1 ảnh 3x4, bản sao giấy khai sinh"
          items={requiredDocuments}
          onChange={setRequiredDocuments}
        />
        <KnowledgeTagListInput
          label="Các gói đào tạo áp dụng (tùy chọn)"
          placeholder="Nhập mã gói đào tạo rồi nhấn Thêm"
          items={trainingPlanIds}
          onChange={setTrainingPlanIds}
        />
      </KnowledgeSectionCard>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  multiline: { minHeight: 88, textAlignVertical: "top", paddingTop: 12 },
  row: { flexDirection: "row", gap: 10 },
  codeCol: { flex: 2 },
  orderCol: { flex: 1 },
});
