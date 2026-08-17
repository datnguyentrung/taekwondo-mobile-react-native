export const ROLE_LEVELS = {
  GUEST: 0, // Guest or unauthenticated user
  STUDENT: 1,
  PARENT: 1, // Same level as STUDENT, but with different permissions
  ASSISTANT: 2,
  COACH: 3,
  MANAGER_SENIOR: 4,
  HEAD_COACH: 5,
  DEVELOPER: 99, // Special level for developers with all permissions
} as const;

export type RoleLevel = (typeof ROLE_LEVELS)[keyof typeof ROLE_LEVELS];
