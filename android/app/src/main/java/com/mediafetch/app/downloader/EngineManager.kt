package com.mediafetch.app.downloader

import android.content.Context
import android.util.Log
import com.yausername.ffmpeg.FFmpeg
import com.yausername.youtubedl_android.YoutubeDL
import com.yausername.youtubedl_android.YoutubeDL.UpdateChannel
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

object EngineManager {
    private const val TAG = "MediaFetchEngine"

    private val initStarted = AtomicBoolean(false)
    private val initLatch = CountDownLatch(1)
    private val initExecutor = Executors.newSingleThreadExecutor()

    @Volatile
    var isInitialized: Boolean = false
        private set

    @Volatile
    var ffmpegReady: Boolean = false
        private set

    @Volatile
    var initError: String? = null
        private set

    @Volatile
    private var pendingSharedText: String? = null

    @Volatile
    private var sharedTextListener: ((String) -> Unit)? = null

    fun initAsync(context: Context) {
        if (!initStarted.compareAndSet(false, true)) {
            return
        }
        val appContext = context.applicationContext
        initExecutor.execute {
            try {
                YoutubeDL.getInstance().init(appContext)
                isInitialized = true
                try {
                    FFmpeg.getInstance().init(appContext)
                    ffmpegReady = true
                } catch (ffmpegErr: Throwable) {
                    ffmpegReady = false
                    Log.e(TAG, "FFmpeg initialization failed", ffmpegErr)
                    initError = "FFmpeg no pudo inicializarse: ${ffmpegErr.message}"
                }
            } catch (err: Throwable) {
                isInitialized = false
                initError = err.message ?: "Error desconocido al inicializar el motor yt-dlp"
                Log.e(TAG, "YoutubeDL initialization failed", err)
            } finally {
                initLatch.countDown()
            }
        }
    }

    fun ensureInitialized(context: Context) {
        if (!initStarted.get()) {
            initAsync(context)
        }
        initLatch.await()
        if (!isInitialized) {
            throw IllegalStateException(initError ?: "El motor de descarga no pudo inicializarse")
        }
    }

    fun getYtDlpVersion(context: Context): String {
        return try {
            ensureInitialized(context)
            YoutubeDL.getInstance().version(context.applicationContext) ?: "Desconocida"
        } catch (err: Throwable) {
            "No disponible"
        }
    }

    fun updateYtDlp(context: Context, channelName: String): Pair<String, String> {
        ensureInitialized(context)
        val channel = if (channelName.equals("nightly", ignoreCase = true)) {
            UpdateChannel.NIGHTLY
        } else {
            UpdateChannel.STABLE
        }
        val status = YoutubeDL.getInstance().updateYoutubeDL(context.applicationContext, channel)
        val statusLabel = status?.name ?: "UNKNOWN"
        val version = YoutubeDL.getInstance().version(context.applicationContext) ?: "Desconocida"
        return statusLabel to version
    }

    fun setSharedTextListener(listener: ((String) -> Unit)?) {
        sharedTextListener = listener
    }

    fun handleIncomingSharedText(text: String?) {
        val cleaned = text?.trim()?.takeIf { it.isNotEmpty() } ?: return
        val activeListener = sharedTextListener
        if (activeListener != null) {
            activeListener.invoke(cleaned)
        } else {
            pendingSharedText = cleaned
        }
    }

    fun consumePendingSharedText(): String? {
        val current = pendingSharedText
        pendingSharedText = null
        return current
    }
}

