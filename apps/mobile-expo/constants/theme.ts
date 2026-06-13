export type AppColors = {
  primary: string;
  primaryMid: string;
  primaryLight: string;
  accent: string;
  accentDark: string;
  accentLight: string;
  white: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  textOnDark: string;
  textMutedOnDark: string;
  border: string;
  error: string;
  errorLight: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  overdue: string;
};

export const lightColors: AppColors = {
  primary: '#0B1F3A',
  primaryMid: '#143256',
  primaryLight: '#1E4A7A',
  accent: '#E30613',
  accentDark: '#B8050F',
  accentLight: '#FEE2E4',
  white: '#FFFFFF',
  background: '#F4F7FB',
  surface: '#FFFFFF',
  text: '#0B1F3A',
  textSecondary: '#5A6B7D',
  textOnDark: '#FFFFFF',
  textMutedOnDark: 'rgba(255,255,255,0.75)',
  border: '#D8E2ED',
  error: '#E30613',
  errorLight: '#FEE2E4',
  success: '#059669',
  successLight: '#D1FAE5',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  overdue: '#E30613',
};

export const darkColors: AppColors = {
  primary: '#93B8D9',
  primaryMid: '#6E9CC4',
  primaryLight: '#B3D0EA',
  accent: '#E30613',
  accentDark: '#FF4D58',
  accentLight: '#3A1520',
  white: '#FFFFFF',
  background: '#0A1220',
  surface: '#141E30',
  text: '#E8EEF5',
  textSecondary: '#8FA3B8',
  textOnDark: '#FFFFFF',
  textMutedOnDark: 'rgba(255,255,255,0.75)',
  border: '#243246',
  error: '#FF5A67',
  errorLight: '#351820',
  success: '#34D399',
  successLight: '#153528',
  warning: '#FBBF24',
  warningLight: '#352A12',
  overdue: '#E30613',
};

/** @deprecated Use `useTheme().colors` */
export const colors = lightColors;

export type ThemeMode = 'light' | 'dark';

export function getThemeColors(mode: ThemeMode): AppColors {
  return mode === 'dark' ? darkColors : lightColors;
}

/** Gradiente da marca (headers / login) — igual nos dois modos */
export const brandGradient = {
  start: '#1E4A7A',
  end: '#0B1F3A',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const typography = {
  body: 16,
  bodyLarge: 18,
  label: 14,
  title: 22,
  headline: 28,
  amount: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const touchTarget = 48;
