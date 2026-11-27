export type KnowledgeFormType =
  | "center-profile"
  | "facility-item"
  | "policy-rule"
  | "class-suitability"
  | "enrollment-step"
  | "taekwondo-concept"
  | "poomsae"
  | "belt-rank"
  | "discount-rule";

export type FacilityCategory =
  | "MAT"
  | "ARMOR"
  | "ROOM_AMENITY"
  | "SAFETY"
  | "EQUIPMENT";

export type PolicyCategory =
  | "TRIAL"
  | "OPENING_HOURS"
  | "TRAINING_CONDUCT"
  | "LEAVE_MAKEUP"
  | "BELT_EXAM"
  | "TUITION"
  | "PAYMENT";

export type TargetGoal =
  | "FITNESS"
  | "SELF_DEFENSE"
  | "COMPETITION"
  | "RECREATIONAL"
  | "DISCIPLINE";

export type EnrollmentChannel = "ONLINE" | "OFFLINE" | "HYBRID";

export type ConceptCategory = "TECHNIQUE" | "RULE" | "TERMINOLOGY" | "BENEFIT";

export type TargetAudience = "KIDS" | "TEENS" | "ADULTS" | "ALL";

export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

export type SelectOption<T extends string = string> = {
  value: T;
  label: string;
  description?: string;
};

export type KnowledgeFormMeta = {
  id: KnowledgeFormType;
  title: string;
  shortTitle: string;
  description: string;
  image: number;
  layout: "half" | "full";
};

export type CenterProfileFormPayload = {
  tenant_id: string;
  title: string;
  history?: string;
  vision?: string;
  mission?: string;
  email?: string;
  zalo_url?: string;
  facebook_url?: string;
  website_url?: string;
  support_hours?: string;
  branch_ids: number[];
};

export type FacilityItemFormPayload = {
  tenant_id: string;
  name: string;
  category: FacilityCategory;
  quantity_note?: string;
  description: string;
  branch_id?: number;
};

export type PolicyRuleFormPayload = {
  tenant_id: string;
  policy_code: string;
  category: PolicyCategory;
  title: string;
  summary: string;
  conditions: string[];
  operating_hours?: Record<string, string>;
  payment_methods?: {
    method: string;
    account_name?: string;
    account_number?: string;
    bank_name?: string;
    note?: string;
  }[];
  effective_from?: string;
  effective_to?: string;
  branch_ids: number[];
};

export type ClassSuitabilityFormPayload = {
  tenant_id: string;
  profile_code: string;
  min_age: number;
  max_age: number;
  target_goals: TargetGoal[];
  curriculum_summary?: string;
  curriculum_modules: string[];
  prerequisites?: string;
  course_id?: string;
  training_plan_ids: string[];
};

export type EnrollmentStepFormPayload = {
  tenant_id: string;
  step_code: string;
  step_order: number;
  title: string;
  description: string;
  required_documents: string[];
  channel: EnrollmentChannel;
  training_plan_ids: string[];
};

export type TaekwondoConceptFormPayload = {
  tenant_id: string;
  name: string;
  korean_name?: string;
  category: ConceptCategory;
  target_audience: TargetAudience;
  description: string;
};

export type PoomsaeFormPayload = {
  tenant_id: string;
  name: string;
  korean_name?: string;
  movement_count?: number;
  level?: string;
  description: string;
};

export type BeltRankFormPayload = {
  tenant_id: string;
  name: string;
  rank_order: number;
  color: string;
  meaning?: string;
  min_training_months?: number;
  exam_requirements: string[];
  required_concepts: string[];
  required_poomsae: string[];
  next_rank_name?: string;
};

export type DiscountRuleFormPayload = {
  tenant_id: string;
  rule_code: string;
  name: string;
  discount_type: DiscountType;
  discount_value: number;
  min_months: number;
  min_students: number;
  promo_code?: string;
  stackable: boolean;
  priority: number;
  applicable_plan_ids: string[];
  valid_from?: string;
  valid_to?: string;
  description?: string;
  branch_ids: number[];
};
