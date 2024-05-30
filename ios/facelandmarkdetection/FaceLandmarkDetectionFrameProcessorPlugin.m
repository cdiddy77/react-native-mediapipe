//
//  FrameProcessorPlugins.m
//  react-native-mediapipe
//
//  Created by Charles Parker on 3/24/24.
//

#import <Foundation/Foundation.h>

#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/FrameProcessorPluginRegistry.h>

#import "ReactNativeMediaPipe-Swift.h"

@interface FaceLandmarkDetectionFrameProcessorPlugin (FrameProcessorPluginLoader)
@end

@implementation FaceLandmarkDetectionFrameProcessorPlugin (FrameProcessorPluginLoader)
+ (void) load {
  [FrameProcessorPluginRegistry addFrameProcessorPlugin:@"faceLandmarkDetection"
                                        withInitializer:^FrameProcessorPlugin*(VisionCameraProxyHolder* proxy, NSDictionary* options) {
    return [[FaceLandmarkDetectionFrameProcessorPlugin alloc] initWithProxy:proxy withOptions:options];
  }];
}
@end
