import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { FormField } from "@/shared/ui/commerce/CommercePrimitives";

import type { PoomsaeFormPayload } from "../../domain/knowledge.types";
import {
  KnowledgeSectionCard,
  useFloatingFormSubmit,
  type FloatingFormProps,
} from "../KnowledgeFormControls";

export function PoomsaeForm({
  tenantId,
  onSubmit,
  submitRef,
  onValidChange,
}: FloatingFormProps<PoomsaeFormPayload>) {
  const [name, setName] = useState("");
  const [koreanName, setKoreanName] = useState("");
  const [movementCount, setMovementCount] = useState("");
  const [level, setLevel] = useState("");
  const [description, setDescription] = useState("");

  const handleSave = () => {
    const parsedCount = Number(movementCount.trim());
    onSubmit({
      tenant_id: tenantId,
      name: name.trim(),
      korean_name: koreanName.trim() || undefined,
      movement_count:
        Number.isInteger(parsedCount) && parsedCount >= 1 ? parsedCount : undefined,
      level: level.trim() || undefined,
      description: description.trim(),
    });
  };

  const isValid = Boolean(name.trim() && description.trim());
  useFloatingFormSubmit(submitRef, handleSave, isValid, onValidChange);

  return (
    <View style={styles.form}>
      <KnowledgeSectionCard
        title="Thông tin bài quyền"
      >
        <FormField
          label="Tên bài quyền *"
          placeholder="VD: Thái Cực 1 (Taegeuk Il Jang)"
          value={name}
          onChangeText={setName}
        />
        <FormField
          label="Tên tiếng Hàn"
          placeholder="VD: 태극 1장"
          value={koreanName}
          onChangeText={setKoreanName}
        />
        <View style={styles.row}>
          <View style={styles.half}>
            <FormField
              label="Số động tác"
              placeholder="VD: 18"
              value={movementCount}
              onChangeText={setMovementCount}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.half}>
            <FormField
              label="Cấp độ"
              placeholder="VD: Đai Vàng / Cấp 8"
              value={level}
              onChangeText={setLevel}
            />
          </View>
        </View>
        <FormField
          label="Mô tả bài quyền *"
          placeholder="Ý nghĩa triết lý, kỹ thuật trọng tâm trong bài quyền..."
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
  row: { flexDirection: "row", gap: 10 },
  half: { flex: 1 },
});
