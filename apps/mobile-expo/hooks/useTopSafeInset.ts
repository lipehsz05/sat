import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Padding superior seguro (status bar / notch / Dynamic Island). */
export function useTopSafeInset(extra = 0): number {
  const insets = useSafeAreaInsets();
  return insets.top + extra;
}

/** Padding inferior seguro (home indicator). */
export function useBottomSafeInset(extra = 0): number {
  const insets = useSafeAreaInsets();
  return insets.bottom + extra;
}
