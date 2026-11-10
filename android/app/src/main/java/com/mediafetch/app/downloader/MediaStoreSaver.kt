package com.mediafetch.app.downloader

import android.content.ContentValues
import android.content.Context
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import androidx.core.content.FileProvider
import java.io.File
import java.io.IOException

data class SavedMediaResult(
    val contentUri: String,
    val fileName: String,
    val publicFolder: String,
    val fileSize: Long,
    val mimeType: String,
)

object MediaStoreSaver {
    private const val PUBLIC_DOWNLOADS_LABEL = "Descargas"

    fun sanitizeFileName(rawName: String, fallbackName: String): String {
        val sanitized = rawName
            .replace(Regex("[\\\\/:*?\"<>|\\x00-\\x1F]"), " ")
            .replace(Regex("\\s+"), " ")
            .trim()
            .trim('.')
        return if (sanitized.isNotEmpty()) sanitized.take(120) else fallbackName
    }

    fun saveToPublicMediaStore(
        context: Context,
        sourceFile: File,
        isVideo: Boolean,
        preferredTitle: String? = null,
    ): SavedMediaResult {
        if (!sourceFile.exists() || sourceFile.length() == 0L) {
            throw IOException("El archivo descargado está vacío o no existe.")
        }

        val extension = sourceFile.extension.lowercase().ifEmpty {
            if (isVideo) "mp4" else "mp3"
        }
        val mimeType = if (isVideo) "video/mp4" else "audio/mpeg"
        val baseNameRaw = preferredTitle?.takeIf { it.isNotBlank() } ?: sourceFile.nameWithoutExtension
        val safeBase = sanitizeFileName(baseNameRaw, if (isVideo) "video_descargado" else "audio_descargado")
        val fileName = "$safeBase.$extension"
        val fileSize = sourceFile.length()

        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            saveViaDownloadsMediaStoreQ(context, sourceFile, fileName, mimeType, fileSize)
        } else {
            saveViaLegacyDownloads(context, sourceFile, safeBase, extension, mimeType, fileSize)
        }
    }

    private fun saveViaDownloadsMediaStoreQ(
        context: Context,
        sourceFile: File,
        fileName: String,
        mimeType: String,
        fileSize: Long,
    ): SavedMediaResult {
        val collection: Uri = MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)

        val values = ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
            put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
            put(MediaStore.MediaColumns.SIZE, fileSize)
            put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
            put(MediaStore.MediaColumns.IS_PENDING, 1)
        }

        val resolver = context.contentResolver
        val itemUri = resolver.insert(collection, values)
            ?: throw IOException("No se pudo guardar el archivo en la carpeta Descargas.")

        try {
            resolver.openOutputStream(itemUri)?.use { output ->
                sourceFile.inputStream().use { input ->
                    input.copyTo(output, bufferSize = 64 * 1024)
                }
            } ?: throw IOException("No se pudo abrir flujo de salida en Descargas.")

            val publishValues = ContentValues().apply {
                put(MediaStore.MediaColumns.IS_PENDING, 0)
            }
            resolver.update(itemUri, publishValues, null, null)

            var actualName = fileName
            resolver.query(
                itemUri,
                arrayOf(MediaStore.MediaColumns.DISPLAY_NAME),
                null,
                null,
                null,
            )?.use { cursor ->
                if (cursor.moveToFirst()) {
                    val idx = cursor.getColumnIndex(MediaStore.MediaColumns.DISPLAY_NAME)
                    if (idx >= 0) {
                        actualName = cursor.getString(idx) ?: fileName
                    }
                }
            }

            return SavedMediaResult(
                contentUri = itemUri.toString(),
                fileName = actualName,
                publicFolder = PUBLIC_DOWNLOADS_LABEL,
                fileSize = fileSize,
                mimeType = mimeType,
            )
        } catch (err: Throwable) {
            try {
                resolver.delete(itemUri, null, null)
            } catch (_: Throwable) {
            }
            throw err
        }
    }

    @Suppress("DEPRECATION")
    private fun saveViaLegacyDownloads(
        context: Context,
        sourceFile: File,
        baseName: String,
        extension: String,
        mimeType: String,
        fileSize: Long,
    ): SavedMediaResult {
        val targetDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
        if (!targetDir.exists() && !targetDir.mkdirs()) {
            throw IOException("No se pudo acceder a la carpeta Descargas: ${targetDir.absolutePath}")
        }

        var candidate = File(targetDir, "$baseName.$extension")
        var counter = 1
        while (candidate.exists()) {
            candidate = File(targetDir, "$baseName ($counter).$extension")
            counter++
        }

        sourceFile.inputStream().use { input ->
            candidate.outputStream().use { output ->
                input.copyTo(output, bufferSize = 64 * 1024)
            }
        }

        MediaScannerConnection.scanFile(
            context,
            arrayOf(candidate.absolutePath),
            arrayOf(mimeType),
            null,
        )

        val uri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.mediafetch.fileprovider",
            candidate,
        )

        return SavedMediaResult(
            contentUri = uri.toString(),
            fileName = candidate.name,
            publicFolder = PUBLIC_DOWNLOADS_LABEL,
            fileSize = fileSize,
            mimeType = mimeType,
        )
    }
}
