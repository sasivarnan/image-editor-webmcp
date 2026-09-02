import { Download, Upload } from "lucide-react";
import { Button, buttonVariants } from "#components/ui/button";
import { cn } from "#lib/utils";

type EditorHeaderProps = {
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
};

export function EditorHeader({ onUpload, onExport }: EditorHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-xl">
      <div className="flex items-center mx-auto max-w-7xl h-14 justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Image Editor</h1>
        <div className="flex items-center gap-2">
          <label className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full cursor-pointer")}>
            <Upload className="size-3.5" />
            Upload
            <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
          </label>
          <Button size="sm" className="rounded-full" onClick={onExport}>
            <Download className="size-3.5" />
            Export PNG
          </Button>
        </div>
      </div>
    </header>
  );
}
