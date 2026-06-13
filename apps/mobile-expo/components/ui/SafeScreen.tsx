import type { ReactNode } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

interface SafeScreenProps {
  children: ReactNode;
  style?: ViewStyle;
  /** Padrão: respeita status bar. Telas com header nativo do Stack costumam usar `[]`. */
  edges?: Edge[];
}

/**
 * Container de tela que respeita safe area (iPhone notch, status bar, home indicator).
 * Use em telas sem header nativo do React Navigation.
 */
export function SafeScreen({ children, style, edges = ['top'] }: SafeScreenProps) {
  return (
    <SafeAreaView style={[styles.screen, style]} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
