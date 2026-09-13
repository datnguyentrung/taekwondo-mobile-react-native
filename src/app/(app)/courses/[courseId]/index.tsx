import { useLocalSearchParams } from 'expo-router';

import { AdminCourseDetailScreen } from '@/features/student-commerce';

export default function AdminCourseDetailRoute() {
  const { courseId } = useLocalSearchParams<{ courseId?: string }>();
  return <AdminCourseDetailScreen courseId={courseId ?? 'basic'} />;
}
