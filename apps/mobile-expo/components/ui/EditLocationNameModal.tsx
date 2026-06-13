import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { AppColors } from '@/constants/theme';
import { radius, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';
import { useThemedStyles } from '@/hooks/useThemedStyles';

interface EditLocationNameModalProps {
  visible: boolean;
  officialName: string;
  initialValue: string;
  onClose: () => void;
  onSave: (value: string) => void | Promise<void>;
}

export function EditLocationNameModal({
  visible,
  officialName,
  initialValue,
  onClose,
  onSave,
}: EditLocationNameModalProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createEditLocationNameModalStyles);
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible, initialValue]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(value);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async () => {
    setSaving(true);
    try {
      await onSave('');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Nome deste endereço</Text>
          <Text style={styles.hint}>
            Escolha um nome que ajude você a reconhecer este ponto (ex.: “Minha casa”, “Loja
            centro”). O nome na conta da operadora continua sendo{' '}
            <Text style={styles.hintStrong}>{officialName}</Text>.
          </Text>

          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            placeholder={officialName}
            placeholderTextColor={colors.textSecondary}
            maxLength={40}
            autoFocus
            selectTextOnFocus
          />

          <View style={styles.actions}>
            <Button title="Salvar" onPress={handleSave} loading={saving} />
            <Button
              title="Usar nome da conta"
              variant="outline"
              onPress={handleRestore}
              disabled={saving}
            />
            <Button title="Cancelar" variant="secondary" onPress={onClose} disabled={saving} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createEditLocationNameModalStyles(colors: AppColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    sheet: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.md,
    },
    title: {
      fontSize: typography.title,
      fontWeight: '800',
      color: colors.primary,
    },
    hint: {
      fontSize: typography.body,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    hintStrong: {
      fontWeight: '700',
      color: colors.primary,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: typography.bodyLarge,
      color: colors.text,
      backgroundColor: colors.background,
    },
    actions: {
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
  });
}
