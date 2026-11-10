package com.mediafetch.app.downloader

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.yausername.youtubedl_android.YoutubeDL
import com.yausername.youtubedl_android.YoutubeDLException
import com.yausername.youtubedl_android.YoutubeDLRequest
import java.io.File
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors

@ReactModule(name = MediaDownloaderModule.NAME)
class MediaDownloaderModule(
    private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "MediaDownloader"
        private const val TAG = "MediaDownloaderModule"
        private const val EVENT_PROGRESS = "onDownloadProgress"
        private const val EVENT_SHARED_URL = "onSharedUrl"
    }

    private val workerExecutor = Executors.newCachedThreadPool()
    private val cancelledTasks = ConcurrentHashMap.newKeySet<String>()
    private val mainHandler = Handler(Looper.getMainLooper())

    init {
        mainHandler.post {
            BrowserSessionHelper.ensureCookiesEnabled()
        }
        EngineManager.setSharedTextListener { sharedText ->
            val payload = Arguments.createMap().apply {
                putString("url", sharedText)
            }
            emitEvent(EVENT_SHARED_URL, payload)
        }
    }

    override fun getName(): String = NAME

    override fun invalidate() {
        EngineManager.setSharedTextListener(null)
        super.invalidate()
    }

    private fun emitEvent(eventName: String, params: Any?) {
        try {
            if (reactContext.hasActiveReactInstance()) {
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit(eventName, params)
            }
        } catch (err: Throwable) {
            Log.w(TAG, "Failed to emit event $eventName", err)
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for React Native NativeEventEmitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for React Native NativeEventEmitter
    }

    @ReactMethod
    fun consumeInitialSharedUrl(promise: Promise) {
        promise.resolve(EngineManager.consumePendingSharedText())
    }

    @ReactMethod
    fun getEngineStatus(promise: Promise) {
        workerExecutor.execute {
            try {
                EngineManager.ensureInitialized(reactContext)
                val version = EngineManager.getYtDlpVersion(reactContext)
                val result = Arguments.createMap().apply {
                    putBoolean("initialized", EngineManager.isInitialized)
                    putBoolean("ffmpegReady", EngineManager.ffmpegReady)
                    putString("ytDlpVersion", version)
                    putString("error", EngineManager.initError)
                }
                promise.resolve(result)
            } catch (err: Throwable) {
                val result = Arguments.createMap().apply {
                    putBoolean("initialized", EngineManager.isInitialized)
                    putBoolean("ffmpegReady", EngineManager.ffmpegReady)
                    putString("ytDlpVersion", "No disponible")
                    putString("error", err.message ?: EngineManager.initError)
                }
                promise.resolve(result)
            }
        }
    }

    @ReactMethod
    fun updateEngine(channel: String, promise: Promise) {
        workerExecutor.execute {
            try {
                val (status, version) = EngineManager.updateYtDlp(reactContext, channel)
                val result = Arguments.createMap().apply {
                    putString("status", status)
                    putString("ytDlpVersion", version)
                }
                promise.resolve(result)
            } catch (err: Throwable) {
                promise.reject("UPDATE_ERROR", err.message ?: "No se pudo actualizar yt-dlp", err)
            }
        }
    }

    @ReactMethod
    fun getBrowserSessionInfo(url: String, promise: Promise) {
        workerExecutor.execute {
            val count = BrowserSessionHelper.getCookieCountForUrl(url)
            val result = Arguments.createMap().apply {
                putBoolean("hasSession", count > 0)
                putInt("cookieCount", count)
            }
            promise.resolve(result)
        }
    }

    @ReactMethod
    fun clearBrowserSession(promise: Promise) {
        mainHandler.post {
            BrowserSessionHelper.clearSession {
                promise.resolve(true)
            }
        }
    }

    @ReactMethod
    fun getMediaInfo(url: String, promise: Promise) {
        fetchMediaInfoInternal(
            url = url,
            useBrowserCookies = true,
            userAgent = null,
            referer = null,
            promise = promise,
        )
    }

    @ReactMethod
    fun getMediaInfoWithSession(options: ReadableMap, promise: Promise) {
        val url = options.getString("url")?.trim() ?: ""
        if (url.isEmpty()) {
            promise.reject("INVALID_ARGS", "url es obligatoria")
            return
        }
        val useBrowserCookies =
            if (options.hasKey("useBrowserCookies")) options.getBoolean("useBrowserCookies") else true
        val userAgent =
            if (options.hasKey("userAgent") && !options.isNull("userAgent")) options.getString("userAgent") else null
        val referer =
            if (options.hasKey("referer") && !options.isNull("referer")) options.getString("referer") else null

        fetchMediaInfoInternal(
            url = url,
            useBrowserCookies = useBrowserCookies,
            userAgent = userAgent,
            referer = referer,
            promise = promise,
        )
    }

    private fun fetchMediaInfoInternal(
        url: String,
        useBrowserCookies: Boolean,
        userAgent: String?,
        referer: String?,
        promise: Promise,
    ) {
        workerExecutor.execute {
            val tempDir = File(reactContext.cacheDir, "mediafetch_info_${System.nanoTime()}")
            try {
                EngineManager.ensureInitialized(reactContext)
                tempDir.mkdirs()

                val cookiesFile = if (useBrowserCookies) {
                    BrowserSessionHelper.exportCookiesToNetscapeFile(
                        tempDir,
                        listOfNotNull(url, referer),
                    )
                } else {
                    null
                }

                val request = YoutubeDLRequest(url.trim()).apply {
                    addOption("--no-playlist")
                    addOption("--no-warnings")
                    if (cookiesFile != null) {
                        addOption("--cookies", cookiesFile.absolutePath)
                    }
                    if (!userAgent.isNullOrBlank()) {
                        addOption("--user-agent", userAgent)
                    }
                    if (!referer.isNullOrBlank()) {
                        addOption("--referer", referer)
                    }
                }
                val info = YoutubeDL.getInstance().getInfo(request)
                val result = Arguments.createMap().apply {
                    putString("id", info.id ?: "")
                    putString("title", info.title ?: "Sin título")
                    putString("uploader", info.uploader ?: "")
                    putDouble("duration", info.duration.toDouble())
                    putString("thumbnail", info.thumbnail ?: "")
                    putString("extractor", info.extractorKey ?: info.extractor ?: "")
                    putString("webpageUrl", info.webpageUrl ?: url)
                    putString("ext", info.ext ?: "")
                }
                promise.resolve(result)
            } catch (err: Throwable) {
                promise.reject(
                    "INFO_ERROR",
                    simplifyErrorMessage(err),
                    err,
                )
            } finally {
                try {
                    tempDir.deleteRecursively()
                } catch (_: Throwable) {
                }
            }
        }
    }

    @ReactMethod
    fun startDownload(options: ReadableMap, promise: Promise) {
        val taskId = options.getString("taskId")?.takeIf { it.isNotBlank() }
            ?: run {
                promise.reject("INVALID_ARGS", "taskId es obligatorio")
                return
            }
        val url = options.getString("url")?.trim()?.takeIf { it.isNotBlank() }
            ?: run {
                promise.reject("INVALID_ARGS", "url es obligatoria")
                return
            }
        val format = options.getString("format")?.lowercase() ?: "mp4"
        val quality = options.getString("quality")?.lowercase() ?: "best"
        val customTitle = if (options.hasKey("customTitle") && !options.isNull("customTitle")) {
            options.getString("customTitle")
        } else {
            null
        }
        val useBrowserCookies =
            if (options.hasKey("useBrowserCookies")) options.getBoolean("useBrowserCookies") else true
        val userAgent =
            if (options.hasKey("userAgent") && !options.isNull("userAgent")) options.getString("userAgent") else null
        val referer =
            if (options.hasKey("referer") && !options.isNull("referer")) options.getString("referer") else null

        val extraHeaders = LinkedHashMap<String, String>()
        if (options.hasKey("headers") && !options.isNull("headers")) {
            val headersMap = options.getMap("headers")
            val iterator = headersMap?.keySetIterator()
            while (iterator != null && iterator.hasNextKey()) {
                val key = iterator.nextKey()
                val value = headersMap.getString(key)
                if (!value.isNullOrBlank()) {
                    extraHeaders[key] = value
                }
            }
        }

        cancelledTasks.remove(taskId)

        workerExecutor.execute {
            val tempRoot = File(reactContext.cacheDir, "mediafetch_tmp")
            val taskDir = File(tempRoot, taskId)
            var wakeLock: PowerManager.WakeLock? = null

            try {
                EngineManager.ensureInitialized(reactContext)
                if (!taskDir.exists()) {
                    taskDir.mkdirs()
                }

                val pm = reactContext.getSystemService(Context.POWER_SERVICE) as? PowerManager
                wakeLock = pm?.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "MediaFetch::$taskId")?.apply {
                    acquire(20 * 60 * 1000L)
                }

                emitProgress(taskId, 0f, -1L, "Preparando descarga...", "preparing")

                val cookiesFile = if (useBrowserCookies) {
                    BrowserSessionHelper.exportCookiesToNetscapeFile(
                        taskDir,
                        listOfNotNull(url, referer),
                    )
                } else {
                    null
                }

                val isVideo = format != "mp3"
                val request = buildDownloadRequest(
                    url = url,
                    outputDir = taskDir,
                    isVideo = isVideo,
                    quality = quality,
                    cookiesFile = cookiesFile,
                    userAgent = userAgent,
                    referer = referer,
                    extraHeaders = extraHeaders,
                )

                var lastEmitTime = 0L
                var lastProgress = -1f

                YoutubeDL.getInstance().execute(request, taskId) { progress, etaInSeconds, line ->
                    val now = System.currentTimeMillis()
                    val clampedProgress = progress.coerceIn(0f, 100f)
                    val phase = detectPhase(line, isVideo)

                    if (now - lastEmitTime >= 160L || kotlin.math.abs(clampedProgress - lastProgress) >= 1.5f || phase == "converting") {
                        lastEmitTime = now
                        lastProgress = clampedProgress
                        emitProgress(taskId, clampedProgress, etaInSeconds, line ?: "", phase)
                    }
                }

                if (cancelledTasks.contains(taskId)) {
                    promise.reject("CANCELLED", "Descarga cancelada por el usuario")
                    return@execute
                }

                emitProgress(taskId, 99f, 0L, "Guardando en Descargas...", "saving")

                val downloadedFile = findOutputFile(taskDir, isVideo)
                    ?: throw IllegalStateException("No se encontró el archivo generado tras la descarga.")

                val saved = MediaStoreSaver.saveToPublicMediaStore(
                    context = reactContext,
                    sourceFile = downloadedFile,
                    isVideo = isVideo,
                    preferredTitle = customTitle,
                )

                emitProgress(taskId, 100f, 0L, "Completado", "completed")

                val result = Arguments.createMap().apply {
                    putString("taskId", taskId)
                    putString("contentUri", saved.contentUri)
                    putString("fileName", saved.fileName)
                    putString("publicFolder", saved.publicFolder)
                    putDouble("fileSize", saved.fileSize.toDouble())
                    putString("mimeType", saved.mimeType)
                    putString("format", if (isVideo) "mp4" else "mp3")
                }
                promise.resolve(result)
            } catch (err: Throwable) {
                if (cancelledTasks.contains(taskId) || err is InterruptedException || err.message?.contains("Process destroyed", ignoreCase = true) == true) {
                    promise.reject("CANCELLED", "Descarga cancelada")
                } else {
                    Log.e(TAG, "Download error for $url", err)
                    promise.reject("DOWNLOAD_ERROR", simplifyErrorMessage(err), err)
                }
            } finally {
                cancelledTasks.remove(taskId)
                try {
                    wakeLock?.let { if (it.isHeld) it.release() }
                } catch (_: Throwable) {
                }
                try {
                    taskDir.deleteRecursively()
                } catch (_: Throwable) {
                }
            }
        }
    }

    @ReactMethod
    fun cancelDownload(taskId: String, promise: Promise) {
        workerExecutor.execute {
            try {
                cancelledTasks.add(taskId)
                val destroyed = YoutubeDL.getInstance().destroyProcessById(taskId)
                promise.resolve(destroyed)
            } catch (err: Throwable) {
                promise.resolve(false)
            }
        }
    }

    @ReactMethod
    fun openMediaFile(contentUri: String, mimeType: String, promise: Promise) {
        try {
            val uri = Uri.parse(contentUri)
            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, mimeType)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            val chooser = Intent.createChooser(intent, "Abrir con").apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactContext.startActivity(chooser)
            promise.resolve(true)
        } catch (err: Throwable) {
            promise.reject("OPEN_ERROR", "No se encontró una aplicación para abrir este archivo.", err)
        }
    }

    @ReactMethod
    fun shareMediaFile(contentUri: String, mimeType: String, title: String, promise: Promise) {
        try {
            val uri = Uri.parse(contentUri)
            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                type = mimeType
                putExtra(Intent.EXTRA_STREAM, uri)
                putExtra(Intent.EXTRA_SUBJECT, title)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            val chooser = Intent.createChooser(shareIntent, "Compartir archivo").apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactContext.startActivity(chooser)
            promise.resolve(true)
        } catch (err: Throwable) {
            promise.reject("SHARE_ERROR", "No se pudo compartir el archivo.", err)
        }
    }

    @ReactMethod
    fun deleteMediaFile(contentUri: String, promise: Promise) {
        workerExecutor.execute {
            try {
                val uri = Uri.parse(contentUri)
                val deleted = reactContext.contentResolver.delete(uri, null, null)
                promise.resolve(deleted > 0)
            } catch (err: Throwable) {
                promise.resolve(false)
            }
        }
    }

    @ReactMethod
    fun fileExists(contentUri: String, promise: Promise) {
        workerExecutor.execute {
            try {
                val uri = Uri.parse(contentUri)
                reactContext.contentResolver.openAssetFileDescriptor(uri, "r")?.use {
                    promise.resolve(true)
                } ?: promise.resolve(false)
            } catch (_: Throwable) {
                promise.resolve(false)
            }
        }
    }

    private fun buildDownloadRequest(
        url: String,
        outputDir: File,
        isVideo: Boolean,
        quality: String,
        cookiesFile: File?,
        userAgent: String?,
        referer: String?,
        extraHeaders: Map<String, String>,
    ): YoutubeDLRequest {
        return YoutubeDLRequest(url).apply {
            addOption("--no-playlist")
            addOption("--no-mtime")
            addOption("--no-warnings")
            addOption("--newline")
            addOption("-o", File(outputDir, "%(title).110B.%(ext)s").absolutePath)

            if (cookiesFile != null) {
                addOption("--cookies", cookiesFile.absolutePath)
            }
            if (!userAgent.isNullOrBlank()) {
                addOption("--user-agent", userAgent)
            }
            if (!referer.isNullOrBlank()) {
                addOption("--referer", referer)
            }
            for ((headerName, headerValue) in extraHeaders) {
                if (headerName.equals("cookie", ignoreCase = true) && cookiesFile != null) {
                    continue
                }
                if (headerName.equals("user-agent", ignoreCase = true) ||
                    headerName.equals("referer", ignoreCase = true)
                ) {
                    continue
                }
                addOption("--add-header", "$headerName:$headerValue")
            }

            if (!isVideo) {
                val bitrate = when (quality) {
                    "320" -> "320K"
                    "192" -> "192K"
                    "128" -> "128K"
                    else -> "192K"
                }
                addOption("-f", "bestaudio/best")
                addOption("-x")
                addOption("--audio-format", "mp3")
                addOption("--audio-quality", bitrate)
                addOption("--add-metadata")
            } else {
                val maxHeight = when (quality) {
                    "1080" -> 1080
                    "720" -> 720
                    "480" -> 480
                    "360" -> 360
                    else -> null
                }

                if (maxHeight != null) {
                    addOption(
                        "-f",
                        "bestvideo[height<=$maxHeight]+bestaudio/best[height<=$maxHeight]/best",
                    )
                } else {
                    addOption("-f", "bestvideo+bestaudio/best")
                }
                addOption("-S", "vcodec:h264,acodec:m4a")
                addOption("--merge-output-format", "mp4")
                addOption("--add-metadata")
            }
        }
    }

    private fun findOutputFile(dir: File, isVideo: Boolean): File? {
        val targetExt = if (isVideo) "mp4" else "mp3"
        val files = dir.listFiles()?.filter {
            it.isFile &&
                !it.name.endsWith(".part", ignoreCase = true) &&
                !it.name.endsWith(".ytdl", ignoreCase = true) &&
                !it.name.endsWith(".temp", ignoreCase = true) &&
                !it.name.equals("session_cookies.txt", ignoreCase = true) &&
                it.length() > 0L
        } ?: return null

        return files.firstOrNull { it.extension.equals(targetExt, ignoreCase = true) }
            ?: files.maxByOrNull { it.lastModified() }
    }

    private fun detectPhase(line: String?, isVideo: Boolean): String {
        if (line.isNullOrBlank()) return "downloading"
        val lower = line.lowercase()
        return when {
            lower.contains("[extractaudio]") || lower.contains("[merger]") || lower.contains("ffmpeg") ->
                if (isVideo) "merging" else "converting"
            lower.contains("[metadata]") || lower.contains("fixup") -> "finalizing"
            lower.contains("[download]") -> "downloading"
            else -> "preparing"
        }
    }

    private fun emitProgress(
        taskId: String,
        progress: Float,
        etaSeconds: Long,
        statusLine: String,
        phase: String,
    ) {
        val payload = Arguments.createMap().apply {
            putString("taskId", taskId)
            putDouble("progress", progress.toDouble())
            putDouble("etaSeconds", etaSeconds.toDouble())
            putString("statusLine", statusLine)
            putString("phase", phase)
        }
        emitEvent(EVENT_PROGRESS, payload)
    }

    private fun simplifyErrorMessage(err: Throwable): String {
        val raw = (err as? YoutubeDLException)?.message ?: err.message ?: "Error inesperado"
        return when {
            raw.contains("Unsupported URL", ignoreCase = true) ->
                "Enlace no compatible o protegido. Prueba abrirlo en la pestaña Navegador y reproducir el video para capturarlo."
            raw.contains("HTTP Error 403", ignoreCase = true) ->
                "El servidor bloqueó el acceso (403). Inicia sesión en el Navegador integrado o actualiza yt-dlp en Ajustes."
            raw.contains("HTTP Error 404", ignoreCase = true) ->
                "El contenido no fue encontrado (404) o el token expiró."
            raw.contains("Private video", ignoreCase = true) || raw.contains("Sign in", ignoreCase = true) ->
                "Este contenido requiere iniciar sesión. Abre la pestaña Navegador, inicia sesión y vuelve a descargar."
            raw.contains("Unable to resolve host", ignoreCase = true) || raw.contains("Failed to resolve", ignoreCase = true) ->
                "Sin conexión a internet o no se pudo conectar con el servidor."
            else -> raw.lines().lastOrNull { it.isNotBlank() }?.take(220) ?: raw.take(220)
        }
    }
}
