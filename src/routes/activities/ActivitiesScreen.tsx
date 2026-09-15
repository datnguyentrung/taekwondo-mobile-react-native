import { Check, Star } from "reicon-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import { ACTIVITIES_GROUPS } from "@/features/activities/components/activities.constants";
import { ActivitiesGridSection } from "@/features/activities/components/ActivitiesGridSection";
import { activitiesQuickStorageService } from "@/features/activities/data/activitiesQuickStorageService";
import type { ActivitiesAction } from "@/features/activities/domain/activities.types";
import {
  addQuickActionId,
  getAvailableCatalogGroups,
  getDefaultQuickActionIds,
  getQuickActions,
  getValidQuickActionIds,
  removeQuickActionId,
} from "@/features/activities/domain/quickActions";
import {
  getAttendanceHistoryNavigationDecision,
  HistoryModePickerSheet,
  type AttendanceHistoryMode,
} from "@/features/attendance-history";
import { usePermissions } from "@/features/authorization";
import { HeaderActionButton } from "@/routes/navigation/components/HeaderActionButton";
import { Colors } from "@/theme";
import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import { NotificationHeaderButton } from "../navigation/components/NotificationHeaderButton";
import BottomTabScreenLayout from "../navigation/layouts/BottomTabScreenLayout";

const HISTORY_PICKER_CLOSE_DELAY_MS = 180;
const ALL_ACTIVITIES = ACTIVITIES_GROUPS.flatMap((group) => group.actions);
const DEFAULT_QUICK_IDS = getDefaultQuickActionIds(ALL_ACTIVITIES);

export default function ActivitiesScreen() {
  const router = useRouter();
  const permissions = usePermissions();
  const [changeListQuickFeatures, setChangeListQuickFeatures] =
    useState<boolean>(false);
  const [isQuickHydrated, setIsQuickHydrated] = useState(false);
  const [quickActionIds, setQuickActionIds] =
    useState<string[]>(DEFAULT_QUICK_IDS);
  const [historyModePickerVisible, setHistoryModePickerVisible] =
    useState(false);
  const historyPickerCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const quickActions = useMemo(
    () => getQuickActions(quickActionIds, ALL_ACTIVITIES),
    [quickActionIds],
  );

  const catalogGroups = useMemo(
    () => getAvailableCatalogGroups(ACTIVITIES_GROUPS, quickActionIds),
    [quickActionIds],
  );

  useEffect(() => {
    let isMounted = true;

    activitiesQuickStorageService
      .read()
      .then((storedIds) => {
        if (!isMounted) return;
        if (storedIds) {
          setQuickActionIds(getValidQuickActionIds(storedIds, ALL_ACTIVITIES));
        }
      })
      .finally(() => {
        if (isMounted) setIsQuickHydrated(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isQuickHydrated) return;
    void activitiesQuickStorageService.write(quickActionIds);
  }, [isQuickHydrated, quickActionIds]);

  useEffect(
    () => () => {
      if (historyPickerCloseTimerRef.current) {
        clearTimeout(historyPickerCloseTimerRef.current);
      }
    },
    [],
  );

  const addQuickAction = useCallback((action: ActivitiesAction) => {
    setQuickActionIds((currentIds) => addQuickActionId(currentIds, action.id));
  }, []);

  const removeQuickAction = useCallback((action: ActivitiesAction) => {
    setQuickActionIds((currentIds) =>
      removeQuickActionId(currentIds, action.id),
    );
  }, []);

  const navigateToHistoryMode = useCallback(
    (mode: AttendanceHistoryMode) => {
      if (historyPickerCloseTimerRef.current) {
        clearTimeout(historyPickerCloseTimerRef.current);
      }

      router.navigate(`/history/${mode}`);
      historyPickerCloseTimerRef.current = setTimeout(() => {
        setHistoryModePickerVisible(false);
      }, HISTORY_PICKER_CLOSE_DELAY_MS);
    },
    [router],
  );

  const handleActionPress = useCallback(
    (action: ActivitiesAction) => {
      if (action.id === "course-list") {
        router.push("/courses" as Href);
        return;
      }

      if (action.id === "student-list") {
        router.push("/students" as Href);
        return;
      }

      if (action.id !== "attendance-history") return;

      const decision = getAttendanceHistoryNavigationDecision(permissions);
      if (decision.type === "picker") {
        setHistoryModePickerVisible(true);
        return;
      }
      if (decision.type === "route") {
        navigateToHistoryMode(decision.mode);
      }
    },
    [navigateToHistoryMode, permissions],
  );

  return (
    <>
      <BottomTabScreenLayout
        title="Tính năng"
        activeTab="activities"
        rightActions={
          <>
            <NotificationHeaderButton color={Colors.light.surface} />
            <HeaderActionButton
              icon={changeListQuickFeatures ? <Check /> : <Star />}
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
          onActionPress={handleActionPress}
        />

        {catalogGroups.map((group, index) => (
          <View key={group.title ?? index}>
            {index > 0 ? <View style={styles.divider} /> : null}
            <ActivitiesGridSection
              title={group.title}
              actions={group.actions}
              isEditingQuick={changeListQuickFeatures}
              onAddQuickAction={addQuickAction}
              onActionPress={handleActionPress}
              style={index === 0 ? styles.catalogSection : styles.utilitySection}
            />
          </View>
        ))}
      </BottomTabScreenLayout>

      <HistoryModePickerSheet
        visible={historyModePickerVisible}
        onClose={() => setHistoryModePickerVisible(false)}
        onSelectMode={navigateToHistoryMode}
      />
    </>
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
