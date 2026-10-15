import { FormField } from "@/shared/ui/commerce/CommercePrimitives";
import type { CourseCatalogTab } from "@/features/course/domain/course.types";
import { AppIcon } from "@/shared/ui/AppIcon";
import { Colors, radii } from "@/theme";
import { Plus } from "reicon-react-native";
import { Pressable, StyleSheet, View } from "react-native";

import { getCourseSearchPlaceholder } from "../utils/courseCatalogViewModel";

export function CourseCatalogSearchField({
  tab,
  onCreatePress,
}: {
  tab: CourseCatalogTab;
  onCreatePress?: () => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.field}>
        <FormField
          label="Tìm kiếm"
          value={getCourseSearchPlaceholder(tab)}
          editable={false}
        />
      </View>
      {onCreatePress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tạo khóa học"
          hitSlop={8}
          pressRetentionOffset={12}
          onPress={onCreatePress}
          style={({ pressed }) => [
            styles.createButton,
            pressed ? styles.createButtonPressed : null,
          ]}
        >
          <AppIcon icon={<Plus />} size={22} color={Colors.light.surface} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  field: {
    flex: 1,
  },
  createButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: Colors.light.primary,
  },
  createButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.97 }],
  },
});
