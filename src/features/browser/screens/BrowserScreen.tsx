import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import WebView, {
  FileDownload,
  WebViewMessageEvent,
  WebViewNavigation,
} from 'react-native-webview';
import {
  ArrowLeft,
  ArrowRight,
  Download,
  Globe,
  Home,
  Lock,
  Monitor,
  RotateCw,
  ShieldCheck,
  Smartphone,
  Trash2,
} from 'lucide-react-native';
import { mediaDownloaderBridge } from '../../../core/native/mediaDownloaderBridge';
import { colors, radius, spacing } from '../../../core/theme/tokens';
import { normalizeBrowserInput } from '../../../core/utils/urlUtils';
import {
  AppSettings,
  BrowserSessionInfo,
  DetectedMediaResource,
  DownloadFormat,
  QualityOption,
} from '../../../shared/types/media';
import { BrowserDownloadSheet } from '../components/BrowserDownloadSheet';
import {
  BROWSER_BOOKMARKS,
  BROWSER_USER_AGENTS,
} from '../constants/bookmarks';
import { INJECTED_MEDIA_SNIFFER_JS } from '../utils/mediaSnifferScript';

interface BrowserScreenProps {
  isActiveTab: boolean;
  settings: AppSettings;
  onStartDownloadFromBrowser: (payload: {
    url: string;
    title: string;
    format: DownloadFormat;
    quality: QualityOption;
    referer: string;
    userAgent: string;
    headers?: Record<string, string>;
  }) => void;
  onSendUrlToDownloader: (url: string) => void;
  onDetectedCountChange: (count: number) => void;
  showToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export function BrowserScreen({
  isActiveTab,
  settings,
  onStartDownloadFromBrowser,
  onSendUrlToDownloader,
  onDetectedCountChange,
  showToast,
}: BrowserScreenProps) {
  const webViewRef = useRef<WebView<unknown> | null>(null);

  const [sourceUri, setSourceUri] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [addressInput, setAddressInput] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [desktopMode, setDesktopMode] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<BrowserSessionInfo>({
    hasSession: false,
    cookieCount: 0,
  });
  const [detectedResources, setDetectedResources] = useState<
    DetectedMediaResource[]
  >([]);
  const [sheetVisible, setSheetVisible] = useState(false);
  const prevDesktopModeRef = useRef(desktopMode);

  const activeUserAgent = desktopMode
    ? BROWSER_USER_AGENTS.desktop
    : BROWSER_USER_AGENTS.mobile;

  const webViewSource = useMemo(
    () => (sourceUri ? { uri: sourceUri } : undefined),
    [sourceUri],
  );

  useEffect(() => {
    onDetectedCountChange(detectedResources.length);
  }, [detectedResources.length, onDetectedCountChange]);

  useEffect(() => {
    if (prevDesktopModeRef.current !== desktopMode) {
      prevDesktopModeRef.current = desktopMode;
      if (sourceUri) {
        webViewRef.current?.reload();
      }
    }
  }, [desktopMode, sourceUri]);

  const refreshSessionInfo = useCallback(async (urlToCheck: string | null) => {
    if (!urlToCheck) {
      setSessionInfo({ hasSession: false, cookieCount: 0 });
      return;
    }
    try {
      const info = await mediaDownloaderBridge.getBrowserSessionInfo(urlToCheck);
      setSessionInfo(info);
    } catch {
      setSessionInfo({ hasSession: false, cookieCount: 0 });
    }
  }, []);

  useEffect(() => {
    if (!isActiveTab || !sourceUri) {
      return undefined;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      setSourceUri(null);
      setCurrentUrl(null);
      setAddressInput('');
      setDetectedResources([]);
      return true;
    });
    return () => sub.remove();
  }, [canGoBack, isActiveTab, sourceUri]);

  const navigateTo = useCallback(
    (rawInput: string) => {
      const normalized = normalizeBrowserInput(rawInput);
      if (!normalized) {
        return;
      }
      setDetectedResources([]);
      setAddressInput(normalized);
      setCurrentUrl(normalized);
      if (normalized === sourceUri) {
        webViewRef.current?.reload();
      } else {
        setSourceUri(normalized);
      }
    },
    [sourceUri],
  );

  const handleGoHome = useCallback(() => {
    setSourceUri(null);
    setCurrentUrl(null);
    setAddressInput('');
    setPageTitle('');
    setCanGoBack(false);
    setCanGoForward(false);
    setDetectedResources([]);
    setSessionInfo({ hasSession: false, cookieCount: 0 });
  }, []);

