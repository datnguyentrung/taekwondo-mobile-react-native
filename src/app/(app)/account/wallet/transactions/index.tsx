import { useLocalSearchParams } from 'expo-router';

import { WalletTransactionsScreen, type TransactionFilter } from '@/features/student-commerce';

export default function AccountWalletTransactionsRoute() {
  const { transactionFilter } = useLocalSearchParams<{ transactionFilter?: TransactionFilter }>();
  return (
    <WalletTransactionsScreen
      context="account"
      studentCode="VQ_00123"
      initialFilter={transactionFilter ?? 'all'}
    />
  );
}
