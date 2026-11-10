# MediaFetch — Descargador de Video (MP4) y Música (MP3) en React Native

Aplicación Android hecha con **React Native (TypeScript)** y un módulo nativo en **Kotlin** que integra `yt-dlp` + `FFmpeg` (`youtubedl-android`) directamente dentro de la APK. **No requiere servidor externo**: todo el análisis, descarga y conversión se ejecuta en el teléfono.

## Funcionalidades

- **Navegador web integrado con sesión y tokens**: entra a tus sitios favoritos e inicia sesión (YouTube, redes sociales, sitios privados, cursos, etc.). MediaFetch comparte automáticamente las cookies de sesión (`CookieManager` nativo, incluyendo `HttpOnly`), el `User-Agent`, `Referer` y captura streams/tokens de red (`.m3u8`, `.mp4`, `.mp3` y headers `Authorization`) mientras navegas.
- **Pegar cualquier enlace** con un toque desde el portapapeles (o usar _Compartir → MediaFetch_ desde YouTube, TikTok, Instagram, navegador, etc.).
- **Vista previa del medio** antes de descargar (título, miniatura, canal/autor y duración).
- **Dos formatos de salida**:
  - **MP4 (Video + Audio HD)**: calidades `Mejor`, `1080p`, `720p`, `480p` y `360p` con preferencia por códec H.264/AAC para máxima compatibilidad en Android y WhatsApp. Guarda en `Descargas` (`Download`).
  - **MP3 (Solo Música / Audio)**: extracción y conversión real con FFmpeg en `320 kbps`, `192 kbps` o `128 kbps` con metadatos. Guarda en `Descargas` (`Download`).
- **Cola y progreso en tiempo real**: barra de porcentaje, fase (`Descargando`, `Convirtiendo a MP3`, `Guardando`) y botón de cancelar.
- **Biblioteca local**: filtra por Videos MP4 o Música MP3, busca por título, reproduce con tu reproductor favorito, comparte o elimina archivos.
- **Actualizador integrado del motor `yt-dlp`**: desde la pestaña **Ajustes** puedes actualizar el extractor (`Estable` o `Nightly`) directamente desde la app sin tener que recompilar la APK.

---

## Estructura del Proyecto

```text
DonwloadMusic/
├── android/
│   └── app/src/main/java/com/mediafetch/app/
│       ├── downloader/
│       │   ├── BrowserSessionHelper.kt   # Exporta cookies de sesión WebView a formato Netscape para yt-dlp
│       │   ├── EngineManager.kt          # Inicialización asíncrona y actualización de yt-dlp + FFmpeg
│       │   ├── MediaDownloaderModule.kt  # Puente nativo (getInfo, execute, progreso, cancelar, abrir/compartir)
│       │   ├── MediaDownloaderPackage.kt # Registro del paquete en React Native
│       │   └── MediaStoreSaver.kt        # Guardado compatible con Android 7..16 en Descargas (Download)
│       ├── MainActivity.kt               # Receptor de enlaces compartidos (ACTION_SEND)
│       └── MainApplication.kt
├── src/
│   ├── app/
│   │   └── App.tsx                       # Contenedor principal, tabs y coordinación global
│   ├── core/
│   │   ├── constants/mediaOptions.ts     # Calidades MP4/MP3 y plataformas compatibles
│   │   ├── native/mediaDownloaderBridge.ts # Wrapper tipado hacia NativeModules.MediaDownloader
│   │   ├── theme/tokens.ts               # Paleta de colores, espaciados y radios
│   │   └── utils/
│   │       ├── permissions.ts            # Permiso de almacenamiento en Android <= 9
│   │       └── urlUtils.ts               # Extractor/normalizador de URLs, detección y formateadores
│   ├── features/
│   │   ├── browser/                      # Navegador integrado, sniffer de streams/tokens y selector MP4/MP3
│   │   ├── downloader/                   # Pantalla principal, input, vista previa, formato/calidad y cola
│   │   ├── library/                      # Biblioteca local con búsqueda, filtros y acciones
│   │   └── settings/                     # Actualización de yt-dlp, cookies de sesión y preferencias
│   └── shared/
│       ├── components/                   # Header, BottomTabBar y ToastBanner
│       ├── services/storageService.ts    # Persistencia local con AsyncStorage
│       └── types/media.ts                # Tipos TypeScript compartidos
├── App.tsx
└── package.json
```

---

## Cómo conectar tu celular, compilar y ejecutar

### 1. Prepara tu teléfono Android

1. En tu celular ve a **Ajustes → Acerca del teléfono** y toca **7 veces** en **Número de compilación** para activar las _Opciones de desarrollador_.
2. Entra a **Ajustes → Sistema → Opciones de desarrollador** y activa **Depuración por USB**.
3. Conecta el celular por USB a tu PC y acepta el diálogo **"¿Permitir depuración por USB?"** en la pantalla del celular.
4. Verifica que Windows lo reconoce:
   ```powershell
   adb devices
   ```
   Debe aparecer tu dispositivo con estado `device`.

### 2. Compilar e instalar directo en tu celular

Tienes estas opciones según lo que necesites:

- **Instalación rápida directa para teléfonos modernos (`arm64-v8a`, APK independiente):**
  ```powershell
  npm run install:phone
  ```
- **Opción universal React Native CLI (detecta y compila Release):**
  ```powershell
  npm run android:release
  ```
- **Opción modo desarrollo (con recarga en vivo vía Metro):**
  ```powershell
  npm run android
  ```
- **Solo generar el archivo `.apk` para compartir o instalar manualmente:**
  ```powershell
  npm run build:apk
  ```
  El archivo generado quedará en:
  `android/app/build/outputs/apk/release/app-release.apk`

---

## Comandos útiles

```powershell
npm run typecheck   # Verifica tipos TypeScript
npm test            # Ejecuta pruebas unitarias
npm run lint        # Ejecuta ESLint
```
