package com.mediafetch.app

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.mediafetch.app.downloader.EngineManager
import com.mediafetch.app.downloader.MediaDownloaderPackage

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          add(MediaDownloaderPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    EngineManager.initAsync(this)
    loadReactNative(this)
  }
}
