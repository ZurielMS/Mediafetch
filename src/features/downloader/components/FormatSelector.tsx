import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Film, Music } from 'lucide-react-native';
import { colors, radius, spacing } from '../../../core/theme/tokens';
import { DownloadFormat } from '../../../shared/types/media';

interface FormatSelectorProps {
  format: DownloadFormat;
  onSelectFormat: (format: DownloadFormat) => void;
}

export function FormatSelector({
  format,
  onSelectFormat,
}: FormatSelectorProps) {
  const isMp4 = format === 'mp4';
  const isMp3 = format === 'mp3';

  return (
    <View style={styles.wrapper}>
      <Text style={styles.sectionLabel}>Formato de descarga</Text>
      <View style={styles.row}>
        <Pressable
          style={({ pressed }) => [
            styles.optionCard,
            isMp4 && styles.mp4Active,
            pressed && styles.pressed,
          ]}
          onPress={() => onSelectFormat('mp4')}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: isMp4 ? colors.mp4Soft : colors.surfaceElevated },
            ]}>
            <Film
              size={20}
              color={isMp4 ? colors.mp4Accent : colors.textSecondary}
            />
          </View>
          <View style={styles.textCol}>
            <Text style={[styles.optionTitle, isMp4 && styles.activeTitle]}>
              MP4 · Video
            </Text>
            <Text style={styles.optionHint}>Video + audio HD</Text>
          </View>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.optionCard,
            isMp3 && styles.mp3Active,
            pressed && styles.pressed,
          ]}
          onPress={() => onSelectFormat('mp3')}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: isMp3 ? colors.mp3Soft : colors.surfaceElevated },
            ]}>
            <Music
              size={20}
              color={isMp3 ? colors.mp3Accent : colors.textSecondary}
            />
          </View>
          <View style={styles.textCol}>
            <Text style={[styles.optionTitle, isMp3 && styles.activeTitle]}>
              MP3 · Música
            </Text>
            <Text style={styles.optionHint}>Audio extraído</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  optionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
  },
  mp4Active: {
    borderColor: colors.mp4Accent,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  mp3Active: {
    borderColor: colors.mp3Accent,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  pressed: {
    opacity: 0.85,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
  },
  optionTitle: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
  activeTitle: {
    color: colors.textPrimary,
  },
  optionHint: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
});

