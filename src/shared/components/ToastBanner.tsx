import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react-native';
import { colors, radius, spacing } from '../../core/theme/tokens';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface ToastBannerProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export function ToastBanner({ toast, onDismiss }: ToastBannerProps) {
  if (!toast) {
    return null;
  }

  const borderColor =
    toast.type === 'success'
      ? 'rgba(34, 197, 94, 0.45)'
      : toast.type === 'error'
      ? 'rgba(244, 63, 94, 0.45)'
      : 'rgba(99, 102, 241, 0.45)';

  const Icon =
    toast.type === 'success'
      ? CheckCircle2
      : toast.type === 'error'
      ? AlertCircle
      : Info;

  const iconColor =
    toast.type === 'success'
      ? colors.success
      : toast.type === 'error'
      ? colors.danger
      : colors.primary;

  return (
    <View style={[styles.container, { borderColor }]}>
      <Icon size={18} color={iconColor} />
      <Text style={styles.text} numberOfLines={3}>
        {toast.text}
      </Text>
      <Pressable onPress={onDismiss} hitSlop={8}>
        <X size={16} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  text: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
});

