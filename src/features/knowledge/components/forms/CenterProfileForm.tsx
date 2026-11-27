import { useEffect, useState, type RefObject } from "react";
import { StyleSheet, View } from "react-native";

import { FormField } from "@/shared/ui/commerce/CommercePrimitives";

import type { CenterProfileFormPayload } from "../../domain/knowledge.types";
import {
  KnowledgeSectionCard,
  KnowledgeTagListInput,
} from "../KnowledgeFormControls";

type Props = {
  tenantId: string;
  onSubmit: (payload: CenterProfileFormPayload) => void;
  submitRef?: RefObject<(() => void) | null>;
  onValidChange?: (valid: boolean) => void;
};

export function CenterProfileForm({ tenantId, onSubmit, submitRef, onValidChange }: Props) {
  const [title, setTitle] = useState("");
  const [history, setHistory] = useState("");
  const [vision, setVision] = useState("");
  const [mission, setMission] = useState("");
  const [email, setEmail] = useState("");
  const [zaloUrl, setZaloUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [supportHours, setSupportHours] = useState("");
  const [branchIdStrings, setBranchIdStrings] = useState<string[]>([]);

  const handleSave = () => {
    onSubmit({
      tenant_id: tenantId,
      title: title.trim(),
      history: history.trim() || undefined,
      vision: vision.trim() || undefined,
      mission: mission.trim() || undefined,
      email: email.trim() || undefined,
      zalo_url: zaloUrl.trim() || undefined,
      facebook_url: facebookUrl.trim() || undefined,
      website_url: websiteUrl.trim() || undefined,
      support_hours: supportHours.trim() || undefined,
      branch_ids: branchIdStrings
        .map((s) => Number(s))
        .filter((n) => Number.isInteger(n) && n > 0),
    });
  };

  const isValid = Boolean(title.trim());

  if (submitRef) {
    submitRef.current = handleSave;
  }

  useEffect(() => {
    onValidChange?.(isValid);
  }, [isValid, onValidChange]);

  return (
    <View style={styles.form}>
      <KnowledgeSectionCard title="Thông tin giới thiệu">
        <FormField
          label="Tên trung tâm hiển thị *"
          placeholder="VD: Taekwondo Văn Quán"
          value={title}
          onChangeText={setTitle}
        />
        <FormField
          label="Lịch sử hình thành"
          placeholder="Mô tả lịch sử thành lập võ đường..."
          value={history}
          onChangeText={setHistory}
          multiline
          style={styles.multiline}
        />
        <FormField
          label="Tầm nhìn"
          placeholder="Tầm nhìn phát triển của trung tâm..."
          value={vision}
          onChangeText={setVision}
          multiline
          style={styles.multiline}
        />
        <FormField
          label="Sứ mệnh"
          placeholder="Sứ mệnh đào tạo học viên..."
          value={mission}
          onChangeText={setMission}
          multiline
          style={styles.multiline}
        />
      </KnowledgeSectionCard>

      <KnowledgeSectionCard title="Kênh liên hệ mở rộng">
        <FormField
          label="Email liên hệ"
          placeholder="contact@taekwondovanquan.vn"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <FormField
          label="Zalo URL"
          placeholder="https://zalo.me/..."
          value={zaloUrl}
          onChangeText={setZaloUrl}
          autoCapitalize="none"
        />
        <FormField
          label="Facebook Fanpage URL"
          placeholder="https://facebook.com/..."
          value={facebookUrl}
          onChangeText={setFacebookUrl}
          autoCapitalize="none"
        />
        <FormField
          label="Website URL"
          placeholder="https://..."
          value={websiteUrl}
          onChangeText={setWebsiteUrl}
          autoCapitalize="none"
        />
        <FormField
          label="Khung giờ trực tư vấn"
          placeholder="VD: 08:00 - 21:00 hằng ngày"
          value={supportHours}
          onChangeText={setSupportHours}
        />
        <KnowledgeTagListInput
          label="Cơ sở áp dụng"
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
  multiline: { minHeight: 88, textAlignVertical: "top", paddingTop: 12 },
});
