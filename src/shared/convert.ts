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

export function denormalizePoint(p: Point, dims: Dims): Point {
  return {
    x: p.x * dims.width,
    y: p.y * dims.height,
  };
}
// both cover and contain preserve aspect ratio. Cover will crop the image to fill the view, contain will show the whole image and add padding.
// for cover, if the aspect ratio x/y of the frame is greater than
export function framePointToView(
  pointOrig: Point,
  frameDims: Dims,
  viewDims: Dims,
  mode: ResizeMode,
  mirrored: boolean
): Point {
  const frameRatio = frameDims.width / frameDims.height;
  const viewRatio = viewDims.width / viewDims.height;
  const point = mirrored
    ? { x: frameDims.width - pointOrig.x, y: pointOrig.y }
    : pointOrig;
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
  const result = {
    x: point.x * scale + xoffset,
    y: point.y * scale + yoffset,
  };
  return result;
}

export function frameRectLTRBToView(
  rect: RectLTRB,
  frameDims: Dims,
  viewDims: Dims,
  mode: ResizeMode,
  mirrored: boolean
): RectLTRB {
  const lt = framePointToView(
    { x: rect.left, y: rect.top },
    frameDims,
    viewDims,
    mode,
    mirrored
  );
  const rb = framePointToView(
    { x: rect.right, y: rect.bottom },
    frameDims,
    viewDims,
    mode,
    mirrored
  );
  const left = mirrored ? Math.min(lt.x, rb.x) : lt.x;
  const right = mirrored ? Math.max(lt.x, rb.x) : rb.x;
  return { left, top: lt.y, right, bottom: rb.y };
}

export function frameRectXYWHToView(
  rect: RectXYWH,
  frameDims: Dims,
  viewDims: Dims,
  mode: ResizeMode,
  mirrored: boolean
): RectXYWH {
  const lt = framePointToView(
    { x: rect.x, y: rect.y },
    frameDims,
    viewDims,
    mode,
    mirrored
  );
  const rb = framePointToView(
    { x: rect.x + rect.width, y: rect.y + rect.height },
    frameDims,
    viewDims,
    mode,
    mirrored
  );
  const width = mirrored ? Math.abs(rb.x - lt.x) : rb.x - lt.x;
  const x = mirrored ? lt.x - width : lt.x;
  return { x, y: lt.y, width, height: rb.y - lt.y };
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
  mode: ResizeMode,
  mirrored: boolean
): TRect {
  if (isRectLTRB(rect)) {
    return frameRectLTRBToView(
      rect,
      frameDims,
      viewDims,
      mode,
      mirrored
    ) as TRect;
  } else {
    return frameRectXYWHToView(
      rect,
      frameDims,
      viewDims,
      mode,
      mirrored
    ) as TRect;
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

export function clampToDims<TRect extends RectLTRB | RectXYWH>(
  rect: TRect,
  dims: Dims
): TRect {
  if (isRectLTRB(rect)) {
    const left = Math.max(0, Math.min(rect.left, dims.width));
    const top = Math.max(0, Math.min(rect.top, dims.height));
    const right = Math.max(0, Math.min(rect.right, dims.width));
    const bottom = Math.max(0, Math.min(rect.bottom, dims.height));
    return { left, top, right, bottom } as TRect;
  } else {
    const x = Math.max(0, Math.min(rect.x, dims.width));
    const y = Math.max(0, Math.min(rect.y, dims.height));
    const width = Math.max(0, Math.min(rect.width, dims.width - x));
    const height = Math.max(0, Math.min(rect.height, dims.height - y));
    return { x, y, width, height } as TRect;
  }
}
