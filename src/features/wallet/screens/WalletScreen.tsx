import { Layers, NoteText } from "reicon-react-native";
import { type Href, useRouter } from "expo-router";
import { StyleSheet } from "react-native";

import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";

import { WalletBalanceCard } from "@/features/student-commerce/components/wallet";
import { studentCommerceMock } from "@/features/student-commerce/fixtures/studentCommerce.fixtures";
import { NavigationMenu, NavigationMenuItem } from "@/shared/ui/NavigationMenu";

type StudentRouteProps = {
  studentCode?: string;
};

function useCommerceState() {
  return studentCommerceMock;
}

function asHref(path: string) {
  return path as Href;
}

type WalletOverviewProps = StudentRouteProps & {
  context: "admin-student" | "account";
};

function WalletOverview({ studentCode, context }: WalletOverviewProps) {
  const router = useRouter();
  const state = useCommerceState();
  const routeStudentCode = studentCode ?? state.selectedStudent.studentCode;
  const activeEnrollments = state.enrollments
    .filter((item) => !item.history)
    .slice(0, 2);
  const recentTransactions = state.transactions.slice(0, 2);
  const isAccount = context === "account";

  const courseListPath = isAccount
    ? "/account/courses"
    : `/students/${routeStudentCode}/courses`;
  const transactionListPath = isAccount
    ? "/account/wallet/transactions"
    : `/students/${routeStudentCode}/wallet/transactions`;
  const topUpPath = isAccount
    ? "/account/wallet/top-up-guide"
    : `/students/${routeStudentCode}/top-up`;

  return (
    <StackScreenLayout
      title="Ví điện tử"
      contentContainerStyle={styles.content}
    >
      <WalletBalanceCard
        student={state.selectedStudent}
        balance={state.wallet.balance}
        actionLabel="Hướng dẫn nạp tiền"
        onActionPress={() => router.push(asHref(topUpPath))}
      />

      <NavigationMenu>
        <NavigationMenuItem
          icon={<NoteText />}
          // iconBox
          title="Giao dịch gần đây"
          subtitle="Xem lịch sử thu chi của ví"
          count={recentTransactions.length}
          onPress={() => router.push(asHref(transactionListPath))}
        />
        <NavigationMenuItem
          icon={<Layers weight="Filled" />}
          // iconBox
          title="Khóa học tham gia"
          subtitle="Xem danh sách khóa học hiện tại"
          count={activeEnrollments.length}
          onPress={() => router.push(asHref(courseListPath))}
        />
      </NavigationMenu>
    </StackScreenLayout>
  );
}

export function WalletScreen({
  studentCode,
  context = "admin-student",
}: StudentRouteProps & { context?: "admin-student" | "account" }) {
  return <WalletOverview studentCode={studentCode} context={context} />;
}

export function AccountWalletScreen() {
  return <WalletOverview studentCode="VQ_00123" context="account" />;
}

const styles = StyleSheet.create({
  content: {
    gap: 20,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
});
