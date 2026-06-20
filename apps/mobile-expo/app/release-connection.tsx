import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { StackScreenTitle } from '@/components/navigation/StackScreenTitle';
import { releaseConnection } from '@/lib/api-contract';
import { Button, Card } from '@/components/ui/Button';
import type { AppColors } from '@/constants/theme';
import { spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useThemedStyles } from '@/hooks/useThemedStyles';

export default function ReleaseConnectionScreen() {
  const { session, isLoading } = useRequireAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(createReleaseConnectionStyles);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleRelease = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await releaseConnection(session);
      setResult(res.message);
      Alert.alert(
        'Conexão liberada',
        'Sua internet foi liberada por 24 horas enquanto resolvemos pendências.',
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível liberar a conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !session) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StackScreenTitle title="Liberar conexão" />
      <View style={styles.container}>
        <Card>
          <Text style={styles.title}>Liberar conexão temporariamente</Text>
          <Text style={styles.text}>
            Se sua internet foi bloqueada por pendência de pagamento, você pode solicitar a
            liberação por 24 horas enquanto regulariza a situação.
          </Text>
          {result ? <Text style={styles.success}>{result}</Text> : null}
          <Button title="Liberar minha conexão" onPress={handleRelease} loading={loading} />
        </Card>
      </View>
    </>
  );
}

function createReleaseConnectionStyles(colors: AppColors) {
  return StyleSheet.create({
    loading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      padding: spacing.lg,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: typography.bodyLarge,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    text: {
      fontSize: typography.body,
      color: colors.textSecondary,
      lineHeight: 24,
      marginBottom: spacing.lg,
    },
    success: {
      fontSize: typography.body,
      color: colors.accent,
      marginBottom: spacing.md,
      fontWeight: '600',
    },
  });
}
