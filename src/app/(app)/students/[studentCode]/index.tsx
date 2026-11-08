import { useLocalSearchParams } from 'expo-router';

import { StudentDetailScreen } from '@/features/student';

export default function StudentDetailRoute() {
  const { studentCode, personType } = useLocalSearchParams<{ studentCode?: string; personType?: "student" | "coach" }>();
  return <StudentDetailScreen studentCode={studentCode} personType={personType} />;
}
