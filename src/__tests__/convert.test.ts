import {
  framePointToView,
  frameRectLTRBToView,
  frameRectXYWHToView,
  frameRectToView,
  ltrbToXywh,
  clampToDims,
} from "../shared/convert"; // Adjust the import path to where your module is located
import {
  type Dims,
  type Point,
  type RectLTRB,
  type RectXYWH,
  type ResizeMode,
} from "../shared/types";

describe("Image Frame Transformation Utilities", () => {
  describe("framePointToView", () => {
    it("should correctly transform a point in contain mode", () => {
      const pointOrig: Point = { x: 10, y: 20 };
      const frameDims: Dims = { width: 100, height: 200 };
      const viewDims: Dims = { width: 200, height: 400 };
      const mode: ResizeMode = "contain";
      const mirrored = false;

      const transformed = framePointToView(
        pointOrig,
        frameDims,
        viewDims,
        mode,
        mirrored
      );
      expect(transformed).toEqual({ x: 20, y: 40 });
    });

    it("should correctly transform and mirror a point in cover mode", () => {
      const pointOrig: Point = { x: 10, y: 20 };
      const frameDims: Dims = { width: 100, height: 200 };
      const viewDims: Dims = { width: 200, height: 100 };
      const mode: ResizeMode = "cover";
      const mirrored = true;

      const transformed = framePointToView(
        pointOrig,
        frameDims,
        viewDims,
        mode,
        mirrored
      );
      expect(transformed).toEqual({ x: 180, y: -110 });
    });

    // Additional tests for edge cases, etc.
  });

  describe("frameRectLTRBToView", () => {
    it("should transform a LTRB rectangle correctly", () => {
      const rect: RectLTRB = { left: 10, top: 10, right: 90, bottom: 190 };
      const frameDims: Dims = { width: 100, height: 200 };
      const viewDims: Dims = { width: 200, height: 400 };
      const mode: ResizeMode = "contain";
      const mirrored = false;

      const transformed = frameRectLTRBToView(
        rect,
        frameDims,
        viewDims,
        mode,
        mirrored
      );
      expect(transformed).toEqual({
        left: 20,
        top: 20,
        right: 180,
        bottom: 380,
      });
    });

    // Additional tests for edge cases, etc.
  });

  describe("frameRectXYWHToView", () => {
    it("should transform an XYWH rectangle correctly", () => {
      const rect: RectXYWH = { x: 10, y: 10, width: 80, height: 180 };
      const frameDims: Dims = { width: 100, height: 200 };
      const viewDims: Dims = { width: 200, height: 400 };
      const mode: ResizeMode = "contain";
      const mirrored = false;

      const transformed = frameRectXYWHToView(
        rect,
        frameDims,
        viewDims,
        mode,
        mirrored
      );
      expect(transformed).toEqual({ x: 20, y: 20, width: 160, height: 360 });
    });

    // Additional tests for edge cases, etc.
  });

  describe("frameRectToView", () => {
    it("should handle RectLTRB inputs correctly", () => {
      const rect: RectLTRB = { left: 10, top: 20, right: 50, bottom: 100 };
      const frameDims: Dims = { width: 100, height: 200 };
      const viewDims: Dims = { width: 300, height: 600 };
      const mode: ResizeMode = "contain";
      const mirrored = false;

      const transformed = frameRectToView(
        rect,
        frameDims,
        viewDims,
        mode,
        mirrored
      );
      expect(transformed).toEqual({
        left: 30,
        top: 60,
        right: 150,
        bottom: 300,
      });
    });

    it("should handle RectXYWH inputs correctly", () => {
      const rect: RectXYWH = { x: 10, y: 20, width: 40, height: 80 };
      const frameDims: Dims = { width: 100, height: 200 };
      const viewDims: Dims = { width: 300, height: 600 };
      const mode: ResizeMode = "cover";
      const mirrored = true;

      const transformed = frameRectToView(
        rect,
        frameDims,
        viewDims,
        mode,
        mirrored
      );
      expect(transformed).toEqual({ x: 150, y: 60, width: 120, height: 240 });
    });

    // Additional tests for edge cases, etc.
  });

  describe("frameRectToView and ltbrToXywh", () => {
    it("should transform a bounding box correctly", () => {
      const data = {
        frameSize: { width: 480, height: 640 },
        viewSize: { height: 600, width: 360 },
        bb0: { left: 0, top: 200, right: 480, bottom: 640 },
        r: {
          x: 0,
          y: (200 * 600) / 640,
          width: 360,
          height: 600 - (200 * 600) / 640,
        },
        mirrored: true,
      };
      const transformed = clampToDims(
        frameRectToView(
          ltrbToXywh(data.bb0),
          data.frameSize,
          data.viewSize,
          "cover",
          data.mirrored
        ),
        data.viewSize
      );
      expect(transformed).toEqual(data.r);
    });
  });

  describe("ltrbToXywh and clampToDims", () => {
    it("should convert LTRB to XYWH correctly", () => {
      const ltrb: RectLTRB = { left: 10, top: 10, right: 90, bottom: 100 };
      const xywh = ltrbToXywh(ltrb);
      expect(xywh).toEqual({ x: 10, y: 10, width: 80, height: 90 });
    });

    it("should clamp XYWH rectangle within dimensions", () => {
      const rect: RectXYWH = { x: -10, y: 300, width: 500, height: 500 };
      const dims: Dims = { width: 400, height: 400 };

      const clamped = clampToDims(rect, dims);
      expect(clamped).toEqual({ x: 0, y: 300, width: 400, height: 100 });
    });

    // Additional tests for edge cases, etc.
  });

  describe("Image Frame Transformation Tests", () => {
    const testcases = [
      {
        frame: { width: 400, height: 400 },
        view: { width: 200, height: 300 },
        mode: "cover" as ResizeMode,
        rect: { x: 0, y: 0, width: 400, height: 400 },
        target: { x: 100, y: 200 },
        expected: {
          lt: { x: -50, y: 0 },
          rb: { x: 250, y: 300 },
          trg: { x: 25, y: 150 },
        },
      },
      {
        frame: { width: 200, height: 400 },
        view: { width: 200, height: 200 },
        mode: "cover" as ResizeMode,
        rect: { x: 0, y: 0, width: 200, height: 400 },
        target: { x: 100, y: 100 },
        expected: {
          lt: { x: 0, y: -100 },
          rb: { x: 200, y: 300 },
          trg: { x: 100, y: 0 },
        },
      },
      {
        frame: { width: 400, height: 400 },
        view: { width: 200, height: 300 },
        mode: "contain" as ResizeMode,
        rect: { x: 0, y: 0, width: 400, height: 400 },
        target: { x: 100, y: 200 },
        expected: {
          lt: { x: 0, y: 50 },
          rb: { x: 200, y: 250 },
          trg: { x: 50, y: 150 },
        },
      },
      {
        frame: { width: 200, height: 400 },
        view: { width: 200, height: 200 },
        mode: "contain" as ResizeMode,
        rect: { x: 0, y: 0, width: 200, height: 400 },
        target: { x: 100, y: 100 },
        expected: {
          lt: { x: 50, y: 0 },
          rb: { x: 150, y: 200 },
          trg: { x: 100, y: 50 },
        },
      },
    ];

    test.each(testcases)(
      "Testing transformations with frame and view dimensions",
      ({ frame, view, mode, rect, target, expected }) => {
        const lt = framePointToView({ x: 0, y: 0 }, frame, view, mode, false);
        const trg = framePointToView(target, frame, view, mode, false);
        const rb = framePointToView(
          { x: rect.x + rect.width, y: rect.y + rect.height },
          frame,
          view,
          mode,
          false
        );

        expect(lt).toEqual({ x: expected.lt.x, y: expected.lt.y });
        expect(trg).toEqual({ x: expected.trg.x, y: expected.trg.y });
        expect(rb).toEqual({ x: expected.rb.x, y: expected.rb.y });
      }
    );
  });
});
