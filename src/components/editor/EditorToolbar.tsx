import {
  Circle,
  Crop,
  Droplet,
  Redo2,
  Square,
  Type,
  Undo2,
  ZoomIn,
  ZoomOut,
  Palette,
  Pipette,
  SlidersHorizontal,
  Pencil,
} from "lucide-react";
import { Button } from "#components/ui/button";
import { ButtonGroup } from "#components/ui/button-group";
import { Slider } from "#components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "#components/ui/dropdown-menu";
import { IconTooltipButton } from "./IconTooltipButton";

const COLOR_SWATCHES = [
  "#4f46e5",
  "#111827",
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#ec4899",
  "#ffffff",
];

type EditorToolbarProps = {
  editor: any;
  color: string;
  strokeWidth: number;
  setActiveColor: (color: string) => void;
  setActiveStroke: (width: number) => void;
  addText: () => void;
  addBlur: () => void;
  addShape: (shape: "rectangle" | "circle") => void;
  renderContextualTools: () => React.ReactNode;
};

export function EditorToolbar(props: EditorToolbarProps) {
  const {
    editor,
    color,
    strokeWidth,
    setActiveColor,
    setActiveStroke,
    addText,
    addBlur,
    addShape,
    renderContextualTools,
  } = props;
  return (
    <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div>
        <ButtonGroup className="flex-wrap gap-2">
          <ButtonGroup>
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Choose color"
                title="Choose color"
                className="flex h-9 items-center gap-2 rounded-4xl border bg-background px-3 text-sm font-medium shadow-sm hover:bg-accent"
              >
                <span
                  className="size-4 rounded-full border"
                  style={{ backgroundColor: color }}
                />
                <Palette className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Choose a color
                </p>
                <div className="flex flex-wrap gap-2">
                  {COLOR_SWATCHES.map((swatch) => (
                    <button
                      key={swatch}
                      type="button"
                      aria-label={`Set color ${swatch}`}
                      title={`Set color ${swatch}`}
                      onClick={() => setActiveColor(swatch)}
                      className="size-7 rounded-full border shadow-sm transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      style={{
                        backgroundColor: swatch,
                        borderColor: swatch === "#ffffff" ? "#d4d4d8" : swatch,
                        boxShadow:
                          color === swatch
                            ? `0 0 0 2px ${swatch}, 0 0 0 4px white`
                            : undefined,
                      }}
                    />
                  ))}
                  <label className="relative flex size-7 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-foreground/30 bg-[conic-gradient(#ef4444,#f59e0b,#10b981,#06b6d4,#4f46e5,#ec4899,#ef4444)] text-sm font-medium shadow-sm transition-transform hover:scale-110">
                    <input
                      type="color"
                      value={color}
                      onChange={(event) => setActiveColor(event.target.value)}
                      aria-label="Choose a custom color"
                      title="Choose custom color"
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                    <span
                      className="pointer-events-none flex size-5 items-center justify-center rounded-full bg-white/90 text-foreground"
                      aria-hidden="true"
                    >
                      <Pipette className="size-3" />
                    </span>
                  </label>
                </div>
                <p className="mt-2 font-mono text-xs text-muted-foreground">
                  {color}
                </p>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label={`Stroke width ${strokeWidth}px`}
                title={`Stroke width ${strokeWidth}px`}
                className="flex size-9 items-center justify-center rounded-4xl border bg-background shadow-sm hover:bg-accent"
              >
                <SlidersHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">
                    Stroke width
                  </p>
                  <span className="font-mono text-xs text-muted-foreground">
                    {strokeWidth}px
                  </span>
                </div>
                <Slider
                  value={[strokeWidth]}
                  min={1}
                  max={32}
                  step={1}
                  onValueChange={(value) =>
                    setActiveStroke((value as number[])[0])
                  }
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </ButtonGroup>

          <ButtonGroup>
            <IconTooltipButton
              variant="outline"
              size="icon"
              onClick={editor.crop.start}
              disabled={editor.crop.isActive}
              aria-label="Start crop"
              label="Start crop"
            >
              <Crop />
            </IconTooltipButton>
            {editor.crop.isActive && (
              <>
                <Button variant="outline" size="sm" onClick={editor.crop.apply}>
                  Apply crop
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={editor.crop.cancel}
                >
                  Cancel
                </Button>
              </>
            )}
          </ButtonGroup>
          <ButtonGroup>
            <IconTooltipButton
              size="icon"
              variant="outline"
              disabled={!editor.history.canUndo}
              onClick={editor.history.undo}
              aria-label="Undo"
              label="Undo"
            >
              <Undo2 />
            </IconTooltipButton>
            <IconTooltipButton
              size="icon"
              variant="outline"
              disabled={!editor.history.canRedo}
              onClick={editor.history.redo}
              aria-label="Redo"
              label="Redo"
            >
              <Redo2 />
            </IconTooltipButton>
          </ButtonGroup>

          <ButtonGroup>
            <ButtonGroup>
              <IconTooltipButton
                variant="outline"
                size="icon"
                aria-label="Text"
                label="Add text"
                onClick={() => addText()}
              >
                <Type className="size-3.5" />
              </IconTooltipButton>
              <IconTooltipButton
                variant="outline"
                size="icon"
                aria-label="Blur"
                label="Add blur"
                onClick={() => addBlur()}
              >
                <Droplet className="size-3.5" />
              </IconTooltipButton>
              <IconTooltipButton
                variant="outline"
                size="icon"
                aria-label="Rectangle"
                label="Add rectangle"
                onClick={() => addShape("rectangle")}
              >
                <Square />
              </IconTooltipButton>
              <IconTooltipButton
                variant="outline"
                size="icon"
                aria-label="Circle"
                label="Add circle"
                onClick={() => addShape("circle")}
              >
                <Circle />
              </IconTooltipButton>
              <IconTooltipButton
                variant="outline"
                size="icon"
                onClick={editor.drawing.toggle}
                aria-label="Free draw"
                label={editor.drawing.isActive ? "Stop free draw" : "Free draw"}
              >
                <Pencil />
              </IconTooltipButton>
            </ButtonGroup>
          </ButtonGroup>

          <ButtonGroup>
            <IconTooltipButton
              variant="outline"
              size="icon"
              onClick={() => editor.zoom.out()}
              aria-label="Zoom out"
              label="Zoom out"
            >
              <ZoomOut className="size-3.5" />
            </IconTooltipButton>
            <Button
              variant="outline"
              size="default"
              onClick={() => editor.zoom.reset()}
            >
              {Math.round(editor.zoom.level * 100)}%
            </Button>
            <IconTooltipButton
              variant="outline"
              size="icon"
              onClick={() => editor.zoom.in()}
              aria-label="Zoom in"
              label="Zoom in"
            >
              <ZoomIn />
            </IconTooltipButton>
          </ButtonGroup>

          {renderContextualTools()}
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
}
