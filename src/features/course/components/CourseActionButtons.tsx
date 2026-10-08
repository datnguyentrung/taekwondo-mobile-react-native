import { FloatingActionBar } from "@/shared/ui/FloatingActionBar";

export interface CourseActionButtonsProps {
  editTitle?: string;
  editAccessibilityLabel?: string;
  editDisabled?: boolean;
  onEditPress?: () => void;
  registerTitle?: string;
  registerAccessibilityLabel?: string;
  registerDisabled?: boolean;
  onRegisterPress?: () => void;
}

export function CourseActionButtons({
  editTitle = "Chỉnh sửa",
  editAccessibilityLabel = "Chỉnh sửa khóa học",
  editDisabled = false,
  onEditPress,
  registerTitle = "Đăng ký học viên",
  registerAccessibilityLabel = "Đăng ký học viên",
  registerDisabled = false,
  onRegisterPress,
}: CourseActionButtonsProps) {
  return (
    <FloatingActionBar
      actions={[
        {
          label: editTitle,
          accessibilityLabel: editAccessibilityLabel,
          variant: "outline",
          disabled: editDisabled,
          onPress: onEditPress,
        },
        {
          label: registerTitle,
          accessibilityLabel: registerAccessibilityLabel,
          variant: "primary",
          disabled: registerDisabled,
          onPress: onRegisterPress,
        },
      ]}
    />
  );
}
