import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DownloadCloud } from 'lucide-react-native';
import { colors, radius, spacing } from '../../core/theme/tokens';
import { EngineStatus } from '../types/media';

interface AppHeaderProps {
  engineStatus: EngineStatus | null;
}

export function AppHeader({ engineStatus }: AppHeaderProps) {
  const isReady = Boolean(engineStatus?.initialized && engineStatus?.ffmpegReady);
  const hasError = Boolean(engineStatus?.error);

  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <View style={styles.logoBox}>
          <DownloadCloud size={20} color="#FFFFFF" strokeWidth={2.3} />
        </View>
        <View>
          <Text style={styles.title}>MediaFetch</Text>
          <Text style={styles.subtitle}>Video MP4 y Música MP3</Text>
        </View>
      </View>

      <View
        style={[
          styles.statusPill,
          isReady
            ? styles.statusReady
            : hasError
            ? styles.statusError
            : styles.statusPending,
        ]}>
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: isReady
                ? colors.success
                : hasError
                ? colors.danger
                : colors.warning,
            },
          ]}
        />
        <Text style={styles.statusText}>
          {isReady
            ? 'Motor listo'
            : hasError
            ? 'Error motor'
            : 'Iniciando...'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logoBox: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  statusReady: {
    backgroundColor: colors.successSoft,
    borderColor: 'rgba(34, 197, 94, 0.35)',
  },
  statusPending: {
    backgroundColor: colors.warningSoft,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  statusError: {
    backgroundColor: colors.dangerSoft,
    borderColor: 'rgba(244, 63, 94, 0.35)',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
});

