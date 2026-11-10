export interface PlatformInfo {
  id: string;
  label: string;
  color: string;
}

const URL_REGEX = /https?:\/\/[^\s<>"')\]}]+/i;

export function extractUrlFromText(raw: string): string | null {
  if (!raw) {
    return null;
  }
  const trimmed = raw.trim();
  const match = trimmed.match(URL_REGEX);
  if (!match) {
    return null;
  }
  try {
    const parsed = new URL(match[0]);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function isValidMediaUrl(url: string): boolean {
  return extractUrlFromText(url) !== null;
}

export function normalizeBrowserInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return '';
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (/^[^\s]+\.[^\s]{2,}(\/.*)?$/i.test(trimmed) && !trimmed.includes(' ')) {
    return `https://${trimmed}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
}

export function detectPlatform(url: string): PlatformInfo {
  const lower = url.toLowerCase();
  if (lower.includes('music.youtube.com')) {
    return { id: 'ytmusic', label: 'YouTube Music', color: '#EF4444' };
  }
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    return { id: 'youtube', label: 'YouTube', color: '#EF4444' };
  }
  if (lower.includes('tiktok.com')) {
    return { id: 'tiktok', label: 'TikTok', color: '#2DD4BF' };
  }
  if (lower.includes('instagram.com')) {
    return { id: 'instagram', label: 'Instagram', color: '#EC4899' };
  }
  if (lower.includes('facebook.com') || lower.includes('fb.watch')) {
    return { id: 'facebook', label: 'Facebook', color: '#3B82F6' };
  }
  if (lower.includes('twitter.com') || lower.includes('x.com')) {
    return { id: 'x', label: 'X / Twitter', color: '#E2E8F0' };
  }
  if (lower.includes('soundcloud.com')) {
    return { id: 'soundcloud', label: 'SoundCloud', color: '#F97316' };
  }
  if (lower.includes('vimeo.com')) {
    return { id: 'vimeo', label: 'Vimeo', color: '#38BDF8' };
  }
  if (lower.includes('twitch.tv')) {
    return { id: 'twitch', label: 'Twitch', color: '#A855F7' };
  }
  if (lower.includes('reddit.com') || lower.includes('redd.it')) {
    return { id: 'reddit', label: 'Reddit', color: '#FB7185' };
  }
  if (/\.(mp4|mp3|m4a|webm|mkv|m3u8)(\?|$)/i.test(lower)) {
    return { id: 'direct', label: 'Enlace directo', color: '#10B981' };
  }
  return { id: 'web', label: 'Enlace web', color: '#6366F1' };
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '--:--';
  }
  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (hrs > 0) {
    return `${hrs}:${pad(mins)}:${pad(secs)}`;
  }
  return `${mins}:${pad(secs)}`;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  let idx = 0;
  let value = bytes;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value >= 10 || idx === 0 ? value.toFixed(1) : value.toFixed(2)} ${units[idx]}`;
}

export function formatEta(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '';
  }
  if (seconds < 60) {
    return `${Math.round(seconds)}s restantes`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s restantes`;
}

export function formatRelativeDate(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) {
    return 'Hace un momento';
  }
  if (diffMin < 60) {
    return `Hace ${diffMin} min`;
  }
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return `Hace ${diffHours} h`;
  }
  return new Date(timestamp).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
  });
}

