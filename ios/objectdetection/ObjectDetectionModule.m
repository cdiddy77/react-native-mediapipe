//
//  ObjectDetectionModule.m
//  react-native-mediapipe
//
//  Created by Charles Parker on 3/24/24.
//

#import <Foundation/Foundation.h>
#import "React/RCTBridgeModule.h"
#import "React/RCTEventEmitter.h"

@interface RCT_EXTERN_REMAP_MODULE(ObjectDetection, ObjectDetectionModule, RCTEventEmitter)
RCT_EXTERN_METHOD(
                  createDetector:(nonnull NSNumber *)threshold
                  withMaxResults:(NSInteger)maxResults
                  withDelegate:(NSInteger)delegate
                  withModel:(nonnull NSString *)model
                  withRunningMode:(NSInteger)runningMode
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject
                  )

RCT_EXTERN_METHOD(releaseDetector:(NSInteger)handle
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject
                  )

RCT_EXTERN_METHOD(detectOnImage:(nonnull NSString *)imagePath
                  withThreshold:(nonnull NSNumber *)threshold
                  withMaxResults:(NSInteger)maxResults
                  withDelegate:(NSInteger)delegate
                  withModel:(nonnull NSString *)model
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject
                  )

RCT_EXTERN_METHOD(detectOnVideo:(nonnull NSString *)videoPath
                  withThreshold:(nonnull NSNumber *)threshold
                  withMaxResults:(NSInteger)maxResults
                  withDelegate:(NSInteger)delegate
                  withModel:(nonnull NSString *)model
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject
                  )
@end

