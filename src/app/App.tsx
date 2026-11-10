import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { mediaDownloaderBridge } from '../core/native/mediaDownloaderBridge';
import { colors } from '../core/theme/tokens';
import { BrowserScreen } from '../features/browser/screens/BrowserScreen';
import { useDownloader } from '../features/downloader/hooks/useDownloader';
import { DownloaderScreen } from '../features/downloader/screens/DownloaderScreen';
import { useDownloadsLibrary } from '../features/library/hooks/useDownloadsLibrary';
import { LibraryScreen } from '../features/library/screens/LibraryScreen';
import { SettingsScreen } from '../features/settings/screens/SettingsScreen';
import { AppHeader } from '../shared/components/AppHeader';
import { AppTab, BottomTabBar } from '../shared/components/BottomTabBar';
import { ToastBanner, ToastMessage } from '../shared/components/ToastBanner';
import {
  DEFAULT_SETTINGS,
  storageService,
} from '../shared/services/storageService';
import {
  AppSettings,
  DownloadFormat,
  EngineStatus,
  QualityOption,
} from '../shared/types/media';

function MainShell() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<AppTab>('downloader');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [engineStatus, setEngineStatus] = useState<EngineStatus | null>(null);
  const [browserDetectedCount, setBrowserDetectedCount] = useState(0);
  const [browserMounted, setBrowserMounted] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (type: 'success' | 'error' | 'info', text: string) => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      setToast({ id: Date.now(), type, text });
      toastTimerRef.current = setTimeout(() => {
        setToast(null);
      }, 4200);
    },
    [],
  );

  const library = useDownloadsLibrary(showToast);

  const downloader = useDownloader({
    settings,
    onDownloadCompleted: library.addDownloadedItem,
    showToast,
  });

  const refreshEngineStatus = useCallback(async () => {
    try {
      const status = await mediaDownloaderBridge.getEngineStatus();
      setEngineStatus(status);
    } catch {
      setEngineStatus({
        initialized: false,
        ffmpegReady: false,
        ytDlpVersion: 'No disponible',
        error: 'No se pudo consultar el motor nativo.',
      });
    }
  }, []);

  useEffect(() => {
    storageService.loadSettings().then(setSettings);
    refreshEngineStatus();
  }, [refreshEngineStatus]);

  useEffect(() => {
    if (activeTab === 'browser' && !browserMounted) {
      setBrowserMounted(true);
    }
  }, [activeTab, browserMounted]);

  const { applyExtractedUrl, executeDownloadTask } = downloader;

  useEffect(() => {
    let mounted = true;
    mediaDownloaderBridge.consumeInitialSharedUrl().then(shared => {
      if (mounted && shared) {
        setActiveTab('downloader');
        applyExtractedUrl(shared, 'share');
      }
    });

    const unsub = mediaDownloaderBridge.onSharedUrl(({ url }) => {
      if (url) {
        setActiveTab('downloader');
        applyExtractedUrl(url, 'share');
      }
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, [applyExtractedUrl]);

  const handleUpdateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      storageService.saveSettings(next);
      return next;
    });
  }, []);

  const handleUpdateEngine = useCallback(
    async (channel: 'stable' | 'nightly') => {
      try {
        const res = await mediaDownloaderBridge.updateEngine(channel);
        setEngineStatus(prev => ({
          initialized: prev?.initialized ?? true,
          ffmpegReady: prev?.ffmpegReady ?? true,
          ytDlpVersion: res.ytDlpVersion,
          error: null,
        }));
        if (res.status === 'DONE') {
          showToast(
            'success',
            `Motor yt-dlp actualizado a ${res.ytDlpVersion}`,
          );
        } else {
          showToast(
            'info',
            `yt-dlp ya estaba actualizado (${res.ytDlpVersion})`,
          );
        }
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'No se pudo actualizar el motor.';
        showToast('error', msg);
      }
    },
    [showToast],
  );

  const handleClearBrowserSession = useCallback(async () => {
    await mediaDownloaderBridge.clearBrowserSession();
    showToast('info', 'Sesiones y cookies del navegador limpiadas.');
  }, [showToast]);

  const handleStartDownloadFromBrowser = useCallback(
    (payload: {
      url: string;
      title: string;
      format: DownloadFormat;
      quality: QualityOption;
      referer: string;
      userAgent: string;
      headers?: Record<string, string>;
    }) => {
      setActiveTab('downloader');
      showToast('info', 'Descarga iniciada usando la sesión del navegador...');
      executeDownloadTask({
        url: payload.url,
        format: payload.format,
        quality: payload.quality,
        customTitle: payload.title,
        useBrowserCookies: true,
        userAgent: payload.userAgent,
        referer: payload.referer,
        headers: payload.headers,
      });
    },
    [executeDownloadTask, showToast],
  );

  const handleSendUrlFromBrowser = useCallback(
    (url: string) => {
      setActiveTab('downloader');
      applyExtractedUrl(url, 'browser');
    },
    [applyExtractedUrl],
  );

  const handleOpenUri = useCallback(
    async (contentUri: string, mimeType: string) => {
      try {
        await mediaDownloaderBridge.openMediaFile(contentUri, mimeType);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'No se pudo abrir el archivo.';
        showToast('error', msg);
      }
    },
    [showToast],
  );

  const activeDownloadCount = downloader.tasks.filter(
    t =>
      t.phase !== 'completed' &&
      t.phase !== 'error' &&
      t.phase !== 'cancelled',
  ).length;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <AppHeader engineStatus={engineStatus} />
      <ToastBanner toast={toast} onDismiss={() => setToast(null)} />

      <View style={styles.body}>
        {activeTab === 'downloader' && (
          <DownloaderScreen
            urlInput={downloader.urlInput}
            format={downloader.format}
            videoQuality={downloader.videoQuality}
            audioQuality={downloader.audioQuality}
            mediaInfo={downloader.mediaInfo}
            isAnalyzing={downloader.isAnalyzing}
            analyzeError={downloader.analyzeError}
            tasks={downloader.tasks}
            onChangeUrl={downloader.handleUrlChange}
            onPaste={downloader.pasteFromClipboard}
            onClear={downloader.clearUrl}
            onAnalyze={() => downloader.analyzeUrl()}
            onSelectFormat={downloader.setFormat}
            onSelectVideoQuality={downloader.setVideoQuality}
            onSelectAudioQuality={downloader.setAudioQuality}
            onStartDownload={downloader.startDownload}
            onCancelTask={downloader.cancelTask}
            onDismissTask={downloader.dismissTask}
            onOpenFile={handleOpenUri}
          />
        )}

        {browserMounted && (
          <View
            style={[
              styles.keepAliveLayer,
              activeTab !== 'browser' && styles.hiddenLayer,
            ]}>
            <BrowserScreen
              isActiveTab={activeTab === 'browser'}
              settings={settings}
              onStartDownloadFromBrowser={handleStartDownloadFromBrowser}
              onSendUrlToDownloader={handleSendUrlFromBrowser}
              onDetectedCountChange={setBrowserDetectedCount}
              showToast={showToast}
            />
          </View>
        )}

        {activeTab === 'library' && (
          <LibraryScreen
            items={library.items}
            onOpenItem={library.openItem}
            onShareItem={library.shareItem}
            onDeleteItem={library.deleteItem}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen
            settings={settings}
            engineStatus={engineStatus}
            onUpdateSettings={handleUpdateSettings}
            onUpdateEngine={handleUpdateEngine}
            onClearBrowserSession={handleClearBrowserSession}
            onClearHistory={library.clearHistoryOnly}
          />
        )}
      </View>

      <BottomTabBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        libraryCount={library.items.length}
        activeDownloadCount={activeDownloadCount}
        browserDetectedCount={browserDetectedCount}
        bottomInset={insets.bottom}
      />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainShell />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
  },
  keepAliveLayer: {
    flex: 1,
  },
  hiddenLayer: {
    display: 'none',
  },
});
