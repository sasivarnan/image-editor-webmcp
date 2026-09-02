import { CardContent } from "#components/ui/card";
import { ImageOff } from "lucide-react";

type EditorCanvasProps = { editor: any };

export function EditorCanvas({ editor }: EditorCanvasProps) {
  return (
    <CardContent className="bg-muted/50">
      <div className="flex justify-center">
        <div className="rounded-2xl bg-card p-2 shadow-sm ring-1 ring-border">
          <div className="relative flex min-h-80 min-w-[min(70vw,840px)] items-center justify-center overflow-hidden rounded-xl bg-card [&_canvas]:block [&_canvas]:max-w-full [&_canvas]:h-auto">
            <canvas ref={editor.canvasRef} className="block" />
            {!editor.hasImage && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted/30 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl border bg-background text-muted-foreground shadow-sm">
                  <ImageOff className="size-7" />
                </div>
                <div>
                  <p className="font-medium text-foreground">No image loaded</p>
                  <p className="mt-1 text-sm text-muted-foreground">Upload an image to start editing</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </CardContent>
  );
}
