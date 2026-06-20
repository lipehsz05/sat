import { Stack } from 'expo-router';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useStackScreenOptions } from '@/hooks/useStackScreenOptions';

interface StackScreenTitleProps {
  title: string;
  options?: NativeStackNavigationOptions;
}

export function StackScreenTitle({ title, options }: StackScreenTitleProps) {
  const baseOptions = useStackScreenOptions();
  return <Stack.Screen options={{ ...baseOptions, title, ...options }} />;
}
