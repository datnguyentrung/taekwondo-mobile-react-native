import { memo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { appIcons, type AppIconName } from '@/theme/icons';

export type AppIconProps = {
  name: AppIconName;
  size?: number;
  width?: number;
  height?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

type SvgImport = string | { default?: string };

function resolveSvgXml(icon: SvgImport | undefined) {
  if (typeof icon === 'string') return icon;
  if (typeof icon?.default === 'string') return icon.default;
  return null;
}

function tintSvg(svg: string, color?: string) {
  if (!color) {
    return svg;
  }

  return svg
    .replace(/fill="(?!none|url\()[^"]*"/g, `fill="${color}"`)
    .replace(/stroke="(?!none|url\()[^"]*"/g, `stroke="${color}"`);
}

function AppIconComponent({ name, size = 24, width, height, color, style }: AppIconProps) {
  const icon = resolveSvgXml(appIcons[name] as SvgImport | undefined);

  if (!icon) {
    return null;
  }

  return (
    <SvgXml
      xml={tintSvg(icon, color)}
      width={width ?? size}
      height={height ?? size}
      style={style}
    />
  );
}

export const AppIcon = memo(AppIconComponent);
