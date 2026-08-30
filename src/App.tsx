import { useMemo } from "react";
import { createStoreLogic, useSelector, useStore } from "@xstate/store-react";
import {
  Circle,
  Download,
  Droplet,
  Redo2,
  Square,
  Trash2,
  Type,
  Undo2,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useImageEditor } from "@ozdemircibaris/react-image-editor/core";
import { initializeWebMCPPolyfill } from "@mcp-b/webmcp-polyfill";
import { useWebMCP } from "usewebmcp";
import z from "zod";

import { Button, buttonVariants } from "#components/ui/button";
import { cn } from "#lib/utils";
import { Card, CardContent } from "#components/ui/card";
import { ButtonGroup } from "#components/ui/button-group";
import { toast } from "#components/ui/toast";
import {
  TooltipTrigger,
  TooltipContent,
  Tooltip,
} from "#components/ui/tooltip";

import sampleImage from "./assets/hero.png";

initializeWebMCPPolyfill();

type Shape = "rectangle" | "circle";

const schema = (properties: object, required: string[] = []) => ({
  type: "object",
  properties,
  ...(required.length ? { required } : {}),
});

const imageEditorLogic = createStoreLogic({
  schemas: {
    context: z.object({
      imageUrl: z.string().optional(),
    }),
    emitted: {
      showToast: z.object({
        text: z.string(),
      }),
    },
  },

  context: () => ({
    imageUrl: sampleImage,
  }),

  on: {
    onUpload: (context, event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !file.type.startsWith("image/")) return context;

      return context;
    },
  },
});

