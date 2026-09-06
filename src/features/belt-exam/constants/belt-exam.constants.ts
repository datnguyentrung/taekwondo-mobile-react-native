export type BeltExamResult = 'PASSED' | 'FAILED' | 'ABSENT' | 'PENDING';
export type BeltExamType = 'PROMOTION' | 'MOCK';

export const BeltExamResultValues = ['PASSED', 'FAILED', 'ABSENT', 'PENDING'] as const satisfies readonly BeltExamResult[];
export const BeltExamTypeValues = ['PROMOTION', 'MOCK'] as const satisfies readonly BeltExamType[];
