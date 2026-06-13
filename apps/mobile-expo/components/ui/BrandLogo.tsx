import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';

const LOGO_HORIZONTAL = require('../../assets/logo-horizontal.png');
const LOGO_ON_DARK = require('../../assets/logo-sem-fundo.png');

interface BrandLogoProps {
  style?: ViewStyle;
  size?: 'default' | 'compact' | 'large' | 'auth' | 'inCard';
  /** Fundo escuro/gradiente — usa PNG transparente em branco */
  variant?: 'default' | 'onDark';
}

export function BrandLogo({ style, size = 'default', variant = 'default' }: BrandLogoProps) {
  const imageStyle =
    size === 'large'
      ? styles.imageLarge
      : size === 'auth'
        ? styles.imageAuth
        : size === 'inCard'
          ? styles.imageInCard
          : size === 'compact'
            ? styles.imageCompact
            : styles.imageDefault;

  return (
    <View style={[styles.wrap, style]} accessibilityLabel="SAT TELECOM">
      <Image
        source={variant === 'onDark' ? LOGO_ON_DARK : LOGO_HORIZONTAL}
        style={[styles.image, imageStyle]}
        contentFit="contain"
        cachePolicy="memory-disk"
        accessibilityRole="image"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'center',
  },
  image: {
    width: 280,
    maxWidth: '100%',
  },
  imageDefault: {
    height: 88,
  },
  imageLarge: {
    height: 188,
    width: 320,
  },
  imageAuth: {
    height: 120,
    width: 280,
  },
  /** Logo no topo do card da home — overlay sem alterar layout do texto */
  imageInCard: {
    height: 180,
    width: 320,
  },
  imageCompact: {
    height: 72,
    width: 240,
  },
});

/** Altura da logo `inCard` — reservar esse espaço antes do texto abaixo */
export const LOGO_IN_CARD_HEIGHT = 180;
