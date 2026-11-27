import { useEffect, useState, type ReactNode, type RefObject } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Xmark } from "reicon-react-native";

import {
  AdminCard,
  AdminChip,
  AdminField,
  AdminPickerField,
  AdminPickerSheet,
  AdminSectionHeader,
  AdminSwitchField,
} from "@/shared/ui/admin/AdministrationPrimitives";
import { AppIcon } from "@/shared/ui/AppIcon";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, hexToRgba, radii } from "@/theme";

import type { SelectOption } from "../domain/knowledge.types";

export type FloatingFormProps<TPayload> = {
  tenantId: string;
  onSubmit: (payload: TPayload) => void;
  submitRef?: RefObject<(() => void) | null>;
  onValidChange?: (valid: boolean) => void;
};

export function useFloatingFormSubmit(
  submitRef: RefObject<(() => void) | null> | undefined,
  onSave: () => void,
  isValid: boolean,
  onValidChange: ((valid: boolean) => void) | undefined,
) {
  if (submitRef) {
    submitRef.current = onSave;
  }
  useEffect(() => {
    onValidChange?.(isValid);
  }, [isValid, onValidChange]);
}

export function KnowledgeSectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <AdminCard style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionAccent} />
        <View style={styles.sectionTitleWrap}>
          <AdminSectionHeader title={title} />
          {subtitle ? (
            <ThemedText type="bodySmall" style={styles.helperText}>
              {subtitle}
            </ThemedText>
          ) : null}
        </View>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </AdminCard>
  );
}

export function KnowledgeRadioGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly SelectOption<T>[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <View style={styles.fieldBlock}>
      <ThemedText type="featureLabel">{label}</ThemedText>
      <View style={styles.radioList}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.radioRow,
                selected ? styles.radioRowSelected : null,
                pressed ? styles.pressed : null,
              ]}
            >
              <View style={[styles.radioOuter, selected ? styles.radioOuterSelected : null]}>
                {selected ? <View style={styles.radioInner} /> : null}
              </View>
              <View style={styles.radioTextWrap}>
                <ThemedText
                  type="bodySmall"
                  style={[styles.radioLabel, selected ? styles.selectedLabel : null]}
                >
                  {option.label}
                </ThemedText>
                {option.description ? (
                  <ThemedText type="bodySmall" style={styles.helperText}>
                    {option.description}
                  </ThemedText>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function KnowledgeDropdownField<T extends string>({
  label,
  placeholder = "Chọn một mục...",
  options,
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  options: readonly SelectOption<T>[];
  value: T | "";
  onChange: (next: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <>
      <AdminPickerField
        label={label}
        valueLabel={selectedOption?.label}
        placeholder={placeholder}
        onPress={() => setOpen(true)}
      />
      <AdminPickerSheet
        visible={open}
        title={label}
        options={options}
        selectedValue={value || undefined}
        onSelect={(next) => {
          onChange(next as T);
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

export function KnowledgeChipMultiSelect<T extends string>({
  label,
  options,
  values,
  onChange,
}: {
  label: string;
  options: readonly SelectOption<T>[];
  values: readonly T[];
  onChange: (next: T[]) => void;
}) {
  const toggle = (itemValue: T) => {
    if (values.includes(itemValue)) {
      onChange(values.filter((v) => v !== itemValue));
    } else {
      onChange([...values, itemValue]);
    }
  };

  return (
    <View style={styles.fieldBlock}>
      <ThemedText type="featureLabel">{label}</ThemedText>
      <View style={styles.chipWrap}>
        {options.map((option) => (
          <AdminChip
            key={option.value}
            label={option.label}
            selected={values.includes(option.value)}
            onPress={() => toggle(option.value)}
          />
        ))}
      </View>
    </View>
  );
}

export function KnowledgeTagListInput({
  label,
  placeholder,
  items,
  onChange,
}: {
  label: string;
  placeholder: string;
  items: readonly string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const addItem = () => {
    const trimmed = draft.trim();
    if (!trimmed || items.includes(trimmed)) {
      setDraft("");
      return;
    }
    onChange([...items, trimmed]);
    setDraft("");
  };

  return (
    <View style={styles.fieldBlock}>
      <AdminSectionHeader
        title={label}
        actionLabel="Thêm"
        onAction={addItem}
      />
      <AdminField
        label="Giá trị mới"
        placeholder={placeholder}
        value={draft}
        onChangeText={setDraft}
      />
      {items.length > 0 ? (
        <View style={styles.tagList}>
          {items.map((item, idx) => (
            <View key={`${item}-${idx}`} style={styles.tagItem}>
              <ThemedText type="bodySmall" style={styles.tagText}>
                {item}
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Xóa ${item}`}
                hitSlop={8}
                onPress={() => onChange(items.filter((_, i) => i !== idx))}
              >
                <AppIcon icon={<Xmark />} size={14} color={Colors.light.primary} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function KnowledgeSwitchRow({
  label,
  helper,
  value,
  onValueChange,
}: {
  label: string;
  helper?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
}) {
  return (
    <AdminSwitchField
      label={label}
      description={helper}
      value={value}
      onValueChange={onValueChange}
    />
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    gap: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionAccent: {
    width: 4,
    height: 22,
    borderRadius: 2,
    backgroundColor: Colors.light.primary,
  },
  sectionTitleWrap: {
    flex: 1,
    gap: 2,
  },
  sectionBody: {
    gap: 12,
  },
  fieldBlock: {
    gap: 8,
  },
  helperText: {
    color: Colors.light.textSecondary,
  },
  radioList: {
    gap: 8,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: Colors.light.divider,
    backgroundColor: Colors.light.surface,
  },
  radioRowSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: hexToRgba(Colors.light.primary, 0.05),
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.light.textSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: Colors.light.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.primary,
  },
  radioTextWrap: {
    flex: 1,
    gap: 2,
  },
  radioLabel: {
    color: Colors.light.text,
  },
  selectedLabel: {
    color: Colors.light.primary,
    fontWeight: "600",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: hexToRgba(Colors.light.primary, 0.1),
  },
  tagText: {
    color: Colors.light.primary,
  },
  pressed: {
    opacity: 0.78,
  },
});
