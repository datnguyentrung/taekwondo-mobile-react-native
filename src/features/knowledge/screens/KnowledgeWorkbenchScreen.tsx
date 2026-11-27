import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, TextInput, View } from "react-native";

import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import { ThemedText } from "@/shared/ui/ThemedText";
import { useToast } from "@/shared/ui/Toast";
import { Colors, radii } from "@/theme";

import {
  knowledgeApi,
  type KnowledgeItemRecord,
  type KnowledgeItemStatus,
} from "../api/knowledgeApi";

const STATUS_TABS: { label: string; value: KnowledgeItemStatus }[] = [
  { label: "Bản nháp", value: "DRAFT" },
  { label: "Chờ duyệt", value: "PENDING_REVIEW" },
  { label: "Đã công bố", value: "PUBLISHED" },
  { label: "Cách ly", value: "QUARANTINED" },
];

const SCOPES = [
  { key: "center_overview", label: "Giới thiệu" },
  { key: "admission_onboarding", label: "Tuyển sinh" },
  { key: "training_knowledge", label: "Chuyên môn" },
  { key: "belt_and_exam", label: "Cấp đai & Thi" },
  { key: "tuition_and_discount", label: "Học phí & Ưu đãi" },
];

export default function KnowledgeWorkbenchScreen() {
  const toast = useToast();
  const [activeStatus, setActiveStatus] = useState<KnowledgeItemStatus>("DRAFT");
  const [items, setItems] = useState<KnowledgeItemRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const [composeMode, setComposeMode] = useState<"RICH_TEXT" | "FAQ">("RICH_TEXT");
  const [scopeKey, setScopeKey] = useState("center_overview");
  const [titleOrQuestion, setTitleOrQuestion] = useState("");
  const [contentOrAnswer, setContentOrAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadItems = useCallback(async (status: KnowledgeItemStatus) => {
    setLoading(true);
    try {
      const data = await knowledgeApi.listItems(status);
      setItems(data);
    } catch {
      toast.show({ message: "Không tải được danh sách tri thức từ máy chủ.", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadItems(activeStatus);
  }, [activeStatus, loadItems]);

  const handleComposeSubmit = async () => {
    if (!titleOrQuestion.trim() || !contentOrAnswer.trim() || submitting) return;
    setSubmitting(true);
    try {
      const created =
        composeMode === "RICH_TEXT"
          ? await knowledgeApi.submitRichText({
              scope_key: scopeKey,
              title: titleOrQuestion.trim(),
              content: contentOrAnswer.trim(),
            })
          : await knowledgeApi.submitFaq({
              scope_key: scopeKey,
              question: titleOrQuestion.trim(),
              answer: contentOrAnswer.trim(),
            });
      toast.show({
        message: `Đã tạo (${created.status}) — ${created.accepted_facts.length} fact hợp lệ, ${created.rejected_facts.length} fact bị loại.`,
        variant: created.status === "QUARANTINED" || created.status === "REJECTED" ? "error" : "success",
      });
      setTitleOrQuestion("");
      setContentOrAnswer("");
      await loadItems(activeStatus);
    } catch (err) {
      toast.show({
        message: err instanceof Error ? err.message : "Gửi tri thức thất bại.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadDocument = async () => {
    if (submitting) return;
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".docx,.md,.markdown,.txt";
      input.onchange = async () => {
        const picked = input.files?.[0];
        if (!picked) return;
        setSubmitting(true);
        try {
          const formData = new FormData();
          formData.append("scope_key", scopeKey);
          formData.append("title", titleOrQuestion.trim() || picked.name);
          formData.append("file", picked);
          const { javaApi } = await import("@/infrastructure/http/httpClient");
          const res = await javaApi.post<KnowledgeItemRecord>("/knowledge/documents", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          toast.show({
            message: `Đã tải "${picked.name}" (${res.data.status}) — ${res.data.accepted_facts.length} fact hợp lệ.`,
            variant: "success",
          });
          await loadItems(activeStatus);
        } catch (err) {
          toast.show({
            message: err instanceof Error ? err.message : "Tải tài liệu thất bại.",
            variant: "error",
          });
        } finally {
          setSubmitting(false);
        }
      };
      input.click();
      return;
    }
    try {
      const docPicker = await import("expo-document-picker");
      const picked = await docPicker.getDocumentAsync({
        type: [
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "text/markdown",
          "text/plain",
        ],
      });
      if (picked.canceled || !picked.assets?.[0]) return;
      const asset = picked.assets[0];
      setSubmitting(true);
      const created = await knowledgeApi.uploadDocument(
        scopeKey,
        titleOrQuestion.trim() || asset.name,
        {
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || "application/octet-stream",
        },
      );
      toast.show({
        message: `Đã tải "${asset.name}" (${created.status}) — ${created.accepted_facts.length} fact hợp lệ.`,
        variant: "success",
      });
      await loadItems(activeStatus);
    } catch (err) {
      toast.show({
        message:
          err instanceof Error
            ? err.message
            : "Cần cài expo-document-picker để chọn file Word/Markdown trên thiết bị.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const runAction = async (fn: () => Promise<KnowledgeItemRecord>, successMsg: string) => {
    try {
      await fn();
      toast.show({ message: successMsg, variant: "success" });
      await loadItems(activeStatus);
    } catch (err) {
      toast.show({
        message: err instanceof Error ? err.message : "Thao tác không hợp lệ.",
        variant: "error",
      });
    }
  };

  return (
    <StackScreenLayout title="Quản trị & Duyệt Tri thức" contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.rowGap}>
          {(["RICH_TEXT", "FAQ"] as const).map((mode) => (
            <Pressable
              key={mode}
              onPress={() => setComposeMode(mode)}
              style={[styles.chip, composeMode === mode && styles.chipActive]}
            >
              <ThemedText type="bodySmall" style={composeMode === mode ? styles.chipActiveText : undefined}>
                {mode === "RICH_TEXT" ? "Soạn tự do" : "Thêm FAQ"}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <View style={styles.rowWrap}>
          {SCOPES.map((s) => (
            <Pressable
              key={s.key}
              onPress={() => setScopeKey(s.key)}
              style={[styles.chip, scopeKey === s.key && styles.chipActive]}
            >
              <ThemedText type="caption" style={scopeKey === s.key ? styles.chipActiveText : undefined}>
                {s.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <TextInput
          value={titleOrQuestion}
          onChangeText={setTitleOrQuestion}
          placeholder={composeMode === "RICH_TEXT" ? "Tiêu đề nội dung" : "Câu hỏi thường gặp"}
          style={styles.input}
        />
        <TextInput
          value={contentOrAnswer}
          onChangeText={setContentOrAnswer}
          placeholder={composeMode === "RICH_TEXT" ? "Nội dung tri thức..." : "Câu trả lời..."}
          multiline
          style={[styles.input, styles.textArea]}
        />
        <Pressable
          onPress={() => void handleComposeSubmit()}
          disabled={submitting}
          style={styles.primaryBtn}
        >
          <ThemedText type="bodySmall" style={styles.primaryBtnText}>
            {submitting ? "Đang kiểm tra & lưu..." : "Gửi kiểm tra quản trị"}
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => void handleUploadDocument()}
          disabled={submitting}
          style={styles.actionBtn}
        >
          <ThemedText type="bodySmall">Tải lên tài liệu (.docx, .md)</ThemedText>
        </Pressable>
      </View>

      <View style={styles.rowWrap}>
        {STATUS_TABS.map((tab) => (
          <Pressable
            key={tab.value}
            onPress={() => setActiveStatus(tab.value)}
            style={[styles.chip, activeStatus === tab.value && styles.chipActive]}
          >
            <ThemedText type="caption" style={activeStatus === tab.value ? styles.chipActiveText : undefined}>
              {tab.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.light.primary} />
      ) : items.length === 0 ? (
        <ThemedText type="bodySmall" style={styles.muted}>
          Chưa có mục tri thức nào ở trạng thái này.
        </ThemedText>
      ) : (
        items.map((item) => (
          <View key={item.item_id} style={styles.card}>
            <ThemedText type="subtitle">{item.title}</ThemedText>
            <ThemedText type="caption" style={styles.muted}>
              {item.source_type} • {item.scope_key} • v{item.version} • {item.status}
            </ThemedText>
            <ThemedText type="bodySmall">
              Nhận: {item.accepted_facts.length} • Loại: {item.rejected_facts.length} • Mâu thuẫn: {item.conflicts.length}
            </ThemedText>
            {item.rejected_facts.map((r, idx) => (
              <ThemedText key={idx} type="caption" style={styles.errorText}>
                • Loại ({r.code}): {r.reason}
              </ThemedText>
            ))}
            <View style={styles.rowGap}>
              {item.status === "DRAFT" && (
                <Pressable
                  onPress={() => void runAction(() => knowledgeApi.submitForReview(item.item_id), "Đã gửi duyệt")}
                  style={styles.actionBtn}
                >
                  <ThemedText type="caption">Gửi duyệt</ThemedText>
                </Pressable>
              )}
              {item.status === "PENDING_REVIEW" && (
                <>
                  <Pressable
                    onPress={() => void runAction(() => knowledgeApi.approveItem(item.item_id), "Đã duyệt")}
                    style={styles.actionBtn}
                  >
                    <ThemedText type="caption">Duyệt</ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() => void runAction(() => knowledgeApi.rejectItem(item.item_id, "Không đạt yêu cầu"), "Đã từ chối")}
                    style={styles.actionBtn}
                  >
                    <ThemedText type="caption">Từ chối</ThemedText>
                  </Pressable>
                </>
              )}
              {item.status === "APPROVED" && (
                <Pressable
                  onPress={() => void runAction(() => knowledgeApi.publishItem(item.item_id), "Đã công bố")}
                  style={styles.actionBtn}
                >
                  <ThemedText type="caption">Công bố</ThemedText>
                </Pressable>
              )}
              {item.status === "PUBLISHED" && (
                <Pressable
                  onPress={() => void runAction(() => knowledgeApi.archiveItem(item.item_id), "Đã lưu trữ")}
                  style={styles.actionBtn}
                >
                  <ThemedText type="caption">Lưu trữ</ThemedText>
                </Pressable>
              )}
            </View>
          </View>
        ))
      )}
    </StackScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: radii.md,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.light.backgroundSelected,
  },
  rowGap: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  rowWrap: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.sm,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.backgroundSelected,
  },
  chipActive: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  chipActiveText: { color: Colors.light.surface },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.backgroundSelected,
    borderRadius: radii.sm,
    padding: 10,
    backgroundColor: Colors.light.surface,
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  primaryBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: radii.sm,
    paddingVertical: 10,
    alignItems: "center",
  },
  primaryBtnText: { color: Colors.light.surface },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: Colors.light.backgroundSelected,
  },
  muted: { color: Colors.light.textSecondary },
  errorText: { color: Colors.light.primary },
});
