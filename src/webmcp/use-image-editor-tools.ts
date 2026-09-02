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
  getImageMetrics,
  moveSelected,
  resizeSelected,
  selectObject,
  updateSelected,
} from "../editor/editor-actions";

const schema = (properties: object, required: string[] = []) => ({
  type: "object",
  properties,
  ...(required.length ? { required } : {}),
});

export function useImageEditorTools(
  editor: any,
  onUploadImage?: (imageUrl: string) => void,
) {
  useWebMCP({
    name: "image_editor_upload",
    description:
      "Upload an image from a URL or a base64-encoded image data URL.",
    inputSchema: schema(
      {
        imageUrl: {
          type: "string",
          description:
            "An image URL or a base64-encoded data URL such as data:image/png;base64,...",
        },
      },
      ["imageUrl"],
    ) as any,
    execute: (({ imageUrl }: any) => {
      if (!/^https?:\/\/|^data:image\//i.test(imageUrl)) {
        return "Provide a valid image URL or base64-encoded image data URL.";
      }

      onUploadImage?.(imageUrl);
      return "Image uploaded.";
    }) as any,
  });

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
    description:
      "Add a blur region. Optionally provide x and y for its top-left position and width and height, all in image-local coordinates.",
    inputSchema: schema({
      x: {
        type: "number",
        description: "Top-left x-coordinate relative to the image.",
      },
      y: {
        type: "number",
        description: "Top-left y-coordinate relative to the image.",
      },
      width: {
        type: "number",
        exclusiveMinimum: 0,
        description: "Blur width in image pixels.",
      },
      height: {
        type: "number",
        exclusiveMinimum: 0,
        description: "Blur height in image pixels.",
      },
    }) as any,
    execute: (async (options: any) =>
      (await addBlur(editor, options))
        ? "Blur region added in image coordinates."
        : "Unable to add blur region. Make sure an image is loaded.") as any,
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
    description: "Draw an editable freehand stroke using coordinates relative to the image.",
    inputSchema: schema({
      points: { type: "array", minItems: 2, description: "Points in image-local coordinates.", items: { type: "object", properties: { x: { type: "number", description: "X-coordinate relative to the image." }, y: { type: "number", description: "Y-coordinate relative to the image." } }, required: ["x", "y"] } },
      color: { type: "string" },
      width: { type: "number", minimum: 1, maximum: 32, description: "Stroke width in image pixels." },
    }, ["points"]) as any,
    execute: (({ points, color, width }: any) => drawStroke(editor, points, color, width) ? "Freehand stroke drawn." : "At least two points are required.") as any,
  });
  useWebMCP({
    name: "image_editor_draw_arrow",
    description: "Draw an editable arrow using coordinates relative to the image.",
    inputSchema: schema({
      start: { type: "object", description: "Arrow start in image-local coordinates.", properties: { x: { type: "number" }, y: { type: "number" } }, required: ["x", "y"] },
      end: { type: "object", description: "Arrow end in image-local coordinates.", properties: { x: { type: "number" }, y: { type: "number" } }, required: ["x", "y"] },
      color: { type: "string" },
      width: { type: "number", minimum: 1, maximum: 32, description: "Arrow width in image pixels." },
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
    description:
      "Move the selected object so its visual bounding box top-left is at image-local coordinates. x and y are relative to the image's top-left corner, independent of page coordinates and zoom. The object is clamped inside the image.",
    inputSchema: schema(
      {
        x: {
          type: "number",
          description: "Visual bounding-box top-left x-coordinate relative to the image.",
        },
        y: {
          type: "number",
          description: "Visual bounding-box top-left y-coordinate relative to the image.",
        },
      },
      ["x", "y"],
    ) as any,
    execute: (({ x, y }: any) =>
      moveSelected(editor, x, y)
        ? `Selected object moved to (${x}, ${y}).`
        : "No object is selected.") as any,
  });

  useWebMCP({
    name: "image_editor_list_objects",
    description: "List editable objects and their image-local coordinates.",
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
    name: "image_editor_bold_selected_text",
    description: "Make the selected text object bold.",
    inputSchema: schema({}) as any,
    execute: (() => {
      const selected = editor.selection.selected;
      if (!selected?.isText) return "Select a text object first.";
      return updateSelected(editor, { fontWeight: "bold" })
        ? "Selected text made bold."
        : "Unable to update selected text.";
    }) as any,
  });

  useWebMCP({
    name: "image_editor_italicize_selected_text",
    description: "Italicize the selected text object.",
    inputSchema: schema({}) as any,
    execute: (() => {
      const selected = editor.selection.selected;
      if (!selected?.isText) return "Select a text object first.";
      return updateSelected(editor, { fontStyle: "italic" })
        ? "Selected text italicized."
        : "Unable to update selected text.";
    }) as any,
  });

  useWebMCP({
    name: "image_editor_resize_selected",
    description: "Resize the selected object using dimensions in image pixels.",
    inputSchema: schema(
      {
        width: { type: "number", exclusiveMinimum: 0 },
        height: { type: "number", exclusiveMinimum: 0 },
      },
      ["width", "height"],
    ) as any,
    execute: (({ width, height }: any) => {
      return resizeSelected(editor, width, height)
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
    description: "Read editor status and image-local coordinate metadata.",
    inputSchema: schema({}) as any,
    annotations: { readOnlyHint: true },
    execute: (() => {
      const image = getImageMetrics(editor);
      return {
        hasImage: editor.hasImage,
        drawing: editor.drawing.isActive,
        cropping: editor.crop.isActive,
        zoom: editor.zoom.level,
        coordinateSpace: "image",
        image: image
          ? {
              width: image.width / image.scaleX,
              height: image.height / image.scaleY,
              canvasOrigin: { x: image.left, y: image.top },
              scale: { x: image.scaleX, y: image.scaleY },
            }
          : null,
      };
    }) as any,
  });
}
