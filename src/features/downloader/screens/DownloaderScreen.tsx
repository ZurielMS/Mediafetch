import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowDownToLine, Sparkles } from 'lucide-react-native';
import { colors, radius, spacing } from '../../../core/theme/tokens';
import { isValidMediaUrl } from '../../../core/utils/urlUtils';
import {
  AudioQuality,
  DownloadFormat,
  DownloadTask,
  MediaInfo,
  VideoQuality,
} from '../../../shared/types/media';
import { ActiveDownloadCard } from '../components/ActiveDownloadCard';
import { FormatSelector } from '../components/FormatSelector';
import { MediaPreviewCard } from '../components/MediaPreviewCard';
import { QualityPicker } from '../components/QualityPicker';
import { UrlInputCard } from '../components/UrlInputCard';

interface DownloaderScreenProps {
  urlInput: string;
  format: DownloadFormat;
  videoQuality: VideoQuality;
  audioQuality: AudioQuality;
  mediaInfo: MediaInfo | null;
  isAnalyzing: boolean;
  analyzeError: string | null;
  tasks: DownloadTask[];
  onChangeUrl: (val: string) => void;
  onPaste: () => void;
  onClear: () => void;
  onAnalyze: () => void;
  onSelectFormat: (fmt: DownloadFormat) => void;
  onSelectVideoQuality: (q: VideoQuality) => void;
  onSelectAudioQuality: (q: AudioQuality) => void;
  onStartDownload: () => void;
  onCancelTask: (taskId: string) => void;
  onDismissTask: (taskId: string) => void;
  onOpenFile: (contentUri: string, mimeType: string) => void;
}

export function DownloaderScreen({
  urlInput,
  format,
  videoQuality,
  audioQuality,
  mediaInfo,
  isAnalyzing,
  analyzeError,
  tasks,
  onChangeUrl,
  onPaste,
  onClear,
  onAnalyze,
  onSelectFormat,
  onSelectVideoQuality,
  onSelectAudioQuality,
  onStartDownload,
  onCancelTask,
  onDismissTask,
  onOpenFile,
}: DownloaderScreenProps) {
  const canDownload = isValidMediaUrl(urlInput);
  const isMp4 = format === 'mp4';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <UrlInputCard
        url={urlInput}
        onChangeUrl={onChangeUrl}
        onPaste={onPaste}
        onClear={onClear}
        onAnalyze={onAnalyze}
        isAnalyzing={isAnalyzing}
        analyzeError={analyzeError}
      />

      {mediaInfo && <MediaPreviewCard info={mediaInfo} />}

      <FormatSelector format={format} onSelectFormat={onSelectFormat} />

      <QualityPicker
        format={format}
        videoQuality={videoQuality}
        audioQuality={audioQuality}
        onSelectVideoQuality={onSelectVideoQuality}
        onSelectAudioQuality={onSelectAudioQuality}
      />

      <Pressable
        style={({ pressed }) => [
          styles.downloadCta,
          {
            backgroundColor: isMp4 ? colors.primary : colors.mp3Accent,
          },
          !canDownload && styles.ctaDisabled,
          pressed && canDownload && styles.ctaPressed,
        ]}
        disabled={!canDownload}
        onPress={onStartDownload}>
        <ArrowDownToLine size={20} color="#FFFFFF" strokeWidth={2.3} />
        <Text style={styles.downloadCtaText}>
          {isMp4
            ? `Descargar Video MP4 (${
                videoQuality === 'best' ? 'Máx' : `${videoQuality}p`
              })`
            : `Descargar Música MP3 (${audioQuality} kbps)`}
        </Text>
      </Pressable>

      {tasks.length === 0 ? (
        <View style={styles.tipBox}>
          <Sparkles size={16} color={colors.primary} />
          <Text style={styles.tipText}>
            Tip: También puedes usar el botón "Compartir" de YouTube, TikTok o
            Instagram y elegir MediaFetch para llenar el enlace al instante.
          </Text>
        </View>
      ) : (
        <View style={styles.queueSection}>
          <Text style={styles.queueHeader}>
            Descargas recientes ({tasks.length})
          </Text>
          {tasks.map(task => (
            <ActiveDownloadCard
              key={task.taskId}
              task={task}
              onCancel={onCancelTask}
              onDismiss={onDismissTask}
              onOpenResult={onOpenFile}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  downloadCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    paddingVertical: 15,
  },
  ctaDisabled: {
    opacity: 0.4,
  },
  ctaPressed: {
    opacity: 0.88,
  },
  downloadCtaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + 2,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  tipText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  queueSection: {
    gap: spacing.sm + 2,
  },
  queueHeader: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});

