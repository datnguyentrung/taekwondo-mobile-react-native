import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { FormField } from "@/shared/ui/commerce/CommercePrimitives";

import type { BeltRankFormPayload } from "../../domain/knowledge.types";
import {
  KnowledgeSectionCard,
  KnowledgeTagListInput,
  useFloatingFormSubmit,
  type FloatingFormProps,
} from "../KnowledgeFormControls";

export function BeltRankForm({
  tenantId,
  onSubmit,
  submitRef,
  onValidChange,
}: FloatingFormProps<BeltRankFormPayload>) {
  const [name, setName] = useState("");
  const [rankOrder, setRankOrder] = useState("1");
  const [color, setColor] = useState("");
  const [meaning, setMeaning] = useState("");
  const [minTrainingMonths, setMinTrainingMonths] = useState("3");
  const [examRequirements, setExamRequirements] = useState<string[]>([]);
  const [requiredConcepts, setRequiredConcepts] = useState<string[]>([]);
  const [requiredPoomsae, setRequiredPoomsae] = useState<string[]>([]);
  const [nextRankName, setNextRankName] = useState("");

  const parsedOrder = Number(rankOrder);
  const parsedMonths = Number(minTrainingMonths);
  const validOrder = Number.isInteger(parsedOrder) && parsedOrder >= 1;

  const handleSave = () => {
    onSubmit({
      tenant_id: tenantId,
      name: name.trim(),
      rank_order: parsedOrder,
      color: color.trim(),
      meaning: meaning.trim() || undefined,
      min_training_months:
        Number.isInteger(parsedMonths) && parsedMonths >= 0 ? parsedMonths : undefined,
      exam_requirements: examRequirements,
      required_concepts: requiredConcepts,
      required_poomsae: requiredPoomsae,
      next_rank_name: nextRankName.trim() || undefined,
    });
  };

  const isValid = Boolean(name.trim() && color.trim() && validOrder);
  useFloatingFormSubmit(submitRef, handleSave, isValid, onValidChange);

  return (
    <View style={styles.form}>
      <KnowledgeSectionCard title="Thông tin cấp đai">
        <FormField
          label="Tên cấp đai *"
          placeholder="VD: Đai Vàng (Cấp 8)"
          value={name}
          onChangeText={setName}
        />
        <View style={styles.row}>
          <View style={styles.half}>
            <FormField
              label="Thứ tự cấp đai *"
              placeholder="1"
              value={rankOrder}
              onChangeText={setRankOrder}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.half}>
            <FormField
              label="Màu đai *"
              placeholder="VD: Vàng"
              value={color}
              onChangeText={setColor}
            />
          </View>
        </View>
        <FormField
          label="Ý nghĩa màu đai"
          placeholder="Tượng trưng cho hạt giống bắt đầu nảy mầm..."
          value={meaning}
          onChangeText={setMeaning}
          multiline
          style={styles.multiline}
        />
        <View style={styles.row}>
          <View style={styles.half}>
            <FormField
              label="Số tháng tập tối thiểu"
              value={minTrainingMonths}
              onChangeText={setMinTrainingMonths}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.half}>
            <FormField
              label="Cấp đai kế tiếp"
              placeholder="VD: Đai Xanh Lá"
              value={nextRankName}
              onChangeText={setNextRankName}
            />
          </View>
        </View>
      </KnowledgeSectionCard>

      <KnowledgeSectionCard title="Yêu cầu thi lên đai">
        <KnowledgeTagListInput
          label="Nội dung kiểm tra"
          placeholder="VD: Đối kháng 1 hiệp, công phá ván"
          items={examRequirements}
          onChange={setExamRequirements}
        />
        <KnowledgeTagListInput
          label="Kỹ thuật bắt buộc"
          placeholder="VD: Ap Chagi, Dollyo Chagi"
          items={requiredConcepts}
          onChange={setRequiredConcepts}
        />
        <KnowledgeTagListInput
          label="Bài quyền bắt buộc"
          placeholder="VD: Taegeuk 1"
          items={requiredPoomsae}
          onChange={setRequiredPoomsae}
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
