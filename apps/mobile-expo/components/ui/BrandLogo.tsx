import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';

const LOGO_HORIZONTAL = require('../../assets/logo-horizontal.png');
const LOGO_ON_DARK = require('../../assets/logo-sem-fundo.png');
const LOGO_DASHBOARD = require('../../assets/sat-telecom-removebg-preview.png');

/**
 * O PNG da dashboard tem muita área transparente ao redor da marca.
 * Exibimos só um “viewport” (slot) e deslocamos a imagem com margens negativas.
 */
export const DASHBOARD_LOGO_VIEWPORT = {
  width: 240,
  height: 56,
} as const;

const DASHBOARD_LOGO_IMAGE = {
  width: 400,
  height: 126,
  marginLeft: -12,
  marginTop: -36,
} as const;

interface BrandLogoProps {
  style?: ViewStyle;
  size?: 'default' | 'compact' | 'large' | 'auth' | 'inCard' | 'dashboard';
  /** Fundo escuro/gradiente — usa PNG transparente em branco */
  variant?: 'default' | 'onDark' | 'dashboard';
}

export function BrandLogo({ style, size = 'default', variant = 'default' }: BrandLogoProps) {
  const resolvedVariant = variant === 'dashboard' || size === 'dashboard' ? 'dashboard' : variant;
  const resolvedSize = size === 'dashboard' ? 'dashboard' : size;

  if (resolvedVariant === 'dashboard' || resolvedSize === 'dashboard') {
    return (
      <View
        style={[styles.dashboardViewport, style]}
        accessibilityLabel="SAT TELECOM"
      >
        <Image
          source={LOGO_DASHBOARD}
          style={styles.dashboardImage}
          contentFit="contain"
          contentPosition="left top"
          cachePolicy="memory-disk"
          accessibilityRole="image"
        />
      </View>
    );
  }

  const imageStyle =
    resolvedSize === 'large'
      ? styles.imageLarge
      : resolvedSize === 'auth'
        ? styles.imageAuth
        : resolvedSize === 'inCard'
          ? styles.imageInCard
          : resolvedSize === 'compact'
            ? styles.imageCompact
            : styles.imageDefault;

  const source = resolvedVariant === 'onDark' ? LOGO_ON_DARK : LOGO_HORIZONTAL;

  return (
    <View style={[styles.wrap, style]} accessibilityLabel="SAT TELECOM">
      <Image
        source={source}
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
  dashboardViewport: {
    width: DASHBOARD_LOGO_VIEWPORT.width,
    height: DASHBOARD_LOGO_VIEWPORT.height,
    overflow: 'hidden',
    paddingLeft: 4,
    paddingTop: 0,
  },
  dashboardImage: {
    width: DASHBOARD_LOGO_IMAGE.width,
    height: DASHBOARD_LOGO_IMAGE.height,
    marginLeft: DASHBOARD_LOGO_IMAGE.marginLeft,
    marginTop: DASHBOARD_LOGO_IMAGE.marginTop,
    maxWidth: undefined,
  },
});

/** Altura da logo `inCard` — reservar esse espaço antes do texto abaixo */
export const LOGO_IN_CARD_HEIGHT = 180;
