package com.mediafetch.app.downloader

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class MediaDownloaderPackage : BaseReactPackage() {

    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
        return when (name) {
            MediaDownloaderModule.NAME -> MediaDownloaderModule(reactContext)
            else -> null
        }
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            mapOf(
                MediaDownloaderModule.NAME to ReactModuleInfo(
                    MediaDownloaderModule.NAME,
                    MediaDownloaderModule::class.java.name,
                    false, // canOverrideExistingModule
                    false, // needsEagerInit
                    false, // isCxxModule
                    false, // isTurboModule (uses TurboModule Interop cleanly)
                ),
            )
        }
    }
}

