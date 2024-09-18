//
//  OrientationHelper.swift
//  Pods
//
//  Created by Charles Parker on 9/17/24.
//

import UIKit

func uiImageOrientation(from orientation: String) -> UIImage.Orientation? {
    switch orientation {
    case "portrait":
        return .up
    case "portrait-upside-down":
        return .down
    case "landscape-left":
        return .right
    case "landscape-right":
        return .left
    default:
        return nil
    }
}