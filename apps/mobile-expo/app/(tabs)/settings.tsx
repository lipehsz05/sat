import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeScreen } from '@/components/ui/SafeScreen';
import { changePassword, formatAddressShort, formatCurrency, formatDocument, maskDocument } from '@/lib/api-contract';
import {
  enableBiometricWithVerification,
  isBiometricPreferenceEnabled,
  setBiometricPreferenceEnabled,
} from '@/lib/biometric';
import { Button, Card, Input } from '@/components/ui/Button';
import type { AppColors } from '@/constants/theme';
import { spacing, typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useBiometric } from '@/context/BiometricContext';
import { useLocationDisplayName, useLocationLabels } from '@/context/LocationLabelsContext';
import { useTheme } from '@/context/ThemeContext';
import { EditLocationNameModal } from '@/components/ui/EditLocationNameModal';
import type { ServiceLocation } from '@/lib/api-contract';
import { confirmAsync } from '@/lib/platform-alert';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useNotifications } from '@/context/NotificationContext';
import { sendTestNotification } from '@/lib/notifications/push-service';

function SettingsLocationRow({ location }: { location: ServiceLocation }) {
  const styles = useThemedStyles(createSettingsLocationRowStyles);
  const displayName = useLocationDisplayName(location.id, location.name);
  const { setCustomName } = useLocationLabels();
  const [editVisible, setEditVisible] = useState(false);
  const hasCustom = displayName !== location.name;

  return (
    <TouchableOpacity
      style={styles.locationItem}
      onPress={() => setEditVisible(true)}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Editar nome de ${displayName}`}
    >
      <View style={styles.locationTitleRow}>
        <Text style={styles.locationName}>{displayName}</Text>
        <Text style={styles.locationEditHint}>Editar</Text>
      </View>
      {hasCustom ? <Text style={styles.locationOfficial}>Na conta: {location.name}</Text> : null}
      <Text style={styles.locationPlan}>{location.planName}</Text>
      <Text style={styles.locationAddress}>{formatAddressShort(location.address)}</Text>
      <Text style={styles.locationAmount}>Mensal: {formatCurrency(location.monthlyAmount)}</Text>
      <EditLocationNameModal
        visible={editVisible}
        officialName={location.name}
        initialValue={hasCustom ? displayName : ''}
        onClose={() => setEditVisible(false)}
        onSave={(value) => setCustomName(location.id, value, location.name)}
      />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { session, profile, signOut } = useAuth();
  const { refreshBiometricPreference, markUnlockedThisSession } = useBiometric();
  const { colors, isDark, setMode } = useTheme();
  const {
    preferences: notifPrefs,
    setPreferences: setNotifPrefs,
    refreshPreferences,
  } = useNotifications();
  const styles = useThemedStyles(createSettingsStyles);
  const [biometric, setBiometric] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setBiometric(await isBiometricPreferenceEnabled());
      await refreshPreferences();
    })();
  }, [refreshPreferences]);

  const toggleBiometric = async (value: boolean) => {
    if (Platform.OS === 'web') {
      Alert.alert('Indisponível', 'Biometria não está disponível na versão web.');
      return;
    }
    if (value) {
      const { ok, reason } = await enableBiometricWithVerification();
      if (!ok) {
        if (reason === 'unavailable') {
          Alert.alert(
            'Biometria indisponível',
            'Seu dispositivo não possui biometria ou senha do aparelho configurada.',
          );
        }
        return;
      }
      setBiometric(true);
      markUnlockedThisSession();
      await refreshBiometricPreference();
      return;
    }
    setBiometric(false);
    await setBiometricPreferenceEnabled(false);
    await refreshBiometricPreference();
  };

  const handleChangePassword = async () => {
    if (!session) return;
    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    setPasswordError('');
    try {
      await changePassword(session, currentPassword, newPassword);
      Alert.alert('Sucesso', 'Senha alterada com sucesso.');
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Erro ao alterar senha.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const confirmed = await confirmAsync(
      'Sair',
      'Deseja sair da sua conta?',
      'Sair',
      'Cancelar',
    );
    if (!confirmed) return;
    await signOut();
    router.replace('/(auth)/login');
  };

  if (!profile) {
    return (
      <SafeScreen style={styles.safe}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Ajustes</Text>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Dados da conta</Text>
          <Text style={styles.label}>Nome</Text>
          <Text style={styles.value}>{profile.name}</Text>
          <Text style={styles.label}>CPF/CNPJ</Text>
          <Text style={styles.value}>{maskDocument(formatDocument(profile.document))}</Text>
          <Text style={styles.label}>E-mail</Text>
          <Text style={styles.value}>{profile.email}</Text>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>
            Endereços / redes ({profile.locations.length})
          </Text>
          {profile.locations.map((location) => (
            <SettingsLocationRow key={location.id} location={location} />
          ))}
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Preferências</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Modo escuro</Text>
            <Switch
              value={isDark}
              onValueChange={(v) => setMode(v ? 'dark' : 'light')}
              trackColor={{ true: colors.primaryMid }}
            />
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Notificações</Text>
            <Switch
              value={notifPrefs.enabled}
              onValueChange={(v) => void setNotifPrefs({ enabled: v })}
              trackColor={{ true: colors.primary }}
            />
          </View>
          {notifPrefs.enabled ? (
            <>
              <View style={[styles.row, styles.subRow]}>
                <Text style={styles.rowLabel}>Faturas e vencimentos</Text>
                <Switch
                  value={notifPrefs.invoiceReminders}
                  onValueChange={(v) => void setNotifPrefs({ invoiceReminders: v })}
                  trackColor={{ true: colors.primary }}
                />
              </View>
              <View style={[styles.row, styles.subRow]}>
                <Text style={styles.rowLabel}>Promoções e novidades</Text>
                <Switch
                  value={notifPrefs.promotions}
                  onValueChange={(v) => void setNotifPrefs({ promotions: v })}
                  trackColor={{ true: colors.primary }}
                />
              </View>
              {Platform.OS !== 'web' ? (
                <TouchableOpacity
                  onPress={() => void sendTestNotification()}
                  style={styles.notifTest}
                >
                  <Text style={styles.linkMuted}>Enviar notificação de teste</Text>
                </TouchableOpacity>
              ) : null}
            </>
          ) : null}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Entrar com biometria</Text>
            <Switch
              value={biometric}
              onValueChange={toggleBiometric}
              trackColor={{ true: colors.primary }}
              disabled={Platform.OS === 'web'}
            />
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Segurança</Text>
          {!showPasswordForm ? (
            <TouchableOpacity onPress={() => setShowPasswordForm(true)}>
              <Text style={styles.link}>Alterar senha</Text>
            </TouchableOpacity>
          ) : (
            <>
              <Input
                label="Senha atual"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
              />
              <Input
                label="Nova senha"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
              <Input
                label="Confirmar nova senha"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
              {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}
              <Button title="Salvar senha" onPress={handleChangePassword} loading={loading} />
            </>
          )}
        </Card>

        <Button title="Sair da conta" variant="secondary" onPress={handleLogout} />
      </ScrollView>
    </SafeScreen>
  );
}

function createSettingsStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    container: { padding: spacing.lg, paddingBottom: spacing.xl },
    title: {
      fontSize: typography.title,
      fontWeight: '800',
      color: colors.primary,
      marginBottom: spacing.lg,
    },
    section: { marginBottom: spacing.md },
    sectionTitle: {
      fontSize: typography.bodyLarge,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.md,
    },
    label: {
      fontSize: typography.label,
      color: colors.textSecondary,
      marginTop: spacing.sm,
    },
    value: {
      fontSize: typography.body,
      color: colors.text,
      marginTop: 2,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      minHeight: 48,
      marginBottom: spacing.sm,
    },
    rowLabel: {
      fontSize: typography.body,
      color: colors.text,
      flex: 1,
    },
    subRow: {
      paddingLeft: spacing.md,
      opacity: 0.95,
    },
    notifTest: {
      marginBottom: spacing.sm,
    },
    link: {
      fontSize: typography.bodyLarge,
      color: colors.primary,
      fontWeight: '600',
    },
    linkMuted: {
      fontSize: typography.label,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    error: {
      color: colors.error,
      marginBottom: spacing.sm,
    },
  });
}

function createSettingsLocationRowStyles(colors: AppColors) {
  return StyleSheet.create({
    locationItem: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: spacing.md,
      marginTop: spacing.md,
    },
    locationTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    locationName: {
      flex: 1,
      fontSize: typography.bodyLarge,
      fontWeight: '700',
      color: colors.primary,
    },
    locationEditHint: {
      fontSize: typography.label,
      fontWeight: '600',
      color: colors.primaryLight,
    },
    locationOfficial: {
      fontSize: typography.label,
      color: colors.textSecondary,
      marginTop: 2,
    },
    locationPlan: {
      fontSize: typography.label,
      color: colors.textSecondary,
      marginTop: 2,
    },
    locationAddress: {
      fontSize: typography.body,
      color: colors.text,
      marginTop: spacing.sm,
      lineHeight: 22,
    },
    locationAmount: {
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.primaryLight,
      marginTop: 4,
    },
  });
}
