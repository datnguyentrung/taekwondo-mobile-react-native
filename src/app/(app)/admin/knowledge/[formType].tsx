import { useLocalSearchParams } from "expo-router";

import { KnowledgeFormScreen } from "@/features/knowledge";

export default function AdminKnowledgeFormRoute() {
  const { formType } = useLocalSearchParams<{ formType: string }>();
  return <KnowledgeFormScreen formType={String(formType ?? "")} />;
}
