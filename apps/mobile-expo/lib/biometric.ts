import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import { getPreference, savePreference } from '@/lib/storage';

export const BIOMETRIC_PREF_KEY = 'biometric';

function biometricPrefKey(userId: string): string {
  const safeUserId = userId.replace(/[^\w.-]/g, '_');
  return `${BIOMETRIC_PREF_KEY}_${safeUserId}`;
}

/** Padrão: desligado até o usuário ativar em Ajustes. */
export async function isBiometricPreferenceEnabled(userId: string): Promise<boolean> {
  const value = await getPreference(biometricPrefKey(userId));
  return value === 'true';
}

export async function setBiometricPreferenceEnabled(
  userId: string,
  enabled: boolean,
): Promise<void> {
  await savePreference(biometricPrefKey(userId), String(enabled));
}

export async function isBiometricAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return compatible && enrolled;
}

export async function getBiometricLabel(): Promise<string> {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return Platform.OS === 'ios' ? 'Face ID' : 'Reconhecimento facial';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return Platform.OS === 'ios' ? 'Touch ID' : 'Impressão digital';
  }
  return Platform.OS === 'ios' ? 'Biometria' : 'Biometria ou senha do aparelho';
}

async function usesIosBiometricsOnly(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  return (
    types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) ||
    types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
  );
}

export async function authenticateWithBiometric(
  promptMessage = 'Desbloqueie para acessar o app',
): Promise<LocalAuthentication.LocalAuthenticationResult> {
  const iosBiometricsOnly = await usesIosBiometricsOnly();

  return LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: 'Cancelar',
    disableDeviceFallback: iosBiometricsOnly,
    ...(iosBiometricsOnly ? { fallbackLabel: '' } : {}),
  });
}

/** Desbloqueio do app — biometria com fallback para senha/PIN do aparelho */
export async function authenticateForAppUnlock(
  promptMessage = 'Desbloqueie para acessar o app',
): Promise<LocalAuthentication.LocalAuthenticationResult> {
  return LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: 'Cancelar',
    disableDeviceFallback: false,
  });
}

export async function enableBiometricWithVerification(userId: string): Promise<{
  ok: boolean;
  reason?: 'web' | 'unavailable' | 'cancelled' | 'storage';
}> {
  if (Platform.OS === 'web') {
    return { ok: false, reason: 'web' };
  }

  const level = await LocalAuthentication.getEnrolledLevelAsync();
  if (level === LocalAuthentication.SecurityLevel.NONE) {
    return { ok: false, reason: 'unavailable' };
  }

  const result = await authenticateForAppUnlock(
    'Confirme sua identidade para ativar a biometria',
  );
  if (!result.success) {
    return { ok: false, reason: 'cancelled' };
  }

  try {
    await setBiometricPreferenceEnabled(userId, true);
  } catch {
    return { ok: false, reason: 'storage' };
  }

  return { ok: true };
}
