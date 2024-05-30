//
//  FaceLandmarkDetectionModule.m
//  react-native-mediapipe
//
//  Created by Charles Parker on 3/24/24.
//

#import <Foundation/Foundation.h>
#import "React/RCTBridgeModule.h"
#import "React/RCTEventEmitter.h"

@interface RCT_EXTERN_REMAP_MODULE(FaceLandmarkDetection, FaceLandmarkDetectionModule, RCTEventEmitter)
RCT_EXTERN_METHOD(
                  createDetector:(NSInteger)numFaces
                  withMinFaceDetectionConfidence:(nonnull NSNumber *)minFaceDetectionConfidence
                  withMinFacePresenceConfidence:(nonnull NSNumber *)minFacePresenceConfidence
                  withMinTrackingConfidence:(nonnull NSNumber *)minTrackingConfidence
                  withModel:(nonnull NSString *)model
                  withDelegate:(NSInteger)delegate
                  withRunningMode:(NSInteger)runningMode
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject
                  )

RCT_EXTERN_METHOD(releaseDetector:(NSInteger)handle
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject
                  )

RCT_EXTERN_METHOD(detectOnImage:(nonnull NSString *)imagePath
                  withNumFaces:(NSInteger)numFaces
                  withMinFaceDetectionConfidence:(nonnull NSNumber *)minFaceDetectionConfidence
                  withMinFacePresenceConfidence:(nonnull NSNumber *)minFacePresenceConfidence
                  withMinTrackingConfidence:(nonnull NSNumber *)minTrackingConfidence
                  withModel:(nonnull NSString *)model
                  withDelegate:(NSInteger)delegate
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject
                  )

RCT_EXTERN_METHOD(detectOnVideo:(nonnull NSString *)videoPath
                  withNumFaces:(NSInteger)numFaces
                  withMinFaceDetectionConfidence:(nonnull NSNumber *)minFaceDetectionConfidence
                  withMinFacePresenceConfidence:(nonnull NSNumber *)minFacePresenceConfidence
                  withMinTrackingConfidence:(nonnull NSNumber *)minTrackingConfidence
                  withModel:(nonnull NSString *)model
                  withDelegate:(NSInteger)delegate
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject
                  )
@end

