import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useMemo } from "react";
import { useColorScheme } from "react-native";

import { Colors } from "@/theme/theme";
import { APP_TABS } from "./appTabs.config";

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];
  const labelStyle = useMemo(
    () => ({ selected: { color: colors.text } }),
    [colors.text],
  );

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={labelStyle}
    >
      {APP_TABS.filter((tab) => tab.display).map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name}>
          <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>

          <NativeTabs.Trigger.Icon src={tab.icon} renderingMode="template" />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
