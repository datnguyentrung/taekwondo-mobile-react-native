import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import type { ActivitiesAction } from "@/features/activities/components/activities.constants";
import { ACTIVITIES_GROUPS } from "@/features/activities/components/activities.constants";
import { ActivitiesGridSection } from "@/features/activities/components/ActivitiesGridSection";
import { activitiesQuickStorageService } from "@/features/activities/components/activitiesQuickStorageService";
import { HeaderActionButton } from "@/routes/navigation/components/HeaderActionButton";
import { Colors } from "@/theme";
import { NotificationHeaderButton } from "../navigation/components/NotificationHeaderButton";
import BottomTabScreenLayout from "../navigation/layouts/BottomTabScreenLayout";

const MAX_QUICK_FEATURES = 4;
const ALL_ACTIVITIES = ACTIVITIES_GROUPS.flatMap((group) => group.actions);
const DEFAULT_QUICK_IDS = ALL_ACTIVITIES.filter((action) => action.defaultQuick)
  .slice(0, MAX_QUICK_FEATURES)
  .map((action) => action.id);

export default function ActivitiesScreen() {
  const [changeListQuickFeatures, setChangeListQuickFeatures] =
    useState<boolean>(false);
  const [isQuickHydrated, setIsQuickHydrated] = useState(false);
  const [quickActionIds, setQuickActionIds] =
    useState<string[]>(DEFAULT_QUICK_IDS);

  const activitiesById = useMemo(
    () => new Map(ALL_ACTIVITIES.map((action) => [action.id, action])),
    [],
  );

  const quickActions = useMemo(
    () =>
      quickActionIds
        .map((id) => activitiesById.get(id))
        .filter((action): action is ActivitiesAction => Boolean(action)),
    [activitiesById, quickActionIds],
  );

  useEffect(() => {
    let isMounted = true;

    activitiesQuickStorageService
      .read()
      .then((storedIds) => {
        if (!isMounted) return;
        if (storedIds) {
          setQuickActionIds(
            storedIds
              .filter((id) => activitiesById.has(id))
              .slice(0, MAX_QUICK_FEATURES),
          );
        }
      })
      .finally(() => {
        if (isMounted) setIsQuickHydrated(true);
      });

    return () => {
      isMounted = false;
    };
  }, [activitiesById]);

  useEffect(() => {
    if (!isQuickHydrated) return;
    void activitiesQuickStorageService.write(quickActionIds);
  }, [isQuickHydrated, quickActionIds]);

  const addQuickAction = useCallback((action: ActivitiesAction) => {
    setQuickActionIds((currentIds) => {
      if (
        currentIds.includes(action.id) ||
        currentIds.length >= MAX_QUICK_FEATURES
      ) {
        return currentIds;
      }
      return [...currentIds, action.id];
    });
  }, []);

  const removeQuickAction = useCallback((action: ActivitiesAction) => {
    setQuickActionIds((currentIds) =>
      currentIds.filter((id) => id !== action.id),
    );
  }, []);

  return (
    <BottomTabScreenLayout
      title="Tính năng"
      activeTab="activities"
      rightActions={
        <>
          <NotificationHeaderButton color={Colors.light.surface} />
          <HeaderActionButton
            icon={changeListQuickFeatures ? "checkRead" : "star"}
            label="Lựa chọn nhanh"
            color={Colors.light.surface}
            onPress={() => setChangeListQuickFeatures((current) => !current)}
          />
        </>
      }
    >
      <ActivitiesGridSection
        actions={quickActions}
        variant="quick"
        isEditingQuick={changeListQuickFeatures}
        onRemoveQuickAction={removeQuickAction}
      />

      {ACTIVITIES_GROUPS.map((group, index) => (
        <View key={group.title ?? index}>
          {index > 0 ? <View style={styles.divider} /> : null}
          <ActivitiesGridSection
            title={group.title}
            actions={group.actions}
            isEditingQuick={changeListQuickFeatures}
            onAddQuickAction={addQuickAction}
            style={index === 0 ? styles.catalogSection : styles.utilitySection}
          />
        </View>
      ))}
    </BottomTabScreenLayout>
  );
}

const styles = StyleSheet.create({
  catalogSection: {
    marginTop: 38,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 31,
    backgroundColor: Colors.light.divider,
  },
  utilitySection: {
    marginTop: 32,
  },
});
