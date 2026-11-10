export const BROWSER_USER_AGENTS = {
  mobile:
    'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
  desktop:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
} as const;

export interface BrowserBookmark {
  id: string;
  label: string;
  url: string;
  color: string;
}

export const BROWSER_BOOKMARKS: BrowserBookmark[] = [
  {
    id: 'youtube',
    label: 'YouTube',
    url: 'https://m.youtube.com',
    color: '#EF4444',
  },
  {
    id: 'ytmusic',
    label: 'YT Music',
    url: 'https://music.youtube.com',
    color: '#F43F5E',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    url: 'https://www.tiktok.com',
    color: '#2DD4BF',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    url: 'https://www.instagram.com',
    color: '#EC4899',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    url: 'https://m.facebook.com',
    color: '#3B82F6',
  },
  {
    id: 'x',
    label: 'X / Twitter',
    url: 'https://x.com',
    color: '#E2E8F0',
  },
  {
    id: 'soundcloud',
    label: 'SoundCloud',
    url: 'https://soundcloud.com',
    color: '#F97316',
  },
  {
    id: 'google',
    label: 'Google',
    url: 'https://www.google.com',
    color: '#6366F1',
  },
];

