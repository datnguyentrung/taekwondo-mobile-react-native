import { useLocalSearchParams } from 'expo-router';

import { TopUpScreen } from '@/features/student-commerce';

export default function StudentTopUpRoute() {
  const { studentCode } = useLocalSearchParams<{ studentCode?: string }>();
  return <TopUpScreen studentCode={studentCode ?? 'VQ_00123'} />;
}
