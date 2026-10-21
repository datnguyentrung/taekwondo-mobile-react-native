export type SessionType = 'REQUIRED' | 'STANDARD' | 'OPEN' | string;
export type FulfillmentMode = 'RECURRING' | 'FLEX_BOOKING' | string;

export interface TrainingPlanCourseOption { courseId: string; name: string; capacity: number }
export interface TrainingPlanRequirement {
  requirementId: string;
  sessionType: SessionType;
  fulfillmentMode: FulfillmentMode;
  sessionsPerWeek: number;
  homeCourseOnly: boolean;
}
export interface TrainingPlanCatalogItem {
  trainingPlanId: string;
  name: string;
  level: string;
  durationMonths: number;
  includedSessionCount: number;
  basePrice: number;
  finalPrice: number;
  homeCourses: TrainingPlanCourseOption[];
  requirements: TrainingPlanRequirement[];
}
export interface TrainingPlanScheduleOption {
  courseScheduleId: string;
  courseId: string;
  courseName: string;
  branchName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  sessionType: SessionType;
}
export interface TrainingPlanRecurringRequirement extends TrainingPlanRequirement {
  label: string;
  options: TrainingPlanScheduleOption[];
}
export interface TrainingPlanRegistrationOptions {
  trainingPlanId: string;
  homeCourseId: string;
  startDate: string;
  endDate: string;
  recurringRequirements: TrainingPlanRecurringRequirement[];
  flexRequirements: Array<TrainingPlanRequirement & { description: string }>;
}
