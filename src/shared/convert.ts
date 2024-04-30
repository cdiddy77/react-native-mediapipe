export type Dims = { width: number; height: number };
export type Point = { x: number; y: number };
export type RectXYWH = { x: number; y: number; width: number; height: number };
export type RectLTRB = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};
export type ResizeMode = "cover" | "contain";

// both cover and contain preserve aspect ratio. Cover will crop the image to fill the view, contain will show the whole image and add padding.
// for cover, if the aspect ratio x/y of the frame is greater than
export function framePointToView(
  point: Point,
  frameDims: Dims,
  viewDims: Dims,
  mode: ResizeMode
): Point {
  const frameRatio = frameDims.width / frameDims.height;
  const viewRatio = viewDims.width / viewDims.height;
  let scale = 1;
  let xoffset = 0;
  let yoffset = 0;
  if (mode === "contain") {
    // contain means that the frame rect will be smaller than the view rect,
    // if the w/h ratio of the frame is greater than the w/h ratio of the view,
    // then equal in the x dimension, smaller in the y dimension
    // else the other way around
    if (frameRatio > viewRatio) {
      scale = viewDims.width / frameDims.width;
      xoffset = 0;
      yoffset = (viewDims.height - frameDims.height * scale) / 2;
    } else {
      scale = viewDims.height / frameDims.height;
      xoffset = (viewDims.width - frameDims.width * scale) / 2;
      yoffset = 0;
    }
  } else {
    if (frameRatio > viewRatio) {
      scale = viewDims.height / frameDims.height;
      xoffset = (viewDims.width - frameDims.width * scale) / 2;
      yoffset = 0;
    } else {
      scale = viewDims.width / frameDims.width;
      xoffset = 0;
      yoffset = (viewDims.height - frameDims.height * scale) / 2;
    }
  }
  return {
    x: point.x * scale + xoffset,
    y: point.y * scale + yoffset,
  };
}

function frameRectLTRBToView(
  rect: RectLTRB,
  frameDims: Dims,
  viewDims: Dims,
  mode: ResizeMode
): RectLTRB {
  const lt = framePointToView(
    { x: rect.left, y: rect.top },
    frameDims,
    viewDims,
    mode
  );
  const rb = framePointToView(
    { x: rect.right, y: rect.bottom },
    frameDims,
    viewDims,
    mode
  );
  return { left: lt.x, top: lt.y, right: rb.x, bottom: rb.y };
}

function frameRectXYWHToView(
  rect: RectXYWH,
  frameDims: Dims,
  viewDims: Dims,
  mode: ResizeMode
): RectXYWH {
  const lt = framePointToView(
    { x: rect.x, y: rect.y },
    frameDims,
    viewDims,
    mode
  );
  const rb = framePointToView(
    { x: rect.x + rect.width, y: rect.y + rect.height },
    frameDims,
    viewDims,
    mode
  );
  return { x: lt.x, y: lt.y, width: rb.x - lt.x, height: rb.y - lt.y };
}

function isRectLTRB(rect: unknown): rect is RectLTRB {
  return (
    typeof rect === "object" &&
    "left" in (rect as object) &&
    "top" in (rect as object) &&
    "right" in (rect as object) &&
    "bottom" in (rect as object)
  );
}

export function frameRectToView<TRect extends RectLTRB | RectXYWH>(
  rect: TRect,
  frameDims: Dims,
  viewDims: Dims,
  mode: ResizeMode
): TRect {
  if (isRectLTRB(rect)) {
    return frameRectLTRBToView(rect, frameDims, viewDims, mode) as TRect;
  } else {
    return frameRectXYWHToView(rect, frameDims, viewDims, mode) as TRect;
  }
}

export function ltrbToXywh(rect: RectLTRB): RectXYWH {
  return {
    x: rect.left,
    y: rect.top,
    width: rect.right - rect.left,
    height: rect.bottom - rect.top,
  };
}