  const handleClearSession = useCallback(() => {
    Alert.alert(
      'Cerrar sesiones del navegador',
      'Se eliminarán todas las cookies y tokens guardados en el navegador integrado.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            await mediaDownloaderBridge.clearBrowserSession();
            setSessionInfo({ hasSession: false, cookieCount: 0 });
            if (webViewRef.current) {
              webViewRef.current.reload();
            }
            showToast('info', 'Sesiones y cookies del navegador limpiadas.');
          },
        },
      ],
    );
  }, [showToast]);

  const handleWebViewMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const parsed = JSON.parse(event.nativeEvent.data);
        if (parsed?.type !== 'MEDIA_DETECTED' || !parsed?.payload?.url) {
          return;
        }
        const mediaUrl = String(parsed.payload.url);
        const kind = (parsed.payload.kind || 'video') as DetectedMediaResource['kind'];
        const headers = parsed.payload.headers as Record<string, string> | undefined;
        const referer = parsed.payload.referer
          ? String(parsed.payload.referer)
          : currentUrl || undefined;

        setDetectedResources(prev => {
          const exists = prev.findIndex(item => item.url === mediaUrl);
          if (exists !== -1) {
            if (headers) {
              const updated = [...prev];
              updated[exists] = { ...updated[exists], headers };
              return updated;
            }
            return prev;
          }
          const newEntry: DetectedMediaResource = {
            id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            url: mediaUrl,
            kind,
            label: kind.toUpperCase(),
            headers,
            referer,
            detectedAt: Date.now(),
          };
          return [newEntry, ...prev].slice(0, 20);
        });
      } catch {
        // Ignore unrelated page messages
      }
    },
    [currentUrl],
  );

  const handleFileDownload = useCallback(
    ({ nativeEvent }: { nativeEvent: FileDownload }) => {
      const downloadUrl = nativeEvent?.downloadUrl;
      if (!downloadUrl) {
        return;
      }
      setDetectedResources(prev => {
        if (prev.some(i => i.url === downloadUrl)) {
          return prev;
        }
        return [
          {
            id: `dlbtn_${Date.now()}`,
            url: downloadUrl,
            kind: downloadUrl.toLowerCase().includes('.mp3') ? 'mp3' : 'mp4',
            label: 'DESCARGA',
            referer: currentUrl || undefined,
            detectedAt: Date.now(),
          },
          ...prev,
        ];
      });
      setSheetVisible(true);
    },
    [currentUrl],
  );

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.navButtons}>
          <Pressable
            style={[styles.navBtn, !canGoBack && styles.navBtnDisabled]}
            disabled={!canGoBack}
            onPress={() => webViewRef.current?.goBack()}>
            <ArrowLeft size={18} color={colors.textPrimary} />
          </Pressable>
          <Pressable
            style={[styles.navBtn, !canGoForward && styles.navBtnDisabled]}
            disabled={!canGoForward}
            onPress={() => webViewRef.current?.goForward()}>
            <ArrowRight size={18} color={colors.textPrimary} />
          </Pressable>
        </View>

        <View style={styles.addressBox}>
          {currentUrl?.startsWith('https://') ? (
            <Lock size={13} color={colors.mp3Accent} />
          ) : (
            <Globe size={13} color={colors.textMuted} />
          )}
          <TextInput
            style={styles.addressInput}
            value={addressInput}
            onChangeText={setAddressInput}
            placeholder="Buscar o escribir URL (ej. youtube.com)"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            selectTextOnFocus
            onSubmitEditing={() => navigateTo(addressInput)}
            selectionColor={colors.primary}
          />
          {currentUrl ? (
            <Pressable
              onPress={() => webViewRef.current?.reload()}
              hitSlop={6}>
              <RotateCw size={15} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          style={styles.navBtn}
          onPress={() => setDesktopMode(prev => !prev)}
          accessibilityLabel="Modo escritorio">
          {desktopMode ? (
            <Monitor size={18} color={colors.primary} />
          ) : (
            <Smartphone size={18} color={colors.textSecondary} />
          )}
        </Pressable>

        <Pressable style={styles.navBtn} onPress={handleGoHome}>
          <Home size={18} color={colors.textSecondary} />
        </Pressable>
      </View>

      {isLoading && loadProgress > 0 && loadProgress < 1 && (
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.round(loadProgress * 100)}%` },
            ]}
          />
        </View>
      )}

      <View style={styles.sessionBar}>
        <View style={styles.sessionLeft}>
          <ShieldCheck
            size={14}
            color={sessionInfo.hasSession ? colors.mp3Accent : colors.textMuted}
          />
          <Text style={styles.sessionText} numberOfLines={1}>
            {currentUrl
              ? sessionInfo.hasSession
                ? `Sesión activa · ${sessionInfo.cookieCount} cookies/tokens capturados`
                : 'Inicia sesión o reproduce el video para capturar tokens'
              : 'Abre una web e inicia sesión para usar sus cookies y tokens'}
          </Text>
        </View>

        <Pressable onPress={handleClearSession} hitSlop={8}>
          <Trash2 size={14} color={colors.textMuted} />
        </Pressable>
      </View>

      {!webViewSource ? (
        <ScrollView contentContainerStyle={styles.homeContainer}>
          <Text style={styles.homeTitle}>Acceso rápido</Text>
          <Text style={styles.homeSubtitle}>
            Inicia sesión en cualquier página web. MediaFetch compartirá
            automáticamente tus cookies y tokens con el descargador de MP4/MP3.
          </Text>

          <View style={styles.bookmarksGrid}>
            {BROWSER_BOOKMARKS.map(bm => (
              <Pressable
                key={bm.id}
                style={({ pressed }) => [
                  styles.bookmarkCard,
                  pressed && styles.pressed,
                ]}
                onPress={() => navigateTo(bm.url)}>
                <View
                  style={[
                    styles.bookmarkDot,
                    { backgroundColor: `${bm.color}28` },
                  ]}>
                  <Globe size={20} color={bm.color} />
                </View>
                <Text style={styles.bookmarkLabel}>{bm.label}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.webWrap}>
          <WebView<unknown>
            ref={webViewRef}
            source={webViewSource}
            userAgent={activeUserAgent}
            javaScriptEnabled
            javaScriptCanOpenWindowsAutomatically
            setSupportMultipleWindows={false}
            domStorageEnabled
            thirdPartyCookiesEnabled
            sharedCookiesEnabled
            mediaPlaybackRequiresUserAction={false}
            allowsFullscreenVideo
            injectedJavaScriptBeforeContentLoaded={INJECTED_MEDIA_SNIFFER_JS}
            onMessage={handleWebViewMessage}
            onFileDownload={handleFileDownload}
            onLoadProgress={({ nativeEvent }) =>
              setLoadProgress(nativeEvent.progress)
            }
            onNavigationStateChange={(navState: WebViewNavigation) => {
              setCanGoBack(navState.canGoBack);
              setCanGoForward(navState.canGoForward);
              setIsLoading(navState.loading);
              if (navState.url && navState.url !== 'about:blank') {
                setCurrentUrl(navState.url);
                setAddressInput(navState.url);
                refreshSessionInfo(navState.url);
              }
              if (navState.title) {
                setPageTitle(navState.title);
              }
            }}
            onLoadEnd={() => {
              setIsLoading(false);
              refreshSessionInfo(currentUrl);
            }}
            style={styles.webview}
          />

          <View pointerEvents="box-none" style={styles.floatingBar}>
            <Pressable
              style={({ pressed }) => [
                styles.downloadFab,
                pressed && styles.pressed,
              ]}
              onPress={() => {
                refreshSessionInfo(currentUrl);
                setSheetVisible(true);
              }}>
              <Download size={18} color="#FFFFFF" />
              <Text style={styles.downloadFabText}>
                {detectedResources.length > 0
                  ? `Descargar (${detectedResources.length} detectados)`
                  : 'Descargar página / video'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {currentUrl && (
        <BrowserDownloadSheet
          visible={sheetVisible}
          pageUrl={currentUrl}
          pageTitle={pageTitle}
          userAgent={activeUserAgent}
          sessionInfo={sessionInfo}
          detectedResources={detectedResources}
          defaultFormat={settings.defaultFormat}
          defaultVideoQuality={settings.defaultVideoQuality}
          defaultAudioQuality={settings.defaultAudioQuality}
          onClose={() => setSheetVisible(false)}
          onStartDownload={onStartDownloadFromBrowser}
          onSendUrlToDownloader={onSendUrlToDownloader}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  navButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  navBtn: {
    width: 34,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  addressBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm + 2,
    height: 38,
  },
  addressInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    paddingVertical: 0,
  },
  progressTrack: {
    height: 2,
    backgroundColor: colors.surface,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  sessionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: 6,
    backgroundColor: colors.surfaceMuted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sessionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 11,
  },
  homeContainer: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  homeTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  homeSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  bookmarksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  bookmarkCard: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  bookmarkDot: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  webWrap: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  floatingBar: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    left: spacing.lg,
    alignItems: 'flex-end',
  },
  downloadFab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: radius.full,
    elevation: 6,
  },
  downloadFabText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
});
