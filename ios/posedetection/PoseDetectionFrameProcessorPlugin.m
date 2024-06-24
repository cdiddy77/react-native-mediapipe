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

@interface PoseDetectionFrameProcessorPlugin (FrameProcessorPluginLoader)
@end

@implementation PoseDetectionFrameProcessorPlugin (FrameProcessorPluginLoader)
+ (void) load {
  [FrameProcessorPluginRegistry addFrameProcessorPlugin:@"poseDetection"
                                        withInitializer:^FrameProcessorPlugin*(VisionCameraProxyHolder* proxy, NSDictionary* options) {
    return [[PoseDetectionFrameProcessorPlugin alloc] initWithProxy:proxy withOptions:options];
  }];
}
@end
