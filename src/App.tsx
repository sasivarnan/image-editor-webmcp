import { useSelector, useStore } from "@xstate/store-react";
import { Bold, Eraser, Italic, RotateCcw, RotateCw, Trash2 } from "lucide-react";
import { useImageEditor } from "@ozdemircibaris/react-image-editor/core";
import { initializeWebMCPPolyfill } from "@mcp-b/webmcp-polyfill";

import { Card } from "#components/ui/card";
import { toast } from "#components/ui/toast";
import { ButtonGroup } from "#components/ui/button-group";

import { useImageEditorTools } from "./webmcp/use-image-editor-tools";
import { clearAll as clearAllEditorObjects } from "./editor/editor-actions";
import { EditorHeader } from "./components/editor/EditorHeader";
import { EditorCanvas } from "./components/editor/EditorCanvas";
import { EditorToolbar } from "./components/editor/EditorToolbar";
import { imageEditorLogic } from "./editor/editor-store";
import { IconTooltipButton } from "./components/editor/IconTooltipButton";

initializeWebMCPPolyfill();

type Shape = "rectangle" | "circle";

const App = () => {
  const store = useStore(imageEditorLogic);
  const imageUrl = useSelector(store, (state) => state.context.imageUrl);
  const color = useSelector(store, (state) => state.context.color);
  const strokeWidth = useSelector(store, (state) => state.context.strokeWidth);

  const editor = useImageEditor({ imageUrl });

  const exportImage = () => {
    const dataUrl = editor.exportToDataURL("png", 1);
    if (!dataUrl) return false;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "image-editor-export.png";
    link.click();
    return true;
  };

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

  const setActiveColor = (next: string) => {
    store.trigger.setColor({ color: next });
    editor.style.setColor(next);
    const selected: any = editor.selection.selected;
    if (selected) {
      selected.set(selected.isText ? { fill: next } : { stroke: next });
      selected.setCoords();
      editor.canvas?.renderAll();
      editor.history.save();
    }
  };

  const setActiveStroke = (width: number) => {
    store.trigger.setStrokeWidth({ width });
    editor.style.setStrokeWidth(width);
    const selected: any = editor.selection.selected;
    if (selected) {
      selected.set({ strokeWidth: width });
      selected.setCoords();
      editor.canvas?.renderAll();
      editor.history.save();
    }
  };

  const rotateSelected = (angle: number) => {
    const selected: any = editor.selection.selected;
    if (!selected) return;
    selected.set({ angle: (selected.angle ?? 0) + angle });
    selected.setCoords();
    editor.canvas?.renderAll();
    editor.history.save();
  };

  const styleSelectedText = (
    property: "fontWeight" | "fontStyle",
    value: string,
  ) => {
    const selected: any = editor.selection.selected;
    if (!selected?.isText) return;
    selected.set({ [property]: value });
    editor.canvas?.renderAll();
    editor.history.save();
  };

  const renderContextualTools = () => {
    const selected: any = editor.selection.selected;
    const isBlur = Boolean(selected?.id?.startsWith("blur-"));
    return (
      <>
        {!isBlur && selected && (
          <ButtonGroup>
            <IconTooltipButton
              variant="outline"
              size="icon"
              onClick={() => rotateSelected(-90)}
              aria-label="Rotate left"
              label="Rotate left"
            >
              <RotateCcw />
            </IconTooltipButton>
            <IconTooltipButton
              variant="outline"
              size="icon"
              onClick={() => rotateSelected(90)}
              aria-label="Rotate right"
              label="Rotate right"
            >
              <RotateCw />
            </IconTooltipButton>
          </ButtonGroup>
        )}
        {selected?.isText && (
          <ButtonGroup>
            <IconTooltipButton
              variant="outline"
              size="icon"
              onClick={() => styleSelectedText("fontWeight", "bold")}
              disabled={!editor.selection.selected?.isText}
              aria-label="Bold selected text"
              label="Bold selected text"
            >
              <Bold />
            </IconTooltipButton>
            <IconTooltipButton
              variant="outline"
              size="icon"
              onClick={() => styleSelectedText("fontStyle", "italic")}
              disabled={!editor.selection.selected?.isText}
              aria-label="Italicize selected text"
              label="Italicize selected text"
            >
              <Italic />
            </IconTooltipButton>
          </ButtonGroup>
        )}
        <ButtonGroup>
          <IconTooltipButton
            variant="outline"
            size="icon"
            onClick={() => {
              if (window.confirm("Remove all editable objects?"))
                clearAllEditorObjects(editor);
            }}
            aria-label="Clear all"
            label="Clear all editable objects"
          >
            <Eraser />
          </IconTooltipButton>
          {selected && (
            <IconTooltipButton
              variant="outline"
              size="icon"
              aria-label="Delete selected object"
              label="Delete selected object"
              onClick={deleteSelected}
            >
              <Trash2 />
            </IconTooltipButton>
          )}
        </ButtonGroup>
      </>
    );
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

  useImageEditorTools(editor, (nextImageUrl) => {
    store.trigger.setImageUrl({ imageUrl: nextImageUrl });
  });

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <EditorHeader onUpload={store.trigger.onUpload} onExport={exportImage} />

      {/* Main */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-auto">
          <Card className="flex flex-col overflow-hidden py-0 gap-0">
            <EditorToolbar
              editor={editor}
              color={color}
              strokeWidth={strokeWidth}
              setActiveColor={setActiveColor}
              setActiveStroke={setActiveStroke}
              addText={() => addText()}
              addBlur={() => addBlur()}
              addShape={addShape}
              renderContextualTools={renderContextualTools}
            />

            <EditorCanvas editor={editor} />
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
