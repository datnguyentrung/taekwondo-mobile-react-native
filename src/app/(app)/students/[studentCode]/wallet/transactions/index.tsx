import { useLocalSearchParams } from 'expo-router';

import { WalletTransactionsScreen, type TransactionFilter } from '@/features/student-commerce';

export default function StudentWalletTransactionsRoute() {
  const { studentCode, transactionFilter } = useLocalSearchParams<{
    studentCode?: string;
    transactionFilter?: TransactionFilter;
  }>();
  return (
    <WalletTransactionsScreen
      context="admin-student"
      studentCode={studentCode ?? 'VQ_00123'}
      initialFilter={transactionFilter ?? 'all'}
    />
  );
}
