import { javaApi } from "@/infrastructure/http/httpClient";

import type { KnowledgeFormType } from "../domain/knowledge.types";

export type KnowledgeItemStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "PUBLISHED"
  | "REJECTED"
  | "QUARANTINED"
  | "ARCHIVED";

export type KnowledgeSourceType = "FORM" | "RICH_TEXT" | "DOCUMENT" | "FAQ";

export type KnowledgeValidatorOutcome = {
  validator: string;
  severity: "PASS" | "WARN" | "REJECT" | "QUARANTINE";
  code: string;
  message: string;
};

export type KnowledgeItemRecord = {
  item_id: string;
  tenant_id: string;
  source_type: KnowledgeSourceType;
  scope_key: string;
  title: string;
  raw_text: string;
  version: number;
  status: KnowledgeItemStatus;
  author_user_id: string;
  reviewer_user_id?: string | null;
  rejection_reason?: string | null;
  form_type?: string | null;
  validator_outcomes: KnowledgeValidatorOutcome[];
  accepted_facts: { fact_id: string; entity_type: string; statement: string; scope_key: string }[];
  rejected_facts: { fact: { statement: string }; code: string; reason: string }[];
  conflicts: { candidate_statement: string; existing_statement: string; reason: string }[];
  quarantined_segments: string[];
  created_at: string;
  updated_at: string;
};

export type RichTextKnowledgeInput = {
  scope_key: string;
  title: string;
  content: string;
  effective_from?: string;
  effective_to?: string;
};

export type FaqKnowledgeInput = {
  scope_key: string;
  question: string;
  answer: string;
  effective_from?: string;
  effective_to?: string;
};

export const knowledgeApi = {
  async submitForm(
    formType: KnowledgeFormType,
    payload: Record<string, unknown>,
  ): Promise<KnowledgeItemRecord> {
    const response = await javaApi.post<KnowledgeItemRecord>(
      `/knowledge/forms/${formType}`,
      payload,
    );
    return response.data;
  },

  async submitRichText(input: RichTextKnowledgeInput): Promise<KnowledgeItemRecord> {
    const response = await javaApi.post<KnowledgeItemRecord>("/knowledge/rich-text", input);
    return response.data;
  },

  async uploadDocument(
    scopeKey: string,
    title: string,
    file: { uri: string; name: string; type: string },
  ): Promise<KnowledgeItemRecord> {
    const formData = new FormData();
    formData.append("scope_key", scopeKey);
    formData.append("title", title);
    formData.append("file", file as unknown as Blob);
    const response = await javaApi.post<KnowledgeItemRecord>(
      "/knowledge/documents",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  async submitFaq(input: FaqKnowledgeInput): Promise<KnowledgeItemRecord> {
    const response = await javaApi.post<KnowledgeItemRecord>("/knowledge/faq", input);
    return response.data;
  },

  async listItems(status?: KnowledgeItemStatus): Promise<KnowledgeItemRecord[]> {
    const response = await javaApi.get<KnowledgeItemRecord[]>("/knowledge/items", {
      params: status ? { status } : undefined,
    });
    return response.data;
  },

  async getItem(itemId: string): Promise<KnowledgeItemRecord> {
    const response = await javaApi.get<KnowledgeItemRecord>(`/knowledge/items/${itemId}`);
    return response.data;
  },

  async submitForReview(itemId: string): Promise<KnowledgeItemRecord> {
    const response = await javaApi.post<KnowledgeItemRecord>(`/knowledge/items/${itemId}/submit`);
    return response.data;
  },

  async approveItem(itemId: string): Promise<KnowledgeItemRecord> {
    const response = await javaApi.post<KnowledgeItemRecord>(`/knowledge/items/${itemId}/approve`);
    return response.data;
  },

  async rejectItem(itemId: string, reason?: string): Promise<KnowledgeItemRecord> {
    const response = await javaApi.post<KnowledgeItemRecord>(
      `/knowledge/items/${itemId}/reject`,
      reason ? { reason } : undefined,
    );
    return response.data;
  },

  async publishItem(itemId: string): Promise<KnowledgeItemRecord> {
    const response = await javaApi.post<KnowledgeItemRecord>(`/knowledge/items/${itemId}/publish`);
    return response.data;
  },

  async archiveItem(itemId: string): Promise<KnowledgeItemRecord> {
    const response = await javaApi.post<KnowledgeItemRecord>(`/knowledge/items/${itemId}/archive`);
    return response.data;
  },
};
