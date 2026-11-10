/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
  removeItem: jest.fn(async () => undefined),
}));

jest.mock('@react-native-clipboard/clipboard', () => ({
  getString: jest.fn(async () => ''),
  setString: jest.fn(),
}));

jest.mock('lucide-react-native', () => {
  const ReactLib = require('react');
  const IconMock = (props: Record<string, unknown>) =>
    ReactLib.createElement('LucideIcon', props);
  return {
    DownloadCloud: IconMock,
    Download: IconMock,
    FolderHeart: IconMock,
    Settings: IconMock,
    AlertCircle: IconMock,
    CheckCircle2: IconMock,
    Info: IconMock,
    X: IconMock,
    ClipboardPaste: IconMock,
    Link2: IconMock,
    Search: IconMock,
    Clock: IconMock,
    User: IconMock,
    Film: IconMock,
    Music: IconMock,
    ExternalLink: IconMock,
    XCircle: IconMock,
    ArrowDownToLine: IconMock,
    Sparkles: IconMock,
    Play: IconMock,
    Share2: IconMock,
    Trash2: IconMock,
    FolderOpen: IconMock,
    Cpu: IconMock,
    FolderCheck: IconMock,
    RefreshCw: IconMock,
    Globe: IconMock,
    ArrowLeft: IconMock,
    ArrowRight: IconMock,
    Home: IconMock,
    Lock: IconMock,
    Monitor: IconMock,
    RotateCw: IconMock,
    ShieldCheck: IconMock,
    Smartphone: IconMock,
    KeyRound: IconMock,
    Send: IconMock,
  };
});

jest.mock('react-native-webview', () => {
  const ReactLib = require('react');
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) =>
      ReactLib.createElement('WebView', props),
  };
});

jest.mock('react-native-safe-area-context', () => {
  const ReactLib = require('react');
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) =>
      ReactLib.createElement(ReactLib.Fragment, null, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('../src/core/native/mediaDownloaderBridge', () => ({
  mediaDownloaderBridge: {
    getEngineStatus: jest.fn(async () => ({
      initialized: true,
      ffmpegReady: true,
      ytDlpVersion: '2026.01.01',
      error: null,
    })),
    getBrowserSessionInfo: jest.fn(async () => ({
      hasSession: false,
      cookieCount: 0,
    })),
    clearBrowserSession: jest.fn(async () => true),
    consumeInitialSharedUrl: jest.fn(async () => null),
    onDownloadProgress: jest.fn(() => () => {}),
    onSharedUrl: jest.fn(() => () => {}),
  },
}));

test('renders MediaFetch root screen cleanly', async () => {
  await ReactTestRenderer.act(async () => {
    ReactTestRenderer.create(<App />);
  });
}, 15000);
