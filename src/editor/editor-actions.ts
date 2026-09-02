// Fabric 5 is consumed by the editor without bundled TypeScript declarations.
// @ts-expect-error Fabric's runtime export is available, but its package has no declarations.
import { Path } from "fabric";

type Editor = any;

export const editableObjects = (editor: Editor) =>
  (editor.canvas?.getObjects() ?? []).filter(
    (object: any) => object.id !== "originalImage" && !object.isBlurPatch,
  );

export const addShape = (editor: Editor, shape: "rectangle" | "circle") => editor.shapes.add(shape);
export const addText = (editor: Editor, text = "Your message") => editor.text.add(text);
export const addBlur = (editor: Editor) => editor.blur.add();

export const drawStroke = (
  editor: Editor,
  points: Array<{ x: number; y: number }>,
  color?: string,
  width?: number,
) => {
  if (!editor.canvas || points.length < 2) return false;
  const pathData = points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
  const path = new Path(pathData, {
    fill: "transparent",
    stroke: color ?? editor.style.color,
    strokeWidth: width ?? editor.style.strokeWidth,
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

export const moveSelected = (editor: Editor, x: number, y: number) =>
  updateSelected(editor, { left: x, top: y });

export const updateSelected = (editor: Editor, updates: Record<string, unknown>) => {
  const selected = editor.selection.selected;
  if (!selected) return false;
  selected.set(updates);
  selected.setCoords();
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
  x: object.left ?? 0,
  y: object.top ?? 0,
  width: object.getScaledWidth(),
  height: object.getScaledHeight(),
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
  const dataUrl = editor.exportToDataURL("png", 1);
  if (!dataUrl) return false;
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = "image-editor-export.png";
  link.click();
  return true;
};
