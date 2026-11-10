import { AudioQuality, VideoQuality } from '../../shared/types/media';

export interface QualityDescriptor<T extends string> {
  value: T;
  label: string;
  hint: string;
}

export const VIDEO_QUALITIES: QualityDescriptor<VideoQuality>[] = [
  { value: 'best', label: 'Mejor', hint: 'Máxima disponible' },
  { value: '1080', label: '1080p', hint: 'Full HD' },
  { value: '720', label: '720p', hint: 'HD equilibrada' },
  { value: '480', label: '480p', hint: 'SD rápida' },
  { value: '360', label: '360p', hint: 'Ligera' },
];

export const AUDIO_QUALITIES: QualityDescriptor<AudioQuality>[] = [
  { value: '320', label: '320 kbps', hint: 'Alta fidelidad' },
  { value: '192', label: '192 kbps', hint: 'Estándar recomendada' },
  { value: '128', label: '128 kbps', hint: 'Archivo ligero' },
];

export const SUPPORTED_PLATFORMS = [
  { name: 'YouTube & YT Music', detail: 'Videos, Shorts y pistas de audio' },
  { name: 'TikTok', detail: 'Videos cortos y audios' },
  { name: 'Instagram', detail: 'Reels y publicaciones con video' },
  { name: 'Facebook', detail: 'Videos y Reels públicos' },
  { name: 'X (Twitter)', detail: 'Clips y videos embebidos' },
  { name: 'SoundCloud & Bandcamp', detail: 'Pistas y sets de música' },
  { name: 'Vimeo, Reddit & Twitch', detail: 'VODs y clips públicos' },
  { name: 'Enlaces directos', detail: 'URLs .mp4, .mp3, .m4a, .m3u8' },
];

