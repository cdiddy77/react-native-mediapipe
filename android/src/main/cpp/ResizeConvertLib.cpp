//
// Created by Marc Rousavy on 25.01.24
//

#include "ResizeConvert.h"
#include <fbjni/fbjni.h>
#include <jni.h>

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return facebook::jni::initialize(vm, [] { resizeconvert::ResizeConvert::registerNatives(); });
}
