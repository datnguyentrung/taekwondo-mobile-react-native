import { Trash6 } from "reicon-react-native";

import { AppIcon } from "@/shared/ui/AppIcon";
import { FloatingActionBar } from "@/shared/ui/FloatingActionBar";
import { Colors } from "@/theme";

export interface CourseActionButtonsProps {
  editTitle?: string;
  editAccessibilityLabel?: string;
  editDisabled?: boolean;
  onEditPress?: () => void;
  registerTitle?: string;
  registerAccessibilityLabel?: string;
  registerDisabled?: boolean;
  onRegisterPress?: () => void;
  deleteAccessibilityLabel?: string;
  deleteDisabled?: boolean;
  onDeletePress?: () => void;
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
  deleteAccessibilityLabel = "Xóa khóa học",
  deleteDisabled = false,
  onDeletePress,
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
          flex: 1,
        },
        {
          label: registerTitle,
          accessibilityLabel: registerAccessibilityLabel,
          variant: "primary",
          disabled: registerDisabled,
          onPress: onRegisterPress,
          flex: 1.3,
        },
        ...(onDeletePress
          ? [
              {
                label: "",
                accessibilityLabel: deleteAccessibilityLabel,
                variant: "ghost" as const,
                disabled: deleteDisabled,
                onPress: onDeletePress,
                flex: 0,
                style: {
                  width: 44,
                  minWidth: 44,
                  paddingHorizontal: 0,
                  backgroundColor: "transparent",
                  borderWidth: 0,
                },
                icon: (
                  <AppIcon
                    icon={<Trash6 />}
                    size={30}
                    color={
                      deleteDisabled
                        ? Colors.light.textSecondary
                        : Colors.light.error
                    }
                  />
                ),
              },
            ]
          : []),
      ]}
    />
  );
}
