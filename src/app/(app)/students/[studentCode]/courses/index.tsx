import { useLocalSearchParams } from 'expo-router';

import { StudentCoursesScreen } from '@/features/student-commerce';

export default function StudentCoursesRoute() {
  const { studentCode } = useLocalSearchParams<{ studentCode?: string }>();
  return <StudentCoursesScreen studentCode={studentCode ?? 'VQ_00123'} />;
}
