import { PermissionsAndroid, Platform } from 'react-native';

export async function ensureStoragePermissionForLegacyAndroid(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  // Android 10 (API 29) y superiores guardan directamente vía MediaStore sin pedir permisos de almacenamiento.
  if (typeof Platform.Version === 'number' && Platform.Version >= 29) {
    return true;
  }

  const alreadyGranted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
  );
  if (alreadyGranted) {
    return true;
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    {
      title: 'Permiso de almacenamiento',
      message:
        'MediaFetch necesita permiso para guardar tus videos MP4 y canciones MP3 en tu teléfono.',
      buttonPositive: 'Permitir',
      buttonNegative: 'Cancelar',
    },
  );

  return result === PermissionsAndroid.RESULTS.GRANTED;
}

