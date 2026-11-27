import { useEffect, useState, type RefObject } from "react";
import { StyleSheet, View } from "react-native";

import { FormField } from "@/shared/ui/commerce/CommercePrimitives";

import { FACILITY_CATEGORY_OPTIONS } from "../../constants/knowledgeForms";
import type { FacilityCategory, FacilityItemFormPayload } from "../../domain/knowledge.types";
import { KnowledgeDropdownField, KnowledgeSectionCard } from "../KnowledgeFormControls";

type Props = {
  tenantId: string;
  onSubmit: (payload: FacilityItemFormPayload) => void;
  submitRef?: RefObject<(() => void) | null>;
  onValidChange?: (valid: boolean) => void;
};

export function FacilityItemForm({ tenantId, onSubmit, submitRef, onValidChange }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<FacilityCategory>("MAT");
  const [quantityNote, setQuantityNote] = useState("");
  const [description, setDescription] = useState("");
  const [branchIdText, setBranchIdText] = useState("");

  const handleSave = () => {
    const parsedBranch = Number(branchIdText.trim());
    onSubmit({
      tenant_id: tenantId,
      name: name.trim(),
      category,
      quantity_note: quantityNote.trim() || undefined,
      description: description.trim(),
      branch_id: Number.isInteger(parsedBranch) && parsedBranch > 0 ? parsedBranch : undefined,
    });
  };

  const isValid = Boolean(name.trim() && description.trim());

  if (submitRef) {
    submitRef.current = handleSave;
  }

  useEffect(() => {
    onValidChange?.(isValid);
  }, [isValid, onValidChange]);

  return (
    <View style={styles.form}>
      <KnowledgeSectionCard
        title="Thông tin cơ sở vật chất"
      >
        <FormField
          label="Tên trang thiết bị / tiện ích *"
          placeholder="VD: Thảm tập EVA 4cm tiêu chuẩn thi đấu"
          value={name}
          onChangeText={setName}
        />
        <KnowledgeDropdownField
          label="Nhóm cơ sở vật chất *"
          options={FACILITY_CATEGORY_OPTIONS}
          value={category}
          onChange={setCategory}
        />
        <FormField
          label="Quy mô / số lượng"
          placeholder="VD: 200m2 sàn thảm, 20 bộ giáp điện tử"
          value={quantityNote}
          onChangeText={setQuantityNote}
        />
        <FormField
          label="Mô tả chi tiết *"
          placeholder="Chất lượng, độ an toàn, tiện ích phục vụ học viên..."
          value={description}
          onChangeText={setDescription}
          multiline
          style={styles.multiline}
        />
        <FormField
          label="Mã cơ sở (tùy chọn)"
          placeholder="VD: 1"
          value={branchIdText}
          onChangeText={setBranchIdText}
          keyboardType="number-pad"
        />
      </KnowledgeSectionCard>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  multiline: { minHeight: 96, textAlignVertical: "top", paddingTop: 12 },
});
