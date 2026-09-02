import { useWebMCP } from "usewebmcp";
import { toast } from "#components/ui/toast";
import {
  addBlur,
  addShape,
  addText,
  drawArrow,
  drawStroke,
  clearAll,
  describeObject,
  editableObjects,
  exportImage,
  moveSelected,
  selectObject,
  updateSelected,
} from "../editor/editor-actions";

const schema = (properties: object, required: string[] = []) => ({
  type: "object",
  properties,
  ...(required.length ? { required } : {}),
});

export function useImageEditorTools(editor: any) {
  useWebMCP({
    name: "image_editor_add_text",
    description: "Add editable text to the image.",
    inputSchema: schema({ text: { type: "string" } }) as any,
    execute: (({ text }: any) => {
      addText(editor, text);

      toast.add({ title: "Text added — drag to reposition" });

      return "Text added.";
    }) as any,
  });

  useWebMCP({
    name: "image_editor_add_shape",
    description: "Add a rectangle or circle.",
    inputSchema: schema(
      { shape: { type: "string", enum: ["rectangle", "circle"] } },
      ["shape"],
    ) as any,
    execute: (({ shape }: any) => {
      addShape(editor, shape);

      toast.add({ title: `${shape} added` });

      return `${shape} added.`;
    }) as any,
  });

  useWebMCP({
    name: "image_editor_add_blur",
    description: "Add a movable blur region.",
    inputSchema: schema({}) as any,
    execute: (() => {
      addBlur(editor);

      return "Blur region added.";
    }) as any,
  });
  useWebMCP({
    name: "image_editor_toggle_drawing",
    description: "Toggle freehand drawing mode.",
    inputSchema: schema({}) as any,
    execute: (() => {
      editor.drawing.toggle();
      return "Free drawing mode toggled.";
    }) as any,
  });
  useWebMCP({
    name: "image_editor_draw_stroke",
    description: "Draw an editable freehand stroke using image/canvas coordinates.",
    inputSchema: schema({
      points: { type: "array", minItems: 2, items: { type: "object", properties: { x: { type: "number" }, y: { type: "number" } }, required: ["x", "y"] } },
      color: { type: "string" },
      width: { type: "number", minimum: 1, maximum: 32 },
    }, ["points"]) as any,
    execute: (({ points, color, width }: any) => drawStroke(editor, points, color, width) ? "Freehand stroke drawn." : "At least two points are required.") as any,
  });
  useWebMCP({
    name: "image_editor_draw_arrow",
    description: "Draw an editable arrow using image/canvas coordinates.",
    inputSchema: schema({
      start: { type: "object", properties: { x: { type: "number" }, y: { type: "number" } }, required: ["x", "y"] },
      end: { type: "object", properties: { x: { type: "number" }, y: { type: "number" } }, required: ["x", "y"] },
      color: { type: "string" },
      width: { type: "number", minimum: 1, maximum: 32 },
    }, ["start", "end"]) as any,
    execute: (({ start, end, color, width }: any) => drawArrow(editor, start, end, color, width) ? "Arrow drawn." : "Unable to draw arrow.") as any,
  });

  useWebMCP({
    name: "image_editor_delete_selected",
    description: "Delete the selected object.",
    inputSchema: schema({}) as any,
    execute: (() => {
      editor.selection.deleteSelected();

      return "Selected object deleted.";
    }) as any,
  });

  useWebMCP({
    name: "image_editor_move_selected",
    description: "Move selected object using image/canvas coordinates.",
    inputSchema: schema({ x: { type: "number" }, y: { type: "number" } }, [
      "x",
      "y",
    ]) as any,
    execute: (({ x, y }: any) =>
      moveSelected(editor, x, y)
        ? `Selected object moved to (${x}, ${y}).`
        : "No object is selected.") as any,
  });

  useWebMCP({
    name: "image_editor_list_objects",
    description: "List editable objects and their image/canvas coordinates.",
    inputSchema: schema({}) as any,
    annotations: { readOnlyHint: true },
    execute: (() =>
      editableObjects(editor).map((object: any) =>
        describeObject(editor, object),
      )) as any,
  });

  useWebMCP({
    name: "image_editor_select_object",
    description: "Select an editable object by ID.",
    inputSchema: schema({ id: { type: "string" } }, ["id"]) as any,
    execute: (({ id }: any) =>
      selectObject(editor, id)
        ? `Selected object ${id}.`
        : `Object ${id} not found.`) as any,
  });

  useWebMCP({
    name: "image_editor_set_color",
    description: "Set selected object color and active style.",
    inputSchema: schema({ color: { type: "string" } }, ["color"]) as any,
    execute: (({ color }: any) => {
      editor.style.setColor(color);

      const selected = editor.selection.selected;
      if (selected)
        updateSelected(
          editor,
          selected.isText ? { fill: color } : { stroke: color },
        );

      return `Color set to ${color}.`;
    }) as any,
  });

  useWebMCP({
    name: "image_editor_set_stroke_width",
    description: "Set selected object stroke width.",
    inputSchema: schema(
      { width: { type: "number", minimum: 1, maximum: 32 } },
      ["width"],
    ) as any,
    execute: (({ width }: any) => {
      editor.style.setStrokeWidth(width);

      if (editor.selection.selected)
        updateSelected(editor, { strokeWidth: width });

      return `Stroke width set to ${width}.`;
    }) as any,
  });

  useWebMCP({
    name: "image_editor_resize_selected",
    description: "Resize selected object using canvas-coordinate dimensions.",
    inputSchema: schema(
      {
        width: { type: "number", exclusiveMinimum: 0 },
        height: { type: "number", exclusiveMinimum: 0 },
      },
      ["width", "height"],
    ) as any,
    execute: (({ width, height }: any) => {
      const selected = editor.selection.selected;
      if (!selected) return "No object is selected.";
      return updateSelected(editor, {
        scaleX: width / (selected.width || 1),
        scaleY: height / (selected.height || 1),
      })
        ? `Selected object resized to ${width} by ${height}.`
        : "No object is selected.";
    }) as any,
  });

  useWebMCP({
    name: "image_editor_rotate_selected",
    description: "Set selected object rotation in degrees.",
    inputSchema: schema({ angle: { type: "number" } }, ["angle"]) as any,
    execute: (({ angle }: any) =>
      updateSelected(editor, { angle })
        ? `Selected object rotated to ${angle} degrees.`
        : "No object is selected.") as any,
  });

  useWebMCP({
    name: "image_editor_crop",
    description: "Start, apply, or cancel image cropping.",
    inputSchema: schema(
      { action: { type: "string", enum: ["start", "apply", "cancel"] } },
      ["action"],
    ) as any,
    execute: (async ({ action }: any) => {
      if (action === "start") editor.crop.start();

      if (action === "apply") await editor.crop.apply();

      if (action === "cancel") editor.crop.cancel();

      return `Crop ${action} complete.`;
    }) as any,
  });

  useWebMCP({
    name: "image_editor_export",
    description: "Export the canvas as a PNG download.",
    inputSchema: schema({}) as any,
    execute: (() =>
      exportImage(editor)
        ? "PNG exported."
        : "Unable to export the canvas.") as any,
  });

  useWebMCP({
    name: "image_editor_clear_all",
    description: "Remove all editable objects while preserving the image.",
    inputSchema: schema({}) as any,
    execute: (() =>
      clearAll(editor)
        ? "All editable objects cleared."
        : "Canvas is not ready.") as any,
  });

  useWebMCP({
    name: "image_editor_history",
    description: "Undo or redo an image edit.",
    inputSchema: schema(
      { action: { type: "string", enum: ["undo", "redo"] } },
      ["action"],
    ) as any,
    execute: (({ action }: any) => {
      action === "undo" ? editor.history.undo() : editor.history.redo();

      return `${action} complete.`;
    }) as any,
  });

  useWebMCP({
    name: "image_editor_zoom",
    description: "Zoom in, out, or reset.",
    inputSchema: schema(
      { action: { type: "string", enum: ["in", "out", "reset"] } },
      ["action"],
    ) as any,
    execute: (({ action }: any) => {
      action === "in"
        ? editor.zoom.in()
        : action === "out"
          ? editor.zoom.out()
          : editor.zoom.reset();

      return `Zoom ${action}.`;
    }) as any,
  });

  useWebMCP({
    name: "image_editor_get_status",
    description: "Read editor status.",
    inputSchema: schema({}) as any,
    annotations: { readOnlyHint: true },
    execute: (() => ({
      hasImage: editor.hasImage,
      drawing: editor.drawing.isActive,
      cropping: editor.crop.isActive,
      zoom: editor.zoom.level,
    })) as any,
  });
}
