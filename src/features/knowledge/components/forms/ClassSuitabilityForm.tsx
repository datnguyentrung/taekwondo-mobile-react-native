import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { FormField } from "@/shared/ui/commerce/CommercePrimitives";

import { TARGET_GOAL_OPTIONS } from "../../constants/knowledgeForms";
import type { ClassSuitabilityFormPayload, TargetGoal } from "../../domain/knowledge.types";
import {
  KnowledgeChipMultiSelect,
  KnowledgeSectionCard,
  KnowledgeTagListInput,
  useFloatingFormSubmit,
  type FloatingFormProps,
} from "../KnowledgeFormControls";

export function ClassSuitabilityForm({
  tenantId,
  onSubmit,
  submitRef,
  onValidChange,
}: FloatingFormProps<ClassSuitabilityFormPayload>) {
  const [profileCode, setProfileCode] = useState("");
  const [minAge, setMinAge] = useState("6");
  const [maxAge, setMaxAge] = useState("12");
  const [targetGoals, setTargetGoals] = useState<TargetGoal[]>(["FITNESS"]);
  const [curriculumSummary, setCurriculumSummary] = useState("");
  const [curriculumModules, setCurriculumModules] = useState<string[]>([]);
  const [prerequisites, setPrerequisites] = useState("");
  const [courseId, setCourseId] = useState("");
  const [trainingPlanIds, setTrainingPlanIds] = useState<string[]>([]);

  const parsedMin = Number(minAge);
  const parsedMax = Number(maxAge);
  const validAges =
    Number.isInteger(parsedMin) &&
    Number.isInteger(parsedMax) &&
    parsedMin >= 0 &&
    parsedMax <= 100 &&
    parsedMin <= parsedMax;

  const handleSave = () => {
    onSubmit({
      tenant_id: tenantId,
      profile_code: profileCode.trim(),
      min_age: parsedMin,
      max_age: parsedMax,
      target_goals: targetGoals,
      curriculum_summary: curriculumSummary.trim() || undefined,
      curriculum_modules: curriculumModules,
      prerequisites: prerequisites.trim() || undefined,
      course_id: courseId.trim() || undefined,
      training_plan_ids: trainingPlanIds,
    });
  };

  const isValid = Boolean(profileCode.trim() && validAges && targetGoals.length > 0);
  useFloatingFormSubmit(submitRef, handleSave, isValid, onValidChange);

  return (
    <View style={styles.form}>
      <KnowledgeSectionCard
        title="Tiêu chí độ tuổi & Mục tiêu"
      >
        <FormField
          label="Mã hồ sơ lớp *"
          placeholder="VD: kids-6-12"
          value={profileCode}
          onChangeText={setProfileCode}
          autoCapitalize="none"
        />
        <View style={styles.row}>
          <View style={styles.half}>
            <FormField
              label="Tuổi tối thiểu *"
              value={minAge}
              onChangeText={setMinAge}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.half}>
            <FormField
              label="Tuổi tối đa *"
              value={maxAge}
              onChangeText={setMaxAge}
              keyboardType="number-pad"
            />
          </View>
        </View>
        <KnowledgeChipMultiSelect
          label="Mục tiêu tập luyện phù hợp *"
          options={TARGET_GOAL_OPTIONS}
          values={targetGoals}
          onChange={setTargetGoals}
        />
      </KnowledgeSectionCard>

      <KnowledgeSectionCard
        title="Nội dung giáo trình & Lớp áp dụng"
      >
        <FormField
          label="Tóm tắt giáo trình"
          placeholder="Tổng quan nội dung học theo từng giai đoạn..."
          value={curriculumSummary}
          onChangeText={setCurriculumSummary}
          multiline
          style={styles.multiline}
        />
        <KnowledgeTagListInput
          label="Các học phần / chủ đề chi tiết"
          placeholder="VD: Tuần 1-4: Tấn pháp & Đòn đá cơ bản"
          items={curriculumModules}
          onChange={setCurriculumModules}
        />
        <FormField
          label="Yêu cầu đầu vào bổ sung"
          placeholder="VD: Đã có đai vàng trở lên..."
          value={prerequisites}
          onChangeText={setPrerequisites}
        />
        <FormField
          label="Mã lớp học áp dụng"
          placeholder="Nhập mã lớp học"
          value={courseId}
          onChangeText={setCourseId}
          autoCapitalize="none"
        />
        <KnowledgeTagListInput
          label="Các gói đào tạo áp dụng"
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
  half: { flex: 1 },
});
