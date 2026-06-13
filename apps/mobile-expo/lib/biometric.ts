import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import { getPreference, savePreference } from '@/lib/storage';

export const BIOMETRIC_PREF_KEY = 'biometric';

export async function isBiometricPreferenceEnabled(): Promise<boolean> {
  const value = await getPreference(BIOMETRIC_PREF_KEY);
  return value === 'true';
}

export async function setBiometricPreferenceEnabled(enabled: boolean): Promise<void> {
  await savePreference(BIOMETRIC_PREF_KEY, String(enabled));
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

/** Desbloqueio do app — Face ID / Touch ID no iOS (sem pedir código do aparelho) */
export async function authenticateForAppUnlock(
  promptMessage = 'Desbloqueie para acessar o app',
): Promise<LocalAuthentication.LocalAuthenticationResult> {
  return authenticateWithBiometric(promptMessage);
}

export async function enableBiometricWithVerification(): Promise<{
  ok: boolean;
  reason?: 'web' | 'unavailable' | 'cancelled';
}> {
  if (Platform.OS === 'web') {
    return { ok: false, reason: 'web' };
  }
  if (!(await isBiometricAvailable())) {
    return { ok: false, reason: 'unavailable' };
  }
  const result = await authenticateWithBiometric(
    'Confirme sua identidade para ativar a biometria',
  );
  if (!result.success) {
    return { ok: false, reason: 'cancelled' };
  }
  await setBiometricPreferenceEnabled(true);
  return { ok: true };
}
