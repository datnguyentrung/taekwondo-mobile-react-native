import { type Href, useRouter } from "expo-router";
import { StyleSheet } from "react-native";

import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";

import {
  WalletBalanceCard,
  WalletCoursePreviewCard,
  WalletSectionGroup,
  WalletTransactionPreviewCard,
} from "../components/wallet";
import { studentCommerceMock } from "../fixtures/studentCommerce.fixtures";

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
    <StackScreenLayout title="Ví điện tử" contentContainerStyle={styles.content}>
      <WalletBalanceCard
        student={state.selectedStudent}
        balance={state.wallet.balance}
        actionLabel="Hướng dẫn nạp tiền"
        onActionPress={() => router.push(asHref(topUpPath))}
      />

      <WalletSectionGroup
        icon="layersFill"
        title="Khóa học đang học"
        subtitle="Tiếp tục hành trình chinh phục mục tiêu của bạn"
        count={activeEnrollments.length}
        footerLabel="Xem tất cả khóa học"
        onFooterPress={() => router.push(asHref(courseListPath))}
      >
        {activeEnrollments.map((enrollment) => (
          <WalletCoursePreviewCard
            key={enrollment.enrollmentId}
            enrollment={enrollment}
            onPress={() =>
              router.push(
                asHref(
                  isAccount
                    ? `/account/courses/${enrollment.enrollmentId}`
                    : `/students/${routeStudentCode}/courses/${enrollment.enrollmentId}`,
                ),
              )
            }
          />
        ))}
      </WalletSectionGroup>

      <WalletSectionGroup
        icon="noteText"
        title="Giao dịch gần đây"
        subtitle="Theo dõi các khoản thu chi của bạn"
        count={recentTransactions.length}
        footerLabel="Xem tất cả giao dịch"
        onFooterPress={() => router.push(asHref(transactionListPath))}
      >
        {recentTransactions.map((transaction) => (
          <WalletTransactionPreviewCard
            key={transaction.id}
            transaction={transaction}
          />
        ))}
      </WalletSectionGroup>
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
