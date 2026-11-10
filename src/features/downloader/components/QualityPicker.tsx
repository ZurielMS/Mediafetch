import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  AUDIO_QUALITIES,
  VIDEO_QUALITIES,
} from '../../../core/constants/mediaOptions';
import { colors, radius, spacing } from '../../../core/theme/tokens';
import {
  AudioQuality,
  DownloadFormat,
  VideoQuality,
} from '../../../shared/types/media';

interface QualityPickerProps {
  format: DownloadFormat;
  videoQuality: VideoQuality;
  audioQuality: AudioQuality;
  onSelectVideoQuality: (q: VideoQuality) => void;
  onSelectAudioQuality: (q: AudioQuality) => void;
}

export function QualityPicker({
  format,
  videoQuality,
  audioQuality,
  onSelectVideoQuality,
  onSelectAudioQuality,
}: QualityPickerProps) {
  const isMp4 = format === 'mp4';
  const accentColor = isMp4 ? colors.mp4Accent : colors.mp3Accent;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.sectionLabel}>
        {isMp4 ? 'Calidad de video (MP4)' : 'Bitrate de audio (MP3)'}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}>
        {isMp4
          ? VIDEO_QUALITIES.map(item => {
              const selected = item.value === videoQuality;
              return (
                <Pressable
                  key={item.value}
                  style={[
                    styles.chip,
                    selected && {
                      borderColor: accentColor,
                      backgroundColor: colors.mp4Soft,
                    },
                  ]}
                  onPress={() => onSelectVideoQuality(item.value)}>
                  <Text
                    style={[
                      styles.chipLabel,
                      selected && styles.chipLabelSelected,
                    ]}>
                    {item.label}
                  </Text>
                  <Text style={styles.chipHint}>{item.hint}</Text>
                </Pressable>
              );
            })
          : AUDIO_QUALITIES.map(item => {
              const selected = item.value === audioQuality;
              return (
                <Pressable
                  key={item.value}
                  style={[
                    styles.chip,
                    selected && {
                      borderColor: accentColor,
                      backgroundColor: colors.mp3Soft,
                    },
                  ]}
                  onPress={() => onSelectAudioQuality(item.value)}>
                  <Text
                    style={[
                      styles.chipLabel,
                      selected && styles.chipLabelSelected,
                    ]}>
                    {item.label}
                  </Text>
                  <Text style={styles.chipHint}>{item.hint}</Text>
                </Pressable>
              );
            })}
      </ScrollView>
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
  chipsRow: {
    gap: spacing.sm,
    paddingVertical: 2,
  },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    minWidth: 96,
  },
  chipLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  chipLabelSelected: {
    color: colors.textPrimary,
  },
  chipHint: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
});

