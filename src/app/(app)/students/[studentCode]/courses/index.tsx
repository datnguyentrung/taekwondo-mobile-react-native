import { useLocalSearchParams } from 'expo-router';

import { StudentCoursesScreen } from '@/features/student-enrollment';

export default function StudentCoursesRoute() {
  const { studentCode, personType } = useLocalSearchParams<{ studentCode?: string; personType?: "student" | "coach" }>();
  return <StudentCoursesScreen studentCode={studentCode ?? 'VQ_00123'} personType={personType} />;
}
