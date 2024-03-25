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

@interface ObjectDetectionFrameProcessorPlugin (FrameProcessorPluginLoader)
@end

@implementation ObjectDetectionFrameProcessorPlugin (FrameProcessorPluginLoader)
+ (void) load {
  [FrameProcessorPluginRegistry addFrameProcessorPlugin:@"objectDetection"
                                        withInitializer:^FrameProcessorPlugin*(VisionCameraProxyHolder* proxy, NSDictionary* options) {
    return [[ObjectDetectionFrameProcessorPlugin alloc] initWithProxy:proxy withOptions:options];
  }];
}
@end
