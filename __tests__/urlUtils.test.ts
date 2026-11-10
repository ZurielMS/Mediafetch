import {
  detectPlatform,
  extractUrlFromText,
  formatBytes,
  formatDuration,
  isValidMediaUrl,
  normalizeBrowserInput,
} from '../src/core/utils/urlUtils';

describe('urlUtils', () => {
  test('extracts URL from shared social text', () => {
    const raw = 'Escucha esta canción increíble https://youtu.be/dQw4w9WgXcQ?si=123';
    expect(extractUrlFromText(raw)).toBe(
      'https://youtu.be/dQw4w9WgXcQ?si=123',
    );
  });

  test('rejects invalid non-http text', () => {
    expect(extractUrlFromText('hola mundo')).toBeNull();
    expect(isValidMediaUrl('ftp://example.com/file.mp4')).toBe(false);
  });

  test('detects common platforms accurately', () => {
    expect(detectPlatform('https://www.youtube.com/watch?v=abc').label).toBe(
      'YouTube',
    );
    expect(detectPlatform('https://music.youtube.com/watch?v=abc').label).toBe(
      'YouTube Music',
    );
    expect(detectPlatform('https://vm.tiktok.com/ZM123/').label).toBe('TikTok');
    expect(detectPlatform('https://cdn.site.com/song.mp3').label).toBe(
      'Enlace directo',
    );
  });

  test('formats duration and byte sizes cleanly', () => {
    expect(formatDuration(125)).toBe('2:05');
    expect(formatDuration(3661)).toBe('1:01:01');
    expect(formatBytes(1024 * 1024 * 12.5)).toBe('12.5 MB');
  });

  test('normalizes browser addresses and search terms', () => {
    expect(normalizeBrowserInput('https://youtube.com')).toBe(
      'https://youtube.com',
    );
    expect(normalizeBrowserInput('vimeo.com/channels')).toBe(
      'https://vimeo.com/channels',
    );
    expect(normalizeBrowserInput('lofi hip hop')).toBe(
      'https://www.google.com/search?q=lofi%20hip%20hop',
    );
    expect(normalizeBrowserInput('   ')).toBe('');
  });
});

