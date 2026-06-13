import { StyleSheet, View } from 'react-native';
import type { AppColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';

interface BoletoBarcodeVisualProps {
  code: string;
  height?: number;
}

/** Representação visual simplificada do código de barras */
export function BoletoBarcodeVisual({ code, height = 64 }: BoletoBarcodeVisualProps) {
  const styles = useThemedStyles(createBoletoBarcodeVisualStyles);
  const digits = code.replace(/\D/g, '').split('');

  return (
    <View style={styles.wrap}>
      {digits.map((digit, index) => {
        const n = Number(digit) || 0;
        const width = (n % 3) + 1;
        const isWide = n >= 5;
        return (
          <View
            key={`${index}-${digit}`}
            style={[
              styles.bar,
              {
                width,
                height,
                marginRight: isWide ? 2 : 1,
                opacity: index % 2 === 0 ? 1 : 0.85,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

function createBoletoBarcodeVisualStyles(colors: AppColors) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'center',
      flexWrap: 'nowrap',
      overflow: 'hidden',
      paddingVertical: 8,
      paddingHorizontal: 4,
      backgroundColor: colors.white,
    },
    bar: {
      backgroundColor: colors.text,
    },
  });
}
