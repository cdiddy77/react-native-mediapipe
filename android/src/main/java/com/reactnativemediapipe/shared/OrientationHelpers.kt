package com.reactnativemediapipe.shared

import com.mrousavy.camera.core.types.Orientation

fun imageOrientation(orientation: String): Orientation? {
    return when (orientation) {
        "portrait" -> Orientation.PORTRAIT
        "portrait-upside-down" -> Orientation.PORTRAIT_UPSIDE_DOWN
        "landscape-left" -> Orientation.LANDSCAPE_LEFT
        "landscape-right" -> Orientation.LANDSCAPE_RIGHT
        else -> null
    }
}
