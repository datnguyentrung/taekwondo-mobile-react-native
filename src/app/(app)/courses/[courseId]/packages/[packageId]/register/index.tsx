import { useLocalSearchParams } from 'expo-router';

import { PackageRegistrationScreen } from '@/features/student-commerce';

export default function AdminPackageRegisterRoute() {
  const { courseId, packageId } = useLocalSearchParams<{ courseId?: string; packageId?: string }>();
  return <PackageRegistrationScreen courseId={courseId ?? 'basic'} packageId={packageId ?? 'basic-1m'} />;
}
