import { useSyncExternalStore } from "react";

import type { KnowledgeFormType } from "../domain/knowledge.types";

type CompletedMap = Partial<Record<KnowledgeFormType, boolean>>;

let completedForms: CompletedMap = {};
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export function markKnowledgeFormCompleted(formType: KnowledgeFormType) {
  if (completedForms[formType]) return;
  completedForms = { ...completedForms, [formType]: true };
  emit();
}

export function toggleKnowledgeFormCompleted(formType: KnowledgeFormType) {
  completedForms = {
    ...completedForms,
    [formType]: !completedForms[formType],
  };
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): CompletedMap {
  return completedForms;
}

export function useCompletedKnowledgeForms(): CompletedMap {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
