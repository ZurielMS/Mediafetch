export type DownloadFormat = 'mp4' | 'mp3';

export type VideoQuality = 'best' | '1080' | '720' | '480' | '360';
export type AudioQuality = '320' | '192' | '128';
export type QualityOption = VideoQuality | AudioQuality;

export type DownloadPhase =
  | 'preparing'
  | 'downloading'
  | 'merging'
  | 'converting'
  | 'finalizing'
  | 'saving'
  | 'completed'
  | 'error'
  | 'cancelled';

export interface EngineStatus {
  initialized: boolean;
  ffmpegReady: boolean;
  ytDlpVersion: string;
  error?: string | null;
}

export interface BrowserSessionInfo {
  hasSession: boolean;
  cookieCount: number;
}

export interface DetectedMediaResource {
  id: string;
  url: string;
  kind: 'hls' | 'dash' | 'mp4' | 'mp3' | 'audio' | 'video';
  label: string;
  headers?: Record<string, string>;
  referer?: string;
  detectedAt: number;
}

export interface MediaInfo {
  id: string;
  title: string;
  uploader: string;
  duration: number;
  thumbnail: string;
  extractor: string;
  webpageUrl: string;
  ext: string;
}

export interface DownloadProgressEvent {
  taskId: string;
  progress: number;
  etaSeconds: number;
  statusLine: string;
  phase: DownloadPhase;
}

export interface DownloadResult {
  taskId: string;
  contentUri: string;
  fileName: string;
  publicFolder: string;
  fileSize: number;
  mimeType: string;
  format: DownloadFormat;
}

export interface DownloadTask {
  taskId: string;
  url: string;
  title: string;
  thumbnail?: string;
  format: DownloadFormat;
  quality: QualityOption;
  progress: number;
  etaSeconds: number;
  phase: DownloadPhase;
  statusLine: string;
  errorMessage?: string;
  result?: DownloadResult;
  createdAt: number;
}

export interface DownloadedItem {
  id: string;
  title: string;
  fileName: string;
  format: DownloadFormat;
  quality: QualityOption;
  fileSize: number;
  contentUri: string;
  mimeType: string;
  publicFolder: string;
  sourceUrl: string;
  thumbnail?: string;
  platform: string;
  downloadedAt: number;
}

export interface AppSettings {
  defaultFormat: DownloadFormat;
  defaultVideoQuality: VideoQuality;
  defaultAudioQuality: AudioQuality;
  autoAnalyzeOnPaste: boolean;
  useBrowserCookies: boolean;
  updateChannel: 'stable' | 'nightly';
}

export interface StartDownloadParams {
  url: string;
  format: DownloadFormat;
  quality: QualityOption;
  customTitle?: string | null;
  useBrowserCookies?: boolean;
  userAgent?: string | null;
  referer?: string | null;
  headers?: Record<string, string>;
}
