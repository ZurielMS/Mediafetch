import { useCallback, useEffect, useRef, useState } from 'react';
import Clipboard from '@react-native-clipboard/clipboard';
import { mediaDownloaderBridge } from '../../../core/native/mediaDownloaderBridge';
import { ensureStoragePermissionForLegacyAndroid } from '../../../core/utils/permissions';
import {
  detectPlatform,
  extractUrlFromText,
} from '../../../core/utils/urlUtils';
import {
  AppSettings,
  AudioQuality,
  DownloadFormat,
  DownloadTask,
  DownloadedItem,
  MediaInfo,
  StartDownloadParams,
  VideoQuality,
} from '../../../shared/types/media';

interface UseDownloaderParams {
  settings: AppSettings;
  onDownloadCompleted: (item: DownloadedItem) => void;
  showToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export function useDownloader({
  settings,
  onDownloadCompleted,
  showToast,
}: UseDownloaderParams) {
  const [urlInput, setUrlInput] = useState('');
  const [format, setFormat] = useState<DownloadFormat>(settings.defaultFormat);
  const [videoQuality, setVideoQuality] = useState<VideoQuality>(
    settings.defaultVideoQuality,
  );
  const [audioQuality, setAudioQuality] = useState<AudioQuality>(
    settings.defaultAudioQuality,
  );

  const [mediaInfo, setMediaInfo] = useState<MediaInfo | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<DownloadTask[]>([]);

  const latestAnalyzeRequestRef = useRef(0);
  const defaultsSyncedRef = useRef(false);

  useEffect(() => {
    if (!defaultsSyncedRef.current) {
      setFormat(settings.defaultFormat);
      setVideoQuality(settings.defaultVideoQuality);
      setAudioQuality(settings.defaultAudioQuality);
      defaultsSyncedRef.current = true;
    }
  }, [settings]);

  useEffect(() => {
    const unsubscribe = mediaDownloaderBridge.onDownloadProgress(event => {
      setTasks(prev =>
        prev.map(task => {
          if (task.taskId !== event.taskId) {
            return task;
          }
          if (
            task.phase === 'completed' ||
            task.phase === 'cancelled' ||
            task.phase === 'error'
          ) {
            return task;
          }
          return {
            ...task,
            progress: event.progress,
            etaSeconds: event.etaSeconds,
            statusLine: event.statusLine || task.statusLine,
            phase: event.phase,
          };
        }),
      );
    });
    return unsubscribe;
  }, []);

  const analyzeUrl = useCallback(
    async (explicitUrl?: string) => {
      const target = extractUrlFromText(explicitUrl ?? urlInput);
      if (!target) {
        setAnalyzeError('Pega un enlace válido que empiece con http:// o https://');
        return;
      }

      const requestId = ++latestAnalyzeRequestRef.current;
      setIsAnalyzing(true);
      setAnalyzeError(null);

      try {
        const info = await mediaDownloaderBridge.getMediaInfo(target, {
          useBrowserCookies: settings.useBrowserCookies,
        });
        if (latestAnalyzeRequestRef.current === requestId) {
          setMediaInfo(info);
        }
      } catch (err) {
        if (latestAnalyzeRequestRef.current === requestId) {
          setMediaInfo(null);
          const msg =
            err instanceof Error
              ? err.message
              : 'No se pudo obtener la vista previa del enlace.';
          setAnalyzeError(msg);
        }
      } finally {
        if (latestAnalyzeRequestRef.current === requestId) {
          setIsAnalyzing(false);
        }
      }
    },
    [settings.useBrowserCookies, urlInput],
  );

  const handleUrlChange = useCallback((value: string) => {
    setUrlInput(value);
    setAnalyzeError(null);
    if (!value.trim()) {
      setMediaInfo(null);
      latestAnalyzeRequestRef.current += 1;
    }
  }, []);

  const clearUrl = useCallback(() => {
    latestAnalyzeRequestRef.current += 1;
    setUrlInput('');
    setMediaInfo(null);
    setAnalyzeError(null);
    setIsAnalyzing(false);
  }, []);

  const applyExtractedUrl = useCallback(
    (rawText: string, sourceLabel: 'paste' | 'share' | 'browser') => {
      const extracted = extractUrlFromText(rawText);
      if (!extracted) {
        showToast(
          'error',
          sourceLabel === 'paste'
            ? 'No se detectó un enlace válido en el portapapeles.'
            : 'El texto compartido no contiene un enlace válido.',
        );
        return;
      }
      setUrlInput(extracted);
      setMediaInfo(null);
      setAnalyzeError(null);
      if (settings.autoAnalyzeOnPaste) {
        analyzeUrl(extracted);
      }
    },
    [analyzeUrl, settings.autoAnalyzeOnPaste, showToast],
  );

  const pasteFromClipboard = useCallback(async () => {
    try {
      const text = await Clipboard.getString();
      if (!text || !text.trim()) {
        showToast('info', 'Tu portapapeles está vacío.');
        return;
      }
      applyExtractedUrl(text, 'paste');
    } catch {
      showToast('error', 'No se pudo leer el portapapeles.');
    }
  }, [applyExtractedUrl, showToast]);

  const executeDownloadTask = useCallback(
    async (params: StartDownloadParams) => {
      const cleanUrl = extractUrlFromText(params.url);
      if (!cleanUrl) {
        showToast('error', 'El enlace proporcionado no es válido.');
        return;
      }

      const hasPermission = await ensureStoragePermissionForLegacyAndroid();
      if (!hasPermission) {
        showToast(
          'error',
          'Necesitas conceder permiso de almacenamiento para guardar archivos.',
        );
        return;
      }

      const taskId = `dl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const platform = detectPlatform(params.referer || cleanUrl);
      const initialTitle =
        params.customTitle?.trim() || `Descarga desde ${platform.label}`;

      const newTask: DownloadTask = {
        taskId,
        url: cleanUrl,
        title: initialTitle,
        format: params.format,
        quality: params.quality,
        progress: 0,
        etaSeconds: -1,
        phase: 'preparing',
        statusLine: 'Iniciando descarga...',
        createdAt: Date.now(),
      };

      setTasks(prev => [newTask, ...prev]);

      try {
        const result = await mediaDownloaderBridge.startDownload({
          taskId,
          url: cleanUrl,
          format: params.format,
          quality: params.quality,
          customTitle: params.customTitle ?? null,
          useBrowserCookies:
            params.useBrowserCookies ?? settings.useBrowserCookies,
          userAgent: params.userAgent ?? null,
          referer: params.referer ?? null,
          headers: params.headers,
        });

        const finalTitle =
          result.fileName.replace(/\.(mp4|mp3)$/i, '') || initialTitle;

        setTasks(prev =>
          prev.map(t =>
            t.taskId === taskId
              ? {
                  ...t,
                  title: finalTitle,
                  progress: 100,
                  etaSeconds: 0,
                  phase: 'completed',
                  statusLine: `Guardado en ${result.publicFolder}`,
                  result,
                }
              : t,
          ),
        );

        const savedItem: DownloadedItem = {
          id: taskId,
          title: finalTitle,
          fileName: result.fileName,
          format: result.format,
          quality: params.quality,
          fileSize: result.fileSize,
          contentUri: result.contentUri,
          mimeType: result.mimeType,
          publicFolder: result.publicFolder,
          sourceUrl: cleanUrl,
          platform: platform.label,
          downloadedAt: Date.now(),
        };

        onDownloadCompleted(savedItem);
        showToast(
          'success',
          `${result.format.toUpperCase()} guardado en Descargas: ${result.fileName}`,
        );
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Error al descargar el archivo.';
        const isCancelled = msg.toLowerCase().includes('cancelad');

        setTasks(prev =>
          prev.map(t =>
            t.taskId === taskId
              ? {
                  ...t,
                  phase: isCancelled ? 'cancelled' : 'error',
                  statusLine: isCancelled ? 'Descarga cancelada' : msg,
                  errorMessage: isCancelled ? undefined : msg,
                }
              : t,
          ),
        );

        if (!isCancelled) {
          showToast('error', msg);
        }
      }
    },
    [onDownloadCompleted, settings.useBrowserCookies, showToast],
  );

  const startDownload = useCallback(async () => {
    const cleanUrl = extractUrlFromText(urlInput);
    if (!cleanUrl) {
      showToast('error', 'Primero pega o escribe un enlace válido.');
      return;
    }

    const activeQuality = format === 'mp4' ? videoQuality : audioQuality;
    const previewTitle =
      mediaInfo && extractUrlFromText(mediaInfo.webpageUrl || '') === cleanUrl
        ? mediaInfo.title
        : undefined;

    await executeDownloadTask({
      url: cleanUrl,
      format,
      quality: activeQuality,
      customTitle: previewTitle ?? null,
      useBrowserCookies: settings.useBrowserCookies,
    });
  }, [
    audioQuality,
    executeDownloadTask,
    format,
    mediaInfo,
    settings.useBrowserCookies,
    showToast,
    urlInput,
    videoQuality,
  ]);

  const cancelTask = useCallback(async (taskId: string) => {
    await mediaDownloaderBridge.cancelDownload(taskId);
    setTasks(prev =>
      prev.map(t =>
        t.taskId === taskId
          ? {
              ...t,
              phase: 'cancelled',
              statusLine: 'Cancelando...',
            }
          : t,
      ),
    );
  }, []);

  const dismissTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.taskId !== taskId));
  }, []);

  return {
    urlInput,
    format,
    setFormat,
    videoQuality,
    setVideoQuality,
    audioQuality,
    setAudioQuality,
    mediaInfo,
    isAnalyzing,
    analyzeError,
    tasks,
    handleUrlChange,
    clearUrl,
    pasteFromClipboard,
    applyExtractedUrl,
    analyzeUrl,
    startDownload,
    executeDownloadTask,
    cancelTask,
    dismissTask,
  };
}
