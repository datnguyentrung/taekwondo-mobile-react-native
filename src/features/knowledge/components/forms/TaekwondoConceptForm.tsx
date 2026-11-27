import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { FormField } from "@/shared/ui/commerce/CommercePrimitives";

import {
  CONCEPT_CATEGORY_OPTIONS,
  TARGET_AUDIENCE_OPTIONS,
} from "../../constants/knowledgeForms";
import type {
  ConceptCategory,
  TaekwondoConceptFormPayload,
  TargetAudience,
} from "../../domain/knowledge.types";
import {
  KnowledgeDropdownField,
  KnowledgeRadioGroup,
  KnowledgeSectionCard,
  useFloatingFormSubmit,
  type FloatingFormProps,
} from "../KnowledgeFormControls";

export function TaekwondoConceptForm({
  tenantId,
  onSubmit,
  submitRef,
  onValidChange,
}: FloatingFormProps<TaekwondoConceptFormPayload>) {
  const [name, setName] = useState("");
  const [koreanName, setKoreanName] = useState("");
  const [category, setCategory] = useState<ConceptCategory>("TECHNIQUE");
  const [targetAudience, setTargetAudience] = useState<TargetAudience>("ALL");
  const [description, setDescription] = useState("");

  const handleSave = () => {
    onSubmit({
      tenant_id: tenantId,
      name: name.trim(),
      korean_name: koreanName.trim() || undefined,
      category,
      target_audience: targetAudience,
      description: description.trim(),
    });
  };

  const isValid = Boolean(name.trim() && description.trim());
  useFloatingFormSubmit(submitRef, handleSave, isValid, onValidChange);

  return (
    <View style={styles.form}>
      <KnowledgeSectionCard title="Kiến thức chuyên môn & Lợi ích">
        <KnowledgeDropdownField
          label="Phân loại kiến thức *"
          options={CONCEPT_CATEGORY_OPTIONS}
          value={category}
          onChange={setCategory}
        />
        <FormField
          label="Tên kỹ thuật / luật / lợi ích *"
          placeholder="VD: Đá tống trước hoặc Rèn kỷ luật cho trẻ"
          value={name}
          onChangeText={setName}
        />
        <FormField
          label="Tên tiếng Hàn (nếu có)"
          placeholder="VD: Ap Chagi (앞차기)"
          value={koreanName}
          onChangeText={setKoreanName}
        />
        <KnowledgeRadioGroup
          label="Đối tượng áp dụng"
          options={TARGET_AUDIENCE_OPTIONS}
          value={targetAudience}
          onChange={setTargetAudience}
        />
        <FormField
          label="Nội dung giải thích chi tiết *"
          placeholder="Mô tả kỹ thuật thực hiện, ý nghĩa hoặc lợi ích..."
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
  multiline: { minHeight: 96, textAlignVertical: "top", paddingTop: 12 },
});
