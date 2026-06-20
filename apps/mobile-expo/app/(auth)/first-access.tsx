import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  formatDocument,
  formatPhone,
  isValidDocument,
  isValidEmail,
  isValidPhone,
  registerFirstAccess,
  verifyFirstAccessCode,
} from '@/lib/api-contract';
import type { FirstAccessChannel } from '@/lib/api-contract';
import { AuthScreenHeader } from '@/components/ui/AuthScreenHeader';
import { Button, Input } from '@/components/ui/Button';
import { radius, spacing, typography } from '@/constants/theme';
import type { AppColors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';

const STEPS = ['Documento', 'Verificação', 'Senha'];

export default function FirstAccessScreen() {
  const { signIn } = useAuth();
  const { showToast } = useToast();
  const styles = useThemedStyles(createFirstAccessStyles);
  const [step, setStep] = useState(0);
  const [document, setDocument] = useState('');
  const [contactChannel, setContactChannel] = useState<FirstAccessChannel>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const contactDisplay = useMemo(
    () => (contactChannel === 'email' ? email.trim() : formatPhone(phone)),
    [contactChannel, email, phone],
  );

  const handleDocumentChange = (value: string) => {
    setDocument(formatDocument(value));
    setError('');
  };

  const handlePhoneChange = (value: string) => {
    setPhone(formatPhone(value));
    setError('');
  };

  const nextFromDocument = () => {
    if (!isValidDocument(document)) {
      setError('Informe um CPF ou CNPJ válido.');
      return;
    }
    if (contactChannel === 'email') {
      if (!isValidEmail(email)) {
        setError('Informe um e-mail válido.');
        return;
      }
    } else if (!isValidPhone(phone)) {
      setError('Informe um WhatsApp válido com DDD.');
      return;
    }
    setError('');
    setStep(1);
  };

  const nextFromCode = async () => {
    if (code.length < 4) {
      setError('Digite o código recebido (use 1234 no teste).');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await verifyFirstAccessCode(document, code);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código inválido.');
    } finally {
      setLoading(false);
    }
  };

  const finish = async () => {
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const contact =
        contactChannel === 'email'
          ? { channel: 'email' as const, email: email.trim() }
          : { channel: 'whatsapp' as const, phone };
      await registerFirstAccess(document, contact, password);
      await signIn(document, password);
      router.replace('/(tabs)');
      showToast('Conta criada com sucesso');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível concluir o cadastro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.flex}>
      <AuthScreenHeader tagline="Primeiro acesso" />

      <KeyboardAvoidingView
        style={styles.formArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.description}>
          Siga as etapas abaixo para criar sua senha e acessar o app.
        </Text>

        <View style={styles.stepper}>
          <View style={styles.stepTrack}>
            <View style={styles.stepLineBase}>
              <View
                style={[
                  styles.stepLineProgress,
                  { width: `${(step / (STEPS.length - 1)) * 100}%` },
                ]}
              />
            </View>
            <View style={styles.stepDotsRow}>
              {STEPS.map((label, index) => (
                <View key={label} style={styles.stepDotColumn}>
                  <View style={[styles.stepDot, index <= step && styles.stepDotActive]}>
                    <Text style={[styles.stepNumber, index <= step && styles.stepNumberActive]}>
                      {index + 1}
                    </Text>
                  </View>
                  <Text style={[styles.stepLabel, index <= step && styles.stepLabelActive]}>
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {step === 0 ? (
          <>
            <Input
              label="CPF ou CNPJ"
              value={document}
              onChangeText={handleDocumentChange}
              keyboardType="numeric"
              placeholder="000.000.000-00"
            />

            <Text style={styles.contactLabel}>Como deseja receber o código?</Text>
            <View style={styles.channelTabs}>
              <TouchableOpacity
                style={[styles.channelTab, contactChannel === 'email' && styles.channelTabActive]}
                onPress={() => {
                  setContactChannel('email');
                  setError('');
                }}
              >
                <Text
                  style={[
                    styles.channelTabText,
                    contactChannel === 'email' && styles.channelTabTextActive,
                  ]}
                >
                  E-mail
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.channelTab,
                  contactChannel === 'whatsapp' && styles.channelTabActive,
                ]}
                onPress={() => {
                  setContactChannel('whatsapp');
                  setError('');
                }}
              >
                <Text
                  style={[
                    styles.channelTabText,
                    contactChannel === 'whatsapp' && styles.channelTabTextActive,
                  ]}
                >
                  WhatsApp
                </Text>
              </TouchableOpacity>
            </View>

            {contactChannel === 'email' ? (
              <Input
                label="E-mail cadastrado"
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="seu@email.com"
              />
            ) : (
              <Input
                label="WhatsApp cadastrado"
                value={phone}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                placeholder="(83) 99999-9999"
              />
            )}

            <Button title="Continuar" onPress={nextFromDocument} />
          </>
        ) : null}

        {step === 1 ? (
          <>
            <Text style={styles.info}>
              Enviamos um código para {contactDisplay} via{' '}
              {contactChannel === 'email' ? 'e-mail' : 'WhatsApp'}. No modo teste, use o código
              1234.
            </Text>
            <Input
              label="Código de verificação"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              placeholder="1234"
            />
            <Button title="Verificar" onPress={nextFromCode} loading={loading} />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Input
              label="Nova senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Mínimo 6 caracteres"
            />
            <Input
              label="Confirmar senha"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="Repita a senha"
            />
            <Button title="Concluir cadastro" onPress={finish} loading={loading} />
          </>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.footerActions}>
          <Button
            title="Voltar ao login"
            variant="outline"
            onPress={() => router.replace('/(auth)/login')}
          />
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function createFirstAccessStyles(colors: AppColors) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    formArea: { flex: 1 },
    container: {
      flexGrow: 1,
      padding: spacing.lg,
      paddingTop: spacing.lg,
    },
    description: {
      fontSize: typography.body,
      color: colors.textSecondary,
      marginBottom: spacing.lg,
      lineHeight: 24,
    },
    stepper: {
      marginBottom: spacing.lg,
    },
    stepTrack: {
      position: 'relative',
    },
    stepLineBase: {
      position: 'absolute',
      top: 16,
      left: '16.67%',
      right: '16.67%',
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    stepLineProgress: {
      height: '100%',
      borderRadius: 2,
      backgroundColor: colors.accent,
    },
    stepDotsRow: {
      flexDirection: 'row',
      zIndex: 1,
    },
    stepDotColumn: {
      flex: 1,
      alignItems: 'center',
    },
    stepDot: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.border,
      borderWidth: 4,
      borderColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepDotActive: {
      backgroundColor: colors.accent,
    },
    stepNumber: {
      fontWeight: '700',
      color: colors.textSecondary,
    },
    stepNumberActive: {
      color: colors.white,
    },
    stepLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 6,
      textAlign: 'center',
    },
    stepLabelActive: {
      color: colors.accent,
      fontWeight: '600',
    },
    contactLabel: {
      fontSize: typography.label,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    channelTabs: {
      flexDirection: 'row',
      backgroundColor: colors.border,
      borderRadius: radius.md,
      padding: 4,
      marginBottom: spacing.md,
    },
    channelTab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: radius.sm,
    },
    channelTabActive: {
      backgroundColor: colors.surface,
    },
    channelTabText: {
      fontSize: typography.body,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    channelTabTextActive: {
      color: colors.accent,
    },
    info: {
      fontSize: typography.body,
      color: colors.textSecondary,
      marginBottom: spacing.md,
      lineHeight: 22,
    },
    error: {
      color: colors.error,
      fontSize: typography.body,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    footerActions: {
      marginTop: spacing.xl,
    },
  });
}
