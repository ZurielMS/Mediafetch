import { useCallback, useEffect, useState } from 'react';
import { mediaDownloaderBridge } from '../../../core/native/mediaDownloaderBridge';
import { storageService } from '../../../shared/services/storageService';
import { DownloadedItem } from '../../../shared/types/media';

export function useDownloadsLibrary(
  showToast: (type: 'success' | 'error' | 'info', text: string) => void,
) {
  const [items, setItems] = useState<DownloadedItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    storageService.loadHistory().then(loaded => {
      if (active) {
        setItems(loaded);
        setIsLoaded(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const addDownloadedItem = useCallback((item: DownloadedItem) => {
    setItems(prev => {
      const next = [item, ...prev];
      storageService.saveHistory(next);
      return next;
    });
  }, []);

  const openItem = useCallback(
    async (item: DownloadedItem) => {
      try {
        const exists = await mediaDownloaderBridge.fileExists(item.contentUri);
        if (!exists) {
          showToast(
            'error',
            'El archivo ya no se encuentra en esa ubicación del dispositivo.',
          );
          return;
        }
        await mediaDownloaderBridge.openMediaFile(
          item.contentUri,
          item.mimeType,
        );
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'No se pudo abrir el archivo.';
        showToast('error', msg);
      }
    },
    [showToast],
  );

  const shareItem = useCallback(
    async (item: DownloadedItem) => {
      try {
        const exists = await mediaDownloaderBridge.fileExists(item.contentUri);
        if (!exists) {
          showToast('error', 'El archivo ya no existe en el almacenamiento.');
          return;
        }
        await mediaDownloaderBridge.shareMediaFile(
          item.contentUri,
          item.mimeType,
          item.title,
        );
      } catch {
        showToast('error', 'No se pudo compartir el archivo.');
      }
    },
    [showToast],
  );

  const deleteItem = useCallback(
    async (item: DownloadedItem) => {
      await mediaDownloaderBridge.deleteMediaFile(item.contentUri);
      setItems(prev => {
        const next = prev.filter(entry => entry.id !== item.id);
        storageService.saveHistory(next);
        return next;
      });
      showToast('info', 'Elemento eliminado de tu biblioteca.');
    },
    [showToast],
  );

  const clearHistoryOnly = useCallback(() => {
    setItems([]);
    storageService.saveHistory([]);
    showToast('info', 'Historial limpiado.');
  }, [showToast]);

  return {
    items,
    isLoaded,
    addDownloadedItem,
    openItem,
    shareItem,
    deleteItem,
    clearHistoryOnly,
  };
}

