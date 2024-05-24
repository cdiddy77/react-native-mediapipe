package com.reactnativemediapipe.shared

import android.graphics.Bitmap
import android.graphics.BitmapFactory

sealed class MediaLoadingError(message: String) : Exception(message) {
  object InvalidURL : MediaLoadingError("Provided string is not a valid URL.")
  object UnableToLoadData : MediaLoadingError("Could not load data from the URL.")
  object UnableToCreateImage : MediaLoadingError("Data loaded is not a valid image.")
  object UnableToCreateVideoAsset : MediaLoadingError("Data loaded is not a valid video.")
}


fun loadBitmapFromPath(fileUrl: String): Bitmap {
  var filePath: String
  if (fileUrl.startsWith("file://")) {
    filePath = fileUrl.substring(7)
  } else {
    filePath = fileUrl
  }
  val result = BitmapFactory.decodeFile(filePath)
  result?.let {
    return it
  }
  throw MediaLoadingError.UnableToLoadData;
}
