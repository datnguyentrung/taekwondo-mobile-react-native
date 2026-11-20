import { javaApi } from '../../lib/javaApi'

export type MovementType = 'NEW' | 'REACTIVATED' | 'LEAVE'
export type Gender = 'MALE' | 'FEMALE' | 'OTHER'
export type MovementCounts = Partial<Record<MovementType, number>>
export type MovementBucket = { counts: MovementCounts }
export type MonthlyMovement = { month: string; counts: MovementCounts; byAge: Record<string, MovementBucket>; byGender: Record<Gender, MovementBucket> }
export type QuarterlyMovement = { quarter: number; counts: MovementCounts; monthlyMovements: MonthlyMovement[] }
export type YearlyMovement = { year: number; counts: MovementCounts; quarterlyMovements: QuarterlyMovement[] }
export type StudentMovementsResponse = { currentActiveStudents: number; totalStudents: number; yearlyMovements: YearlyMovement[] }
export type StudentMovementQuery = { fromMonth?: string; toMonth?: string; minAge?: number; maxAge?: number; genders?: Gender[] }

export async function getStudentMovements(query: StudentMovementQuery, signal?: AbortSignal) {
  const { data } = await javaApi.client.get<StudentMovementsResponse>('/analytics/student-movements', { params: query, signal })
  return data
}
