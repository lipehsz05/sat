import { useEffect, useMemo, useState } from 'react';
import { Platform, Switch } from 'react-native';
import { getThemeColors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

const TRACK_OFF = {
  light: '#B8C5D4',
  dark: '#3A4F66',
} as const;

const PALETTE_SYNC_MS = 320;

interface PreferenceSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  activeColor?: string;
}

export function PreferenceSwitch({
  value,
  onValueChange,
  disabled,
  activeColor,
}: PreferenceSwitchProps) {
  const { colors, isDark } = useTheme();
  const [paletteDark, setPaletteDark] = useState(isDark);

  useEffect(() => {
    const timer = setTimeout(() => setPaletteDark(isDark), PALETTE_SYNC_MS);
    return () => clearTimeout(timer);
  }, [isDark]);

  const palette = getThemeColors(paletteDark ? 'dark' : 'light');
  const trackOff = paletteDark ? TRACK_OFF.dark : TRACK_OFF.light;

  const trackColor = useMemo(
    () => ({
      false: trackOff,
      true: activeColor ?? palette.primary,
    }),
    [trackOff, activeColor, palette.primary],
  );

  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={trackColor}
      thumbColor={Platform.OS === 'android' ? colors.white : undefined}
      ios_backgroundColor={trackOff}
    />
  );
}
