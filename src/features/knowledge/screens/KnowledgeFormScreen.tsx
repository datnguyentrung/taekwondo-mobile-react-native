import { useRef, useState } from "react";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { selectCurrentTenantId, useAuthStore } from "@/features/authentication/store/auth.store";
import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import { AdminInfoBanner, AdminIntro } from "@/shared/ui/admin/AdministrationPrimitives";
import { FloatingActionBar } from "@/shared/ui/FloatingActionBar";
import { useToast } from "@/shared/ui/Toast";

import {
  BeltRankForm,
  CenterProfileForm,
  ClassSuitabilityForm,
  DiscountRuleForm,
  EnrollmentStepForm,
  FacilityItemForm,
  PolicyRuleForm,
  PoomsaeForm,
  TaekwondoConceptForm,
} from "../components/forms";
import { knowledgeApi } from "../api/knowledgeApi";
import { KNOWLEDGE_FORM_BY_ID } from "../constants/knowledgeForms";
import type { KnowledgeFormType } from "../domain/knowledge.types";
import { markKnowledgeFormCompleted } from "../store/knowledgeProgressStore";

type Props = {
  formType: string;
};

export default function KnowledgeFormScreen({ formType }: Props) {
  const tenantId = useAuthStore(selectCurrentTenantId);
  const router = useRouter();
  const toast = useToast();
  const meta = KNOWLEDGE_FORM_BY_ID[formType as KnowledgeFormType];
  const submitRef = useRef<(() => void) | null>(null);
  const [canSubmit, setCanSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!meta) {
    return (
      <StackScreenLayout
        title="Biểu mẫu Tri thức"
        contentContainerStyle={styles.screenContent}
      >
        <AdminInfoBanner tone="warning">
          Không tìm thấy biểu mẫu phù hợp. Vui lòng quay lại và chọn lại loại form.
        </AdminInfoBanner>
      </StackScreenLayout>
    );
  }

  const handleSubmitted = async (payload: unknown) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const record = await knowledgeApi.submitForm(
        meta.id,
        (payload && typeof payload === "object" ? payload : {}) as Record<string, unknown>,
      );
      if (record.status === "REJECTED" || record.status === "QUARANTINED") {
        const firstMsg =
          record.validator_outcomes[0]?.message ??
          "Nội dung không đạt kiểm tra quản trị tri thức.";
        toast.show({ message: firstMsg, variant: "error" });
        return;
      }
      markKnowledgeFormCompleted(meta.id);
      toast.show({
        message: `Đã gửi bản nháp "${meta.title}" (${record.status}).`,
        variant: "success",
      });
      router.back();
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : `Không thể gửi "${meta.title}" lên máy chủ.`;
      toast.show({ message, variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formProps = {
    tenantId: tenantId ?? "",
    onSubmit: handleSubmitted,
    submitRef,
    onValidChange: setCanSubmit,
  };

  return (
    <StackScreenLayout
      title={meta.title}
      contentContainerStyle={styles.screenContent}
      floatingContent={
        <FloatingActionBar
          actions={[
            {
              label: isSubmitting ? "Đang gửi..." : `Lưu ${meta.title}`,
              variant: "primary",
              disabled: !canSubmit || isSubmitting,
              onPress: () => submitRef.current?.(),
            },
          ]}
        />
      }
    >
      <View style={styles.container}>
        <AdminIntro>{meta.description}</AdminIntro>

        {meta.id === "center-profile" ? <CenterProfileForm {...formProps} /> : null}
        {meta.id === "facility-item" ? <FacilityItemForm {...formProps} /> : null}
        {meta.id === "policy-rule" ? <PolicyRuleForm {...formProps} /> : null}
        {meta.id === "class-suitability" ? <ClassSuitabilityForm {...formProps} /> : null}
        {meta.id === "enrollment-step" ? <EnrollmentStepForm {...formProps} /> : null}
        {meta.id === "taekwondo-concept" ? <TaekwondoConceptForm {...formProps} /> : null}
        {meta.id === "poomsae" ? <PoomsaeForm {...formProps} /> : null}
        {meta.id === "belt-rank" ? <BeltRankForm {...formProps} /> : null}
        {meta.id === "discount-rule" ? <DiscountRuleForm {...formProps} /> : null}
      </View>
    </StackScreenLayout>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 104,
  },
  container: {
    gap: 14,
  },
});
