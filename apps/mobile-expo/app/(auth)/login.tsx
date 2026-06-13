import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Link, Redirect, router } from 'expo-router';
import { formatDocument, isValidDocument } from '@/lib/api-contract';
import { AuthScreenHeader } from '@/components/ui/AuthScreenHeader';
import { SafeScreen } from '@/components/ui/SafeScreen';
import { Button, Input } from '@/components/ui/Button';
import { spacing, typography } from '@/constants/theme';
import type { AppColors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';

export default function LoginScreen() {
  const { signIn, session, isLoading } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(createLoginStyles);
  const [document, setDocument] = useState('');
  const [password, setPassword] = useState('');
  const [documentError, setDocumentError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDocumentChange = (value: string) => {
    setDocument(formatDocument(value));
    setDocumentError('');
    setGeneralError('');
  };

  const handleSubmit = async () => {
    let valid = true;
    if (!isValidDocument(document)) {
      setDocumentError('CPF ou CNPJ inválido.');
      valid = false;
    }
    if (password.length < 6) {
      setPasswordError('A senha deve ter pelo menos 6 caracteres.');
      valid = false;
    }
    if (!valid) return;

    setLoading(true);
    setGeneralError('');
    try {
      await signIn(document, password);
      router.replace('/(tabs)');
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeScreen style={styles.loading}>
        <ActivityIndicator size="large" color={colors.white} />
      </SafeScreen>
    );
  }

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={styles.flex}>
      <AuthScreenHeader tagline="Área do cliente" />

      <KeyboardAvoidingView
        style={styles.formArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Entrar na sua conta</Text>
          <Text style={styles.description}>
            Use seu CPF ou CNPJ e a senha cadastrada para acessar faturas e serviços.
          </Text>

          <Input
            label="CPF ou CNPJ"
            value={document}
            onChangeText={handleDocumentChange}
            keyboardType="numeric"
            placeholder="000.000.000-00"
            error={documentError}
            autoCapitalize="none"
          />
          <Input
            label="Senha"
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              setPasswordError('');
              setGeneralError('');
            }}
            secureTextEntry
            placeholder="Digite sua senha"
            error={passwordError}
          />

          {generalError ? <Text style={styles.generalError}>{generalError}</Text> : null}

          <Button title="Entrar" onPress={handleSubmit} loading={loading} />

          <Link href="/(auth)/first-access" asChild>
            <TouchableOpacity style={styles.link} accessibilityRole="link">
              <Text style={styles.linkText}>Primeiro acesso — criar senha</Text>
            </TouchableOpacity>
          </Link>

          <Text style={styles.hint}>Teste: CPF 529.982.247-25 · Senha 123456</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function createLoginStyles(colors: AppColors) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    loading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryMid,
    },
    formArea: {
      flex: 1,
    },
    container: {
      flexGrow: 1,
      padding: spacing.lg,
      paddingTop: spacing.xl,
    },
    title: {
      fontSize: typography.title,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    description: {
      fontSize: typography.body,
      color: colors.textSecondary,
      marginBottom: spacing.lg,
      lineHeight: 24,
    },
    generalError: {
      color: colors.error,
      fontSize: typography.body,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    link: {
      marginTop: spacing.lg,
      alignItems: 'center',
      minHeight: 48,
      justifyContent: 'center',
    },
    linkText: {
      color: colors.primary,
      fontSize: typography.bodyLarge,
      fontWeight: '600',
    },
    hint: {
      marginTop: spacing.xl,
      textAlign: 'center',
      fontSize: typography.label,
      color: colors.textSecondary,
    },
  });
}
