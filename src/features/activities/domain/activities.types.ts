import type { AppIconElement } from "@/theme/icons";

export type ActivitiesAction = {
  id: string;
  label: string;
  icon: AppIconElement;
  defaultQuick?: boolean;
};

export type ActivitiesActionGroup = {
  title?: string;
  actions: ActivitiesAction[];
};
