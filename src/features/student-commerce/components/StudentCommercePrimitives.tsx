import { SegmentedControl } from "@/shared/ui/SegmentedControl";

export {
  FormField,
  InfoRow,
  PrimaryActionButton,
  RootLikeScreen,
  StatusBadge,
  SurfaceCard,
} from "./primitives/CommerceLayoutPrimitives";
export {
  BalanceCard,
  CourseCatalogCard,
  EnrollmentCard,
  PurchaseSummary,
  StudentSummaryCard,
  TransactionCard,
} from "./primitives/CommerceCards";
export { PackageCoursePicker, PackageSheet } from "./primitives/PackageSheet";

export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <SegmentedControl
      accessibilityRole="button"
      options={tabs}
      value={value}
      onChange={onChange}
    />
  );
}
