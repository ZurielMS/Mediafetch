import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ArrowDownToLine,
  Film,
  Globe,
  KeyRound,
  Music,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react-native';
import { colors, radius, spacing } from '../../../core/theme/tokens';
import {
  AudioQuality,
  BrowserSessionInfo,
  DetectedMediaResource,
  DownloadFormat,
  QualityOption,
  VideoQuality,
} from '../../../shared/types/media';
import { FormatSelector } from '../../downloader/components/FormatSelector';
import { QualityPicker } from '../../downloader/components/QualityPicker';

interface BrowserDownloadSheetProps {
  visible: boolean;
  pageUrl: string;
  pageTitle: string;
  userAgent: string;
  sessionInfo: BrowserSessionInfo;
  detectedResources: DetectedMediaResource[];
  defaultFormat: DownloadFormat;
  defaultVideoQuality: VideoQuality;
  defaultAudioQuality: AudioQuality;
  onClose: () => void;
  onStartDownload: (payload: {
    url: string;
    title: string;
    format: DownloadFormat;
    quality: QualityOption;
    referer: string;
    userAgent: string;
    headers?: Record<string, string>;
  }) => void;
  onSendUrlToDownloader: (url: string) => void;
}

export function BrowserDownloadSheet({
  visible,
  pageUrl,
  pageTitle,
  userAgent,
  sessionInfo,
  detectedResources,
  defaultFormat,
  defaultVideoQuality,
  defaultAudioQuality,
  onClose,
  onStartDownload,
  onSendUrlToDownloader,
}: BrowserDownloadSheetProps) {
  const [selectedTarget, setSelectedTarget] = useState<'page' | string>('page');
  const [format, setFormat] = useState<DownloadFormat>(defaultFormat);
  const [videoQuality, setVideoQuality] =
    useState<VideoQuality>(defaultVideoQuality);
  const [audioQuality, setAudioQuality] =
    useState<AudioQuality>(defaultAudioQuality);

  useEffect(() => {
    if (visible) {
      setSelectedTarget('page');
      setFormat(defaultFormat);
      setVideoQuality(defaultVideoQuality);
      setAudioQuality(defaultAudioQuality);
    }
  }, [defaultAudioQuality, defaultFormat, defaultVideoQuality, visible]);

  const activeStream =
    selectedTarget === 'page'
      ? null
      : detectedResources.find(item => item.id === selectedTarget) ?? null;

  const targetUrl = activeStream ? activeStream.url : pageUrl;
  const activeQuality = format === 'mp4' ? videoQuality : audioQuality;

  const handleConfirm = () => {
    onStartDownload({
      url: targetUrl,
      title: pageTitle || 'Descarga desde navegador',
      format,
      quality: activeQuality,
      referer: activeStream?.referer || pageUrl,
      userAgent,
      headers: activeStream?.headers,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <ShieldCheck size={18} color={colors.mp3Accent} />
              <Text style={styles.headerTitle}>Descargar con sesión</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            <View style={styles.sessionBanner}>
              <KeyRound size={15} color={colors.primary} />
              <Text style={styles.sessionBannerText}>
                {sessionInfo.hasSession
                  ? `Sesión activa (${sessionInfo.cookieCount} cookies/tokens listos para usar)`
                  : 'Se usará el navegador y User-Agent actual para acceder al video'}
              </Text>
            </View>

            <Text style={styles.sectionLabel}>Qué deseas descargar</Text>

            <Pressable
              style={[
                styles.sourceCard,
                selectedTarget === 'page' && styles.sourceCardActive,
              ]}
              onPress={() => setSelectedTarget('page')}>
              <View style={styles.sourceIcon}>
                <Globe size={18} color={colors.primary} />
              </View>
              <View style={styles.sourceInfo}>
                <Text style={styles.sourceTitle} numberOfLines={1}>
                  Página actual (Recomendado)
                </Text>
                <Text style={styles.sourceSub} numberOfLines={1}>
                  {pageTitle || pageUrl}
                </Text>
              </View>
            </Pressable>

            {detectedResources.length > 0 && (
              <View style={styles.detectedBlock}>
                <Text style={styles.detectedLabel}>
                  Streams / Tokens detectados al navegar ({detectedResources.length})
                </Text>
                {detectedResources.map(res => {
                  const selected = selectedTarget === res.id;
                  const isAudio = res.kind === 'mp3' || res.kind === 'audio';
                  return (
                    <Pressable
                      key={res.id}
                      style={[
                        styles.sourceCard,
                        selected && styles.sourceCardActive,
                      ]}
                      onPress={() => {
                        setSelectedTarget(res.id);
                        if (isAudio) {
                          setFormat('mp3');
                        }
                      }}>
                      <View style={styles.sourceIcon}>
                        {isAudio ? (
                          <Music size={17} color={colors.mp3Accent} />
                        ) : (
                          <Film size={17} color={colors.mp4Accent} />
                        )}
                      </View>
                      <View style={styles.sourceInfo}>
                        <View style={styles.kindRow}>
                          <View style={styles.kindBadge}>
                            <Text style={styles.kindText}>
                              {res.kind.toUpperCase()}
                            </Text>
                          </View>
                          {res.headers && Object.keys(res.headers).length > 0 && (
                            <View style={styles.tokenBadge}>
                              <Text style={styles.tokenText}>CON TOKEN</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.sourceSub} numberOfLines={1}>
                          {res.url}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <FormatSelector format={format} onSelectFormat={setFormat} />

            <QualityPicker
              format={format}
              videoQuality={videoQuality}
              audioQuality={audioQuality}
              onSelectVideoQuality={setVideoQuality}
              onSelectAudioQuality={setAudioQuality}
            />

            <Pressable
              style={({ pressed }) => [
                styles.primaryCta,
                {
                  backgroundColor:
                    format === 'mp4' ? colors.primary : colors.mp3Accent,
                },
                pressed && styles.pressed,
              ]}
              onPress={handleConfirm}>
              <ArrowDownToLine size={18} color="#FFFFFF" />
              <Text style={styles.primaryCtaText}>
                Descargar {format.toUpperCase()} en Descargas
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.secondaryCta,
                pressed && styles.pressed,
              ]}
              onPress={() => {
                onSendUrlToDownloader(targetUrl);
                onClose();
              }}>
              <Send size={15} color={colors.textPrimary} />
              <Text style={styles.secondaryCtaText}>
                Enviar enlace a pestaña Descargar
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 12, 0.72)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
    maxHeight: '86%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md + 2,
    paddingBottom: spacing.xxl,
  },
  sessionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  sessionBannerText: {
    flex: 1,
    color: '#C7D2FE',
    fontSize: 12,
    lineHeight: 17,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  detectedBlock: {
    gap: spacing.sm,
  },
  detectedLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
  },
  sourceCardActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  sourceIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceInfo: {
    flex: 1,
    gap: 3,
  },
  sourceTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  sourceSub: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  kindRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kindBadge: {
    backgroundColor: colors.mp4Soft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  kindText: {
    color: colors.mp4Accent,
    fontSize: 10,
    fontWeight: '700',
  },
  tokenBadge: {
    backgroundColor: colors.mp3Soft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  tokenText: {
    color: colors.mp3Accent,
    fontSize: 10,
    fontWeight: '700',
  },
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    paddingVertical: 14,
    marginTop: spacing.xs,
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    paddingVertical: 11,
  },
  secondaryCtaText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.85,
  },
});

