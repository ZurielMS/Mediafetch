import React from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Film, Music, Play, Share2, Trash2 } from 'lucide-react-native';
import { colors, radius, spacing } from '../../../core/theme/tokens';
import { formatBytes, formatRelativeDate } from '../../../core/utils/urlUtils';
import { DownloadedItem } from '../../../shared/types/media';

interface DownloadedItemCardProps {
  item: DownloadedItem;
  onOpen: (item: DownloadedItem) => void;
  onShare: (item: DownloadedItem) => void;
  onDelete: (item: DownloadedItem) => void;
}

export function DownloadedItemCard({
  item,
  onOpen,
  onShare,
  onDelete,
}: DownloadedItemCardProps) {
  const isMp4 = item.format === 'mp4';
  const accent = isMp4 ? colors.mp4Accent : colors.mp3Accent;
  const soft = isMp4 ? colors.mp4Soft : colors.mp3Soft;

  const confirmDelete = () => {
    Alert.alert(
      'Eliminar archivo',
      `¿Seguro que deseas eliminar "${item.title}" del teléfono?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => onDelete(item),
        },
      ],
    );
  };

  return (
    <View style={styles.card}>
      <Pressable
        style={({ pressed }) => [
          styles.mainRow,
          pressed && styles.pressed,
        ]}
        onPress={() => onOpen(item)}>
        {item.thumbnail ? (
          <Image
            source={{ uri: item.thumbnail }}
            style={styles.thumb}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumbFallback, { backgroundColor: soft }]}>
            {isMp4 ? (
              <Film size={22} color={accent} />
            ) : (
              <Music size={22} color={accent} />
            )}
          </View>
        )}

        <View style={styles.infoCol}>
          <View style={styles.badgesRow}>
            <View style={[styles.badge, { backgroundColor: soft }]}>
              <Text style={[styles.badgeText, { color: accent }]}>
                {item.format.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.metaSmall}>
              {item.quality === 'best'
                ? 'Máx'
                : isMp4
                ? `${item.quality}p`
                : `${item.quality} kbps`}
            </Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaSmall}>{formatBytes(item.fileSize)}</Text>
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>

          <Text style={styles.folderText} numberOfLines={1}>
            {item.publicFolder} · {formatRelativeDate(item.downloadedAt)}
          </Text>
        </View>
      </Pressable>

      <View style={styles.actionsBar}>
        <Pressable
          style={({ pressed }) => [
            styles.actionBtn,
            styles.actionPlay,
            pressed && styles.pressed,
          ]}
          onPress={() => onOpen(item)}>
          <Play size={14} color="#FFFFFF" />
          <Text style={styles.actionPlayText}>Reproducir</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.iconBtn,
            pressed && styles.pressed,
          ]}
          onPress={() => onShare(item)}>
          <Share2 size={16} color={colors.textPrimary} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.iconBtn,
            styles.iconBtnDanger,
            pressed && styles.pressed,
          ]}
          onPress={confirmDelete}>
          <Trash2 size={16} color="#FDA4AF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  mainRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
  },
  thumbFallback: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
    gap: 4,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  metaSmall: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  metaDot: {
    color: colors.textMuted,
    fontSize: 11,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
  folderText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  actionsBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm + 2,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radius.md,
    paddingVertical: 9,
  },
  actionPlay: {
    backgroundColor: colors.primary,
  },
  actionPlayText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  iconBtn: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  iconBtnDanger: {
    backgroundColor: colors.dangerSoft,
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  pressed: {
    opacity: 0.8,
  },
});

