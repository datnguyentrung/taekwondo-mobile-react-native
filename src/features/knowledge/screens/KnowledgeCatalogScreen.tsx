import { Image } from "expo-image";
import { useRouter, type Href } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Check } from "reicon-react-native";

import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import { AppIcon } from "@/shared/ui/AppIcon";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, effects, radii } from "@/theme";

import { KNOWLEDGE_FORM_ITEMS } from "../constants/knowledgeForms";
import type { KnowledgeFormMeta } from "../domain/knowledge.types";
import {
  toggleKnowledgeFormCompleted,
  useCompletedKnowledgeForms,
} from "../store/knowledgeProgressStore";

const ITEM_BACKGROUND = require("../../../../assets/images/knowledge/background-item.png");

export default function KnowledgeCatalogScreen() {
  const router = useRouter();
  const completedMap = useCompletedKnowledgeForms();

  const sortedItems = useMemo(() => {
    const pending: KnowledgeFormMeta[] = [];
    const completed: KnowledgeFormMeta[] = [];
    for (const item of KNOWLEDGE_FORM_ITEMS) {
      if (completedMap[item.id]) {
        completed.push(item);
      } else {
        pending.push(item);
      }
    }
    return [...pending, ...completed];
  }, [completedMap]);

  const openForm = (item: KnowledgeFormMeta) => {
    router.push(`/admin/knowledge/${item.id}` as Href);
  };

  return (
    <StackScreenLayout
      title="Quản lý Tri thức"
      contentContainerStyle={styles.screenContent}
    >
      <View style={styles.headerBlock}>
        <View style={styles.titleRow}>
          <View style={styles.accentBar} />
          <ThemedText type="subtitle" style={styles.headingText}>
            Chọn loại form
          </ThemedText>
        </View>
        <ThemedText type="bodySmall" style={styles.subtitleText}>
          Chọn 1 mục để nhập và quản lý tri thức.
        </ThemedText>
      </View>

      <View style={styles.grid}>
        {sortedItems.map((item) => {
          const isCompleted = Boolean(completedMap[item.id]);
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}${isCompleted ? " (Đã hoàn thành)" : ""}`}
              onPress={() => openForm(item)}
              style={({ pressed }) => [
                styles.card,
                isCompleted ? styles.cardCompleted : null,
                pressed ? styles.pressed : null,
              ]}
            >
              <Image
                source={ITEM_BACKGROUND}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />

              <Pressable
                accessibilityRole="checkbox"
                accessibilityLabel={`Đánh dấu ${item.title}`}
                accessibilityState={{ checked: isCompleted }}
                hitSlop={8}
                onPress={(e) => {
                  e.stopPropagation();
                  toggleKnowledgeFormCompleted(item.id);
                }}
                style={[
                  styles.statusCircle,
                  isCompleted ? styles.statusCircleCompleted : null,
                ]}
              >
                {isCompleted ? (
                  <AppIcon icon={<Check />} size={12} color={Colors.light.surface} />
                ) : null}
              </Pressable>

              <Image
                source={item.image}
                style={styles.cardImage}
                contentFit="contain"
              />
              <ThemedText
                type="featureLabel"
                style={[
                  styles.cardTitle,
                  isCompleted ? styles.cardTitleCompleted : null,
                ]}
              >
                {item.shortTitle}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </StackScreenLayout>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  headerBlock: {
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  accentBar: {
    width: 4,
    height: 24,
    borderRadius: 2,
    backgroundColor: Colors.light.primary,
  },
  headingText: {
    color: Colors.light.text,
  },
  subtitleText: {
    color: Colors.light.textSecondary,
    paddingLeft: 14,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  card: {
    width: "48.4%",
    minHeight: 112,
    paddingHorizontal: 10,
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.light.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: Colors.light.divider,
    overflow: "hidden",
    ...effects.card,
  },
  cardCompleted: {
    opacity: 0.88,
  },
  statusCircle: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.light.divider,
    backgroundColor: Colors.light.surface,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  statusCircleCompleted: {
    borderColor: "#16A34A",
    backgroundColor: "#16A34A",
  },
  cardImage: {
    width: 62,
    height: 62,
  },
  cardTitle: {
    flex: 1,
    color: Colors.light.text,
  },
  cardTitleCompleted: {
    color: Colors.light.textSecondary,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
});