const App = () => {
  const store = useStore(imageEditorLogic);
  const imageUrl = useSelector(store, (state) => state.context.imageUrl);

  const editor = useImageEditor({ imageUrl });

  const exportImage = () => {};

  const addShape = (shape: Shape) => {
    editor.shapes.add(shape);
    toast.add({
      title: `${shape === "rectangle" ? "Rectangle" : "Circle"} added`,
    });
  };

  const addText = (text = "Your message") => {
    editor.text.add(text);
    toast.add({ title: "Text added — drag to reposition" });
  };

  const addBlur = () => {
    editor.blur.add();
    toast.add({ title: "Blur added — drag to reposition" });
  };

  const deleteSelected = () => {
    if (editor.selection.selected) {
      editor.selection.deleteSelected();
      toast.add({
        title:
          "The selected " + editor.selection.selected.shapeType + " deleted",
      });
    }
  };

  // WebMCP — only for actions that exist in this App.tsx (uses usewebmcp)
  const status = useMemo(() => ({ hasImage: editor.hasImage }), [editor.hasImage]);

  useWebMCP({
    name: "image_editor_add_text",
    description: "Add editable text to the image.",
    inputSchema: schema({ text: { type: "string" } }) as any,
    execute: (({ text }: { text?: string }) => {
      addText(text);
      return "Text added.";
    }) as any,
  });
  useWebMCP({
    name: "image_editor_add_shape",
    description: "Add a rectangle or circle.",
    inputSchema: schema({ shape: { type: "string", enum: ["rectangle", "circle"] } }, ["shape"]) as any,
    execute: (({ shape }: { shape: Shape }) => {
      addShape(shape);
      return `${shape} added.`;
    }) as any,
  });
  useWebMCP({
    name: "image_editor_add_blur",
    description: "Add a movable blur region.",
    inputSchema: schema({}) as any,
    execute: (() => {
      addBlur();
      return "Blur region added.";
    }) as any,
  });
  useWebMCP({
    name: "image_editor_delete_selected",
    description: "Delete the selected object.",
    inputSchema: schema({}) as any,
    execute: (() => {
      deleteSelected();
      return "Selected object deleted.";
    }) as any,
  });
  useWebMCP({
    name: "image_editor_history",
    description: "Undo or redo an image edit.",
    inputSchema: schema({ action: { type: "string", enum: ["undo", "redo"] } }, ["action"]) as any,
    execute: (({ action }: { action: "undo" | "redo" }) => {
      if (action === "undo") editor.history.undo();
      else editor.history.redo();
      return `${action} complete.`;
    }) as any,
  });
  useWebMCP({
    name: "image_editor_zoom",
    description: "Zoom in, out, or reset.",
    inputSchema: schema({ action: { type: "string", enum: ["in", "out", "reset"] } }, ["action"]) as any,
    execute: (({ action }: { action: "in" | "out" | "reset" }) => {
      if (action === "in") editor.zoom.in();
      else if (action === "out") editor.zoom.out();
      else editor.zoom.reset();
      return `Zoom ${action}.`;
    }) as any,
  });
  useWebMCP({
    name: "image_editor_get_status",
    description: "Read editor status.",
    inputSchema: schema({}) as any,
    annotations: { readOnlyHint: true },
    execute: (() => ({
      ...status,
      drawing: editor.drawing.isActive,
      cropping: editor.crop.isActive,
      zoom: editor.zoom.level,
    })) as any,
  });

  const renderToolbar = () => (
    <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div>
        <ButtonGroup>
          <ButtonGroup>
            <Button
              size="icon"
              variant="outline"
              disabled={!editor.history.canUndo}
              onClick={editor.history.undo}
              aria-label="Undo"
            >
              <Undo2 />
            </Button>
            <Button
              size="icon"
              variant="outline"
              disabled={!editor.history.canRedo}
              onClick={editor.history.redo}
              aria-label="Redo"
            >
              <Redo2 />
            </Button>
          </ButtonGroup>

          <ButtonGroup>
            <ButtonGroup>
              <Button
                variant="outline"
                size="icon"
                aria-label="Text"
                onClick={() => addText()}
              >
                <Tooltip>
                  <TooltipTrigger>
                    <Type className="size-3.5" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={15}>
                    Add Text
                  </TooltipContent>
                </Tooltip>
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Blur"
                onClick={() => addBlur()}
              >
                <Tooltip>
                  <TooltipTrigger>
                    <Droplet className="size-3.5" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={15}>
                    Add Blur
                  </TooltipContent>
                </Tooltip>
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Rectangle"
                onClick={() => addShape("rectangle")}
              >
                <Tooltip>
                  <TooltipTrigger>
                    <Square />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={15}>
                    Add Rectangle
                  </TooltipContent>
                </Tooltip>
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Circle"
                onClick={() => addShape("circle")}
              >
                <Tooltip>
                  <TooltipTrigger>
                    <Circle />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={15}>
                    Add Circle
                  </TooltipContent>
                </Tooltip>
              </Button>
            </ButtonGroup>
          </ButtonGroup>

          <ButtonGroup>
            <Button
              variant="outline"
              size="icon"
              onClick={() => editor.zoom.out()}
              aria-label="Zoom out"
            >
              <ZoomOut className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={() => editor.zoom.reset()}
            >
              {Math.round(editor.zoom.level * 100)}%
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => editor.zoom.in()}
              aria-label="Zoom in"
            >
              <ZoomIn />
            </Button>
          </ButtonGroup>

          <ButtonGroup>
            <Button
              variant="outline"
              size="icon"
              aria-label="Delete Selection"
              onClick={deleteSelected}
              disabled={!editor.selection.selected}
            >
              <Trash2 />
            </Button>
          </ButtonGroup>
        </ButtonGroup>
      </div>

      <div className="min-w-0">
        {/* <p className="truncate text-sm font-medium">{notice}</p> */}
        <p className="text-xs text-muted-foreground">
          {editor.crop.isActive
            ? "Drag handles to adjust crop"
            : editor.drawing.isActive
              ? "Drawing mode — paint directly on canvas"
              : "Select objects to edit · scroll to zoom"}
        </p>
      </div>
    </div>
  );

  const renderHeader = () => (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-xl">
      <div className="flex items-center mx-auto max-w-7xl h-14 justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Image Editor
        </h1>
        <div className="flex items-center gap-2">
          <label
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "rounded-full cursor-pointer",
            )}
          >
            <Upload className="size-3.5" />
            Upload
            <input
              type="file"
              accept="image/*"
              onChange={(e) => store.trigger.onUpload(e)}
              className="hidden"
            />
          </label>
          <Button size="sm" className="rounded-full" onClick={exportImage}>
            <Download className="size-3.5" />
            Export PNG
          </Button>
        </div>
      </div>
    </header>
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      {renderHeader()}

      {/* Main */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-auto">
          <Card className="flex flex-col overflow-hidden py-0 gap-0">
            {renderToolbar()}

            <CardContent className="bg-muted/50">
              <div className="flex justify-center">
                <div className="rounded-2xl bg-card p-2 shadow-sm ring-1 ring-border">
                  <div className="overflow-hidden rounded-xl bg-card [&_canvas]:block [&_canvas]:max-w-full [&_canvas]:h-auto">
                    <canvas ref={editor.canvasRef} className="block" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <footer className="mt-6 flex justify-center">
          <p className="text-center text-xs text-muted-foreground">
            Image editor that can be used by Humans and Agents (via WebMCP).{" "}
            Developed by{" "}
            <a
              className="text-primary hover:text-primary/80 underline-offset-4 hover:underline"
              href="https://sasivarnan.com"
            >
              Sasivarnan R
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
};

export default App;
