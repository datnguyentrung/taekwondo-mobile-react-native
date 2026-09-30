import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { AppIcon } from "@/shared/ui/AppIcon";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, activeEffect, effects, radii } from "@/theme";
import type { AppIconElement } from "@/theme/icons";

export interface PickerPopoverOption<T = string> {
  value: T;
  label: string;
  subtitle?: string;
  icon?: AppIconElement;
  bg?: string;
  text?: string;
  border?: string;
}

export interface PickerPopoverProps<T = string> {
  visible: boolean;
  title: string;
  subtitle?: string;
  options: PickerPopoverOption<T>[];
  selectedValue?: T | null;
  onSelect: (value: T) => void;
  onClose: () => void;
  useModal?: boolean;
}

export function PickerPopover<T = string>({
  visible,
  title,
  subtitle,
  options,
  selectedValue,
  onSelect,
  onClose,
  useModal = true,
}: PickerPopoverProps<T>) {
  if (!visible) return null;

  const content = (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.backdrop}>
        <TouchableWithoutFeedback>
          <View style={styles.popoverCard}>
            <View style={styles.header}>
                {subtitle ? (
                  <ThemedText type="caption" style={styles.headerSubtitle}>
                    {subtitle.toUpperCase()}
                  </ThemedText>
                ) : null}
                <ThemedText
                  type="subtitle"
                  numberOfLines={1}
                  style={styles.headerTitle}
                >
                  {title}
                </ThemedText>
              </View>

              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.optionsList}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {options.map((option, idx) => {
                  const isSelected = selectedValue === option.value;
                  const itemBg =
                    option.bg ??
                    (isSelected
                      ? Colors.light.primarySoft
                      : Colors.light.backgroundElement);
                  const itemText =
                    option.text ??
                    (isSelected ? Colors.light.primary : Colors.light.text);
                  const itemBorder =
                    option.border ??
                    (isSelected ? Colors.light.primary : Colors.light.divider);

                  return (
                    <Pressable
                      key={String(option.value ?? idx)}
                      accessibilityRole="button"
                      accessibilityLabel={option.label}
                      onPress={() => {
                        onSelect(option.value);
                        onClose();
                      }}
                      style={({ pressed }) => [
                        styles.optionItem,
                        { backgroundColor: itemBg, borderColor: itemBorder },
                        isSelected ? styles.optionItemSelected : null,
                        activeEffect(pressed, "pressedScale"),
                      ]}
                    >
                      <View style={styles.optionLeft}>
                        {option.icon ? (
                          <AppIcon icon={option.icon} size={16} color={itemText} />
                        ) : null}
                        <View style={styles.optionTextContainer}>
                          <ThemedText
                            type="body"
                            style={[styles.optionText, { color: itemText }]}
                          >
                            {option.label}
                          </ThemedText>
                          {option.subtitle ? (
                            <ThemedText
                              type="caption"
                              style={[
                                styles.optionSubtext,
                                { color: Colors.light.textSecondary },
                              ]}
                            >
                              {option.subtitle}
                            </ThemedText>
                          ) : null}
                        </View>
                      </View>
                      {isSelected ? (
                        <View
                          style={[styles.checkDot, { backgroundColor: itemText }]}
                        />
                      ) : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    );

    if (useModal) {
      return (
        <Modal
          transparent
          visible={visible}
          animationType="fade"
          onRequestClose={onClose}
        >
          {content}
        </Modal>
      );
    }

    return (
      <View style={[StyleSheet.absoluteFill, styles.overlayWrapper]}>
        {content}
      </View>
    );
  }

const styles = StyleSheet.create({
  overlayWrapper: {
    zIndex: 9999,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  popoverCard: {
    width: "100%",
    maxWidth: 340,
    maxHeight: 440,
    backgroundColor: Colors.light.surface,
    borderRadius: radii.xl,
    padding: 20,
    ...effects.card,
  },
  header: {
    marginBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.divider,
    paddingBottom: 10,
  },
  headerSubtitle: {
    color: Colors.light.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  headerTitle: {
    color: Colors.light.text,
    fontSize: 17,
  },
  scrollView: {
    maxHeight: 320,
  },
  optionsList: {
    gap: 10,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  optionItemSelected: {
    borderWidth: 2,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    fontWeight: "600",
    fontSize: 15,
  },
  optionSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  checkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
});
