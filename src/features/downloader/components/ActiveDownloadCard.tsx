import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  CheckCircle2,
  ExternalLink,
  Film,
  Music,
  X,
  XCircle,
} from 'lucide-react-native';
import { colors, radius, spacing } from '../../../core/theme/tokens';
import { formatBytes, formatEta } from '../../../core/utils/urlUtils';
import { DownloadPhase, DownloadTask } from '../../../shared/types/media';

interface ActiveDownloadCardProps {
  task: DownloadTask;
  onCancel: (taskId: string) => void;
  onDismiss: (taskId: string) => void;
  onOpenResult: (contentUri: string, mimeType: string) => void;
}

const PHASE_LABELS: Record<DownloadPhase, string> = {
  preparing: 'Preparando...',
  downloading: 'Descargando',
  merging: 'Uniendo audio y video',
  converting: 'Convirtiendo a MP3',
  finalizing: 'Agregando metadatos',
  saving: 'Guardando en teléfono',
  completed: 'Completado',
  error: 'Error',
  cancelled: 'Cancelado',
};

export function ActiveDownloadCard({
  task,
  onCancel,
  onDismiss,
  onOpenResult,
}: ActiveDownloadCardProps) {
  const isFinished =
    task.phase === 'completed' ||
    task.phase === 'error' ||
    task.phase === 'cancelled';

  const isMp4 = task.format === 'mp4';
  const accent =
    task.phase === 'error'
      ? colors.danger
      : task.phase === 'completed'
      ? colors.success
      : isMp4
      ? colors.mp4Accent
      : colors.mp3Accent;

  const progressPct = Math.max(0, Math.min(100, Math.round(task.progress)));
  const etaText = formatEta(task.etaSeconds);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View
          style={[
            styles.formatTag,
            { backgroundColor: isMp4 ? colors.mp4Soft : colors.mp3Soft },
          ]}>
          {isMp4 ? (
            <Film size={13} color={colors.mp4Accent} />
          ) : (
            <Music size={13} color={colors.mp3Accent} />
          )}
          <Text
            style={[
              styles.formatTagText,
              { color: isMp4 ? colors.mp4Accent : colors.mp3Accent },
            ]}>
            {task.format.toUpperCase()} · {task.quality}
          </Text>
        </View>

        {isFinished ? (
          <Pressable onPress={() => onDismiss(task.taskId)} hitSlop={8}>
            <X size={16} color={colors.textMuted} />
          </Pressable>
        ) : (
          <Pressable
            style={styles.cancelChip}
            onPress={() => onCancel(task.taskId)}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {task.title}
      </Text>

      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${
                task.phase === 'completed' ? 100 : Math.max(4, progressPct)
              }%`,
              backgroundColor: accent,
            },
          ]}
        />
      </View>

      <View style={styles.footerRow}>
        <View style={styles.statusLeft}>
          {task.phase === 'completed' && (
            <CheckCircle2 size={14} color={colors.success} />
          )}
          {task.phase === 'error' && (
            <XCircle size={14} color={colors.danger} />
          )}
          <Text style={styles.phaseText} numberOfLines={1}>
            {PHASE_LABELS[task.phase]}
            {!isFinished && progressPct > 0 ? ` · ${progressPct}%` : ''}
            {!isFinished && etaText ? ` (${etaText})` : ''}
          </Text>
        </View>

        {task.result && (
          <Text style={styles.sizeText}>
            {formatBytes(task.result.fileSize)}
          </Text>
        )}
      </View>

      {task.errorMessage ? (
        <Text style={styles.errorDetail} numberOfLines={3}>
          {task.errorMessage}
        </Text>
      ) : null}

      {task.phase === 'completed' && task.result ? (
        <Pressable
          style={({ pressed }) => [
            styles.openButton,
            pressed && styles.pressed,
          ]}
          onPress={() =>
            onOpenResult(task.result!.contentUri, task.result!.mimeType)
          }>
          <ExternalLink size={15} color="#FFFFFF" />
          <Text style={styles.openButtonText}>
            Abrir ({task.result.publicFolder})
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md + 2,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  formatTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  formatTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cancelChip: {
    backgroundColor: colors.dangerSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  cancelText: {
    color: '#FDA4AF',
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 7,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  phaseText: {
    color: colors.textSecondary,
    fontSize: 12,
    flex: 1,
  },
  sizeText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  errorDetail: {
    color: '#FDA4AF',
    fontSize: 12,
    lineHeight: 16,
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 9,
    marginTop: 2,
  },
  openButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.85,
  },
});

