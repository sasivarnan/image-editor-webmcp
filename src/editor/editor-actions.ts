// Fabric 5 is consumed by the editor without bundled TypeScript declarations.
// @ts-expect-error Fabric's runtime export is available, but its package has no declarations.
import { fabric } from "fabric";

type Editor = any;
type Point = { x: number; y: number };
type ImageMetrics = {
  left: number;
  top: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
};

export const getImageMetrics = (editor: Editor): ImageMetrics | null => {
  const image =
    editor.originalImage ??
    editor.canvas?.getObjects().find((object: any) => object.id === "originalImage");
  if (!image) return null;

  const sourceWidth = image.originalWidth ?? image.width ?? image.getScaledWidth();
  const sourceHeight = image.originalHeight ?? image.height ?? image.getScaledHeight();
  const width = image.getScaledWidth();
  const height = image.getScaledHeight();

  return {
    left: image.left ?? 0,
    top: image.top ?? 0,
    width,
    height,
    scaleX: width / sourceWidth,
    scaleY: height / sourceHeight,
  };
};

const imageToCanvasPoint = (metrics: ImageMetrics, point: Point): Point => ({
  x: metrics.left + point.x * metrics.scaleX,
  y: metrics.top + point.y * metrics.scaleY,
});

const clampObjectToImage = (object: any, metrics: ImageMetrics) => {
  const bounds = object.getBoundingRect(true, true);
  let correctionX = 0;
  let correctionY = 0;

  if (bounds.left < metrics.left) correctionX = metrics.left - bounds.left;
  else if (bounds.left + bounds.width > metrics.left + metrics.width)
    correctionX = metrics.left + metrics.width - (bounds.left + bounds.width);

  if (bounds.top < metrics.top) correctionY = metrics.top - bounds.top;
  else if (bounds.top + bounds.height > metrics.top + metrics.height)
    correctionY = metrics.top + metrics.height - (bounds.top + bounds.height);

  if (correctionX || correctionY) {
    object.set({
      left: (object.left ?? 0) + correctionX,
      top: (object.top ?? 0) + correctionY,
    });
    object.setCoords();
  }
};

export const editableObjects = (editor: Editor) =>
  (editor.canvas?.getObjects() ?? []).filter(
    (object: any) => object.id !== "originalImage" && !object.isBlurPatch,
  );

export const addShape = (editor: Editor, shape: "rectangle" | "circle") => editor.shapes.add(shape);
export const addText = (editor: Editor, text = "Your message") => editor.text.add(text);
export const addBlur = async (
  editor: Editor,
  options: { x?: number; y?: number; width?: number; height?: number } = {},
) => {
  if (!editor.canvas) return false;
  const existingIds = new Set(
    editableObjects(editor).map((object: any) => object.id),
  );
  editor.blur.add();

  const blurRect = editableObjects(editor).find(
    (object: any) => object.id?.startsWith("blur-") && !existingIds.has(object.id),
  );
  if (!blurRect) return false;

  const metrics = getImageMetrics(editor);
  if (metrics && Object.keys(options).length) {
    const nextWidth = options.width ?? blurRect.getScaledWidth() / metrics.scaleX;
    const nextHeight = options.height ?? blurRect.getScaledHeight() / metrics.scaleY;
    const nextPoint = imageToCanvasPoint(metrics, {
      x: options.x ?? (blurRect.left - metrics.left) / metrics.scaleX,
      y: options.y ?? (blurRect.top - metrics.top) / metrics.scaleY,
    });

    blurRect.set({
      left: nextPoint.x,
      top: nextPoint.y,
      scaleX: (nextWidth * metrics.scaleX) / (blurRect.width || 1),
      scaleY: (nextHeight * metrics.scaleY) / (blurRect.height || 1),
    });
    blurRect.setCoords();
    clampObjectToImage(blurRect, metrics);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    blurRect.fire("modified", { target: blurRect });
    editor.canvas.renderAll();
    editor.history.save();
  }

  return true;
};

