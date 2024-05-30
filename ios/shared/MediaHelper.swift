//
//  MediaHelper.swift
//  CocoaAsyncSocket
//
//  Created by Charles Parker on 5/12/24.
//

import Foundation
import UIKit

enum MediaLoadingError: Error, LocalizedError {
  case invalidURL
  case unableToLoadData
  case unableToCreateImage
  case unableToCreateVideoAsset

  var errorDescription: String? {
    switch self {
    case .invalidURL:
      return "Provided string is not a valid URL."
    case .unableToLoadData:
      return "Could not load data from the URL."
    case .unableToCreateImage:
      return "Data loaded is not a valid image."
    case .unableToCreateVideoAsset:
      return "Data loaded is not a valid video."
    }
  }
}

func loadImageFromPath(from path: String) throws -> UIImage {
  // ensure its a url
  var imageUrl: String
  if path.starts(with: "file://") {
    imageUrl = path
  } else {
    imageUrl = "file://" + path
  }

  guard let url = URL(string: imageUrl) else {
    throw MediaLoadingError.invalidURL
  }
  guard let data = try? Data(contentsOf: url) else {
    throw MediaLoadingError.unableToLoadData
  }
  guard let image = UIImage(data: data) else {
    throw MediaLoadingError.unableToCreateImage
  }
  return image
}
