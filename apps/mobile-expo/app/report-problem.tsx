import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Stack } from 'expo-router';
import { reportProblem } from '@/lib/api-contract';
import type { ReportProblemPayload } from '@/lib/api-contract';
import { Button, Input } from '@/components/ui/Button';
import type { AppColors } from '@/constants/theme';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useThemedStyles } from '@/hooks/useThemedStyles';

const PROBLEM_TYPES: { value: ReportProblemPayload['type']; label: string }[] = [
  { value: 'connection', label: 'Sem conexão' },
  { value: 'speed', label: 'Internet lenta' },
  { value: 'billing', label: 'Cobrança' },
  { value: 'other', label: 'Outro' },
];

export default function ReportProblemScreen() {
  const { session, isLoading } = useRequireAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(createReportProblemStyles);
  const [type, setType] = useState<ReportProblemPayload['type']>('connection');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!session) return;
    if (description.trim().length < 10) {
      Alert.alert('Descrição curta', 'Descreva o problema com pelo menos 10 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await reportProblem(session, { type, description: description.trim() });
      Alert.alert(
        'Chamado aberto',
        'Recebemos seu relato. Nossa equipe entrará em contato em breve.',
      );
      setDescription('');
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar o relato.');
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
      <Stack.Screen options={{ title: 'Reportar problema' }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Tipo do problema</Text>
        <View style={styles.types}>
          {PROBLEM_TYPES.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[styles.typeChip, type === item.value && styles.typeChipActive]}
              onPress={() => setType(item.value)}
            >
              <Text
                style={[styles.typeText, type === item.value && styles.typeTextActive]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Descreva o problema"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
          style={styles.textarea}
          placeholder="Ex.: A internet caiu desde ontem à noite..."
        />

        <Button title="Enviar relato" onPress={handleSubmit} loading={loading} />
      </ScrollView>
    </>
  );
}

function createReportProblemStyles(colors: AppColors) {
  return StyleSheet.create({
    loading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    container: {
      padding: spacing.lg,
      backgroundColor: colors.background,
    },
    label: {
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    types: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    typeChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      minHeight: 48,
      justifyContent: 'center',
    },
    typeChipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    typeText: {
      fontSize: typography.body,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    typeTextActive: {
      color: colors.primary,
    },
    textarea: {
      minHeight: 120,
      textAlignVertical: 'top',
      paddingTop: 14,
    },
  });
}
