import { useLocalSearchParams } from 'expo-router';

import { WalletScreen } from '@/features/student-commerce';

export default function StudentWalletRoute() {
  const { studentCode } = useLocalSearchParams<{ studentCode?: string }>();
  return <WalletScreen context="admin-student" studentCode={studentCode ?? 'VQ_00123'} />;
}
