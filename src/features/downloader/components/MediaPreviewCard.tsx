import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Clock, User } from 'lucide-react-native';
import { colors, radius, spacing } from '../../../core/theme/tokens';
import { formatDuration } from '../../../core/utils/urlUtils';
import { MediaInfo } from '../../../shared/types/media';

interface MediaPreviewCardProps {
  info: MediaInfo;
}

export function MediaPreviewCard({ info }: MediaPreviewCardProps) {
  return (
    <View style={styles.card}>
      {info.thumbnail ? (
        <Image
          source={{ uri: info.thumbnail }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.thumbnailFallback}>
          <Text style={styles.fallbackText}>MEDIA</Text>
        </View>
      )}

      <View style={styles.metaCol}>
        {info.extractor ? (
          <View style={styles.extractorPill}>
            <Text style={styles.extractorText}>{info.extractor}</Text>
          </View>
        ) : null}

        <Text style={styles.title} numberOfLines={2}>
          {info.title}
        </Text>

        <View style={styles.detailsRow}>
          {info.uploader ? (
            <View style={styles.detailChip}>
              <User size={12} color={colors.textSecondary} />
              <Text style={styles.detailText} numberOfLines={1}>
                {info.uploader}
              </Text>
            </View>
          ) : null}

          {info.duration > 0 ? (
            <View style={styles.detailChip}>
              <Clock size={12} color={colors.textSecondary} />
              <Text style={styles.detailText}>
                {formatDuration(info.duration)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    alignItems: 'center',
  },
  thumbnail: {
    width: 112,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
  },
  thumbnailFallback: {
    width: 112,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  metaCol: {
    flex: 1,
    gap: 6,
  },
  extractorPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  extractorText: {
    color: '#A5B4FC',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 140,
  },
  detailText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});