export const drawStroke = (
  editor: Editor,
  points: Point[],
  color?: string,
  width?: number,
) => {
  const metrics = getImageMetrics(editor);
  if (!editor.canvas || !metrics || points.length < 2) return false;
  const canvasPoints = points.map((point) => imageToCanvasPoint(metrics, point));
  const pathData = canvasPoints
    .map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`)
    .join(" ");
  const path = new fabric.Path(pathData, {
    fill: "transparent",
    stroke: color ?? editor.style.color,
    strokeWidth: (width ?? editor.style.strokeWidth) * metrics.scaleX,
    strokeLineCap: "round",
    strokeLineJoin: "round",
    selectable: true,
    evented: true,
    objectCaching: false,
  });
  path.isDrawing = true;
  path.id = `drawing-${Date.now()}`;
  editor.canvas.add(path);
  editor.canvas.setActiveObject(path);
  editor.canvas.renderAll();
  editor.history.save();
  return true;
};

export const drawArrow = (
  editor: Editor,
  start: { x: number; y: number },
  end: { x: number; y: number },
  color?: string,
  width?: number,
) => {
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const headLength = Math.max(12, (width ?? editor.style.strokeWidth) * 3);
  const points = [
    start,
    end,
    { x: end.x - headLength * Math.cos(angle - Math.PI / 6), y: end.y - headLength * Math.sin(angle - Math.PI / 6) },
    end,
    { x: end.x - headLength * Math.cos(angle + Math.PI / 6), y: end.y - headLength * Math.sin(angle + Math.PI / 6) },
  ];
  return drawStroke(editor, points, color, width);
};

export const moveSelected = (editor: Editor, x: number, y: number) => {
  const canvas = editor.canvas;
  const selected = editor.selection.selected;
  const metrics = getImageMetrics(editor);
  if (!canvas || !selected || !metrics) return false;

  const canvasPoint = imageToCanvasPoint(metrics, { x, y });
  const currentBounds = selected.getBoundingRect(true, true);
  selected.set({
    left: (selected.left ?? 0) + canvasPoint.x - currentBounds.left,
    top: (selected.top ?? 0) + canvasPoint.y - currentBounds.top,
  });
  selected.setCoords();
  clampObjectToImage(selected, metrics);
  canvas.setActiveObject(selected);
  selected.setCoords();

  // Blur regions listen for Fabric's modification event to regenerate their
  // linked, non-selectable blur patch after the visible rectangle moves.
  selected.fire("modified", { target: selected });
  canvas.requestRenderAll();
  editor.history.save();
  return true;
};

export const updateSelected = (editor: Editor, updates: Record<string, unknown>) => {
  const selected = editor.selection.selected;
  if (!selected) return false;
  selected.set(updates);
  selected.setCoords();
  editor.canvas?.renderAll();
  editor.history.save();
  return true;
};

export const resizeSelected = (editor: Editor, width: number, height: number) => {
  const selected = editor.selection.selected;
  const metrics = getImageMetrics(editor);
  if (!selected || !metrics) return false;

  selected.set({
    scaleX: (width * metrics.scaleX) / (selected.width || 1),
    scaleY: (height * metrics.scaleY) / (selected.height || 1),
  });
  selected.setCoords();
  clampObjectToImage(selected, metrics);
  selected.fire("modified", { target: selected });
  editor.canvas?.renderAll();
  editor.history.save();
  return true;
};

export const selectObject = (editor: Editor, id: string) => {
  const object = editableObjects(editor).find((candidate: any) => candidate.id === id);
  if (!object || !editor.canvas) return false;
  editor.selection.enable();
  editor.canvas.setActiveObject(object);
  editor.canvas.renderAll();
  return true;
};

export const describeObject = (editor: Editor, object: any) => ({
  id: object.id ?? null,
  type: object.shapeType ?? (object.isDrawing ? "drawing" : object.type),
  ...(() => {
    const metrics = getImageMetrics(editor);
    const bounds = object.getBoundingRect(true, true);
    return metrics
      ? {
          x: (bounds.left - metrics.left) / metrics.scaleX,
          y: (bounds.top - metrics.top) / metrics.scaleY,
          width: bounds.width / metrics.scaleX,
          height: bounds.height / metrics.scaleY,
        }
      : {
          x: bounds.left,
          y: bounds.top,
          width: bounds.width,
          height: bounds.height,
        };
  })(),
  angle: object.angle ?? 0,
  selected: object === editor.selection.selected,
});

export const clearAll = (editor: Editor) => {
  if (!editor.canvas) return false;
  editableObjects(editor).forEach((object: any) => editor.canvas.remove(object));
  editor.blur.clearAll();
  editor.canvas.discardActiveObject();
  editor.canvas.renderAll();
  editor.history.save();
  return true;
};

export const exportImage = (editor: Editor) => {
  const canvas = editor.canvas;
  const blurRects = (editor.canvas?.getObjects() ?? []).filter(
    (object: any) => object.id?.startsWith("blur-") && !object.isBlurPatch,
  );
  const blurRectIndexes = blurRects.map((object: any) => ({
    object,
    index: canvas?.getObjects().indexOf(object) ?? -1,
  }));
  const activeObject = canvas?.getActiveObject();

  // Fabric's PNG renderer can retain the guide's stroke even when it is hidden.
  // Remove the editable rectangle outright while rasterizing; its linked blur
  // patch stays on the canvas and supplies the actual effect.
  blurRects.forEach((object: any) => {
    canvas?.remove(object);
  });

  let dataUrl: string | null = null;
  try {
    dataUrl = editor.exportToDataURL("png", 1);
  } finally {
    blurRectIndexes.forEach(({ object, index }: any) => {
      canvas?.insertAt(object, index);
    });
    if (activeObject) canvas?.setActiveObject(activeObject);
    canvas?.requestRenderAll();
  }

  if (!dataUrl) return false;
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = "image-editor-export.png";
  link.click();
  return true;
};
