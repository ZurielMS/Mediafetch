import { NativeEventEmitter, NativeModules } from 'react-native';
import {
  BrowserSessionInfo,
  DownloadFormat,
  DownloadProgressEvent,
  DownloadResult,
  EngineStatus,
  MediaInfo,
  QualityOption,
} from '../../shared/types/media';

interface NativeMediaDownloaderInterface {
  getEngineStatus(): Promise<EngineStatus>;
  updateEngine(channel: 'stable' | 'nightly'): Promise<{ status: string; ytDlpVersion: string }>;
  getBrowserSessionInfo(url: string): Promise<BrowserSessionInfo>;
  clearBrowserSession(): Promise<boolean>;
  getMediaInfo(url: string): Promise<MediaInfo>;
  getMediaInfoWithSession(options: {
    url: string;
    useBrowserCookies?: boolean;
    userAgent?: string | null;
    referer?: string | null;
  }): Promise<MediaInfo>;
  startDownload(options: {
    taskId: string;
    url: string;
    format: DownloadFormat;
    quality: QualityOption;
    customTitle?: string | null;
    useBrowserCookies?: boolean;
    userAgent?: string | null;
    referer?: string | null;
    headers?: Record<string, string>;
  }): Promise<DownloadResult>;
  cancelDownload(taskId: string): Promise<boolean>;
  openMediaFile(contentUri: string, mimeType: string): Promise<boolean>;
  shareMediaFile(contentUri: string, mimeType: string, title: string): Promise<boolean>;
  deleteMediaFile(contentUri: string): Promise<boolean>;
  fileExists(contentUri: string): Promise<boolean>;
  consumeInitialSharedUrl(): Promise<string | null>;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

const nativeModule: NativeMediaDownloaderInterface | undefined =
  NativeModules.MediaDownloader;

const emitter = nativeModule ? new NativeEventEmitter(nativeModule as never) : null;

function requireModule(): NativeMediaDownloaderInterface {
  if (!nativeModule) {
    throw new Error(
      'El módulo nativo MediaDownloader no está disponible. Compila el proyecto Android con Gradle.',
    );
  }
  return nativeModule;
}

export const mediaDownloaderBridge = {
  getEngineStatus(): Promise<EngineStatus> {
    return requireModule().getEngineStatus();
  },

  updateEngine(channel: 'stable' | 'nightly') {
    return requireModule().updateEngine(channel);
  },

  getBrowserSessionInfo(url: string): Promise<BrowserSessionInfo> {
    if (!nativeModule) {
      return Promise.resolve({ hasSession: false, cookieCount: 0 });
    }
    return nativeModule.getBrowserSessionInfo(url);
  },

  clearBrowserSession(): Promise<boolean> {
    return requireModule().clearBrowserSession();
  },

  getMediaInfo(
    url: string,
    session?: {
      useBrowserCookies?: boolean;
      userAgent?: string | null;
      referer?: string | null;
    },
  ): Promise<MediaInfo> {
    if (session) {
      return requireModule().getMediaInfoWithSession({
        url,
        useBrowserCookies: session.useBrowserCookies ?? true,
        userAgent: session.userAgent ?? null,
        referer: session.referer ?? null,
      });
    }
    return requireModule().getMediaInfo(url);
  },

  startDownload(options: {
    taskId: string;
    url: string;
    format: DownloadFormat;
    quality: QualityOption;
    customTitle?: string | null;
    useBrowserCookies?: boolean;
    userAgent?: string | null;
    referer?: string | null;
    headers?: Record<string, string>;
  }): Promise<DownloadResult> {
    return requireModule().startDownload(options);
  },

  cancelDownload(taskId: string): Promise<boolean> {
    return requireModule().cancelDownload(taskId);
  },

  openMediaFile(contentUri: string, mimeType: string): Promise<boolean> {
    return requireModule().openMediaFile(contentUri, mimeType);
  },

  shareMediaFile(contentUri: string, mimeType: string, title: string): Promise<boolean> {
    return requireModule().shareMediaFile(contentUri, mimeType, title);
  },

  deleteMediaFile(contentUri: string): Promise<boolean> {
    return requireModule().deleteMediaFile(contentUri);
  },

  fileExists(contentUri: string): Promise<boolean> {
    return requireModule().fileExists(contentUri);
  },

  consumeInitialSharedUrl(): Promise<string | null> {
    if (!nativeModule) {
      return Promise.resolve(null);
    }
    return nativeModule.consumeInitialSharedUrl();
  },

  onDownloadProgress(listener: (event: DownloadProgressEvent) => void): () => void {
    if (!emitter) {
      return () => {};
    }
    const sub = emitter.addListener('onDownloadProgress', event =>
      listener(event as unknown as DownloadProgressEvent),
    );
    return () => sub.remove();
  },

  onSharedUrl(listener: (payload: { url: string }) => void): () => void {
    if (!emitter) {
      return () => {};
    }
    const sub = emitter.addListener('onSharedUrl', payload =>
      listener(payload as unknown as { url: string }),
    );
    return () => sub.remove();
  },
};
