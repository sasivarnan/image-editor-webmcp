import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { LoaderCircle } from "lucide-react";

import { TooltipProvider } from "#components/ui/tooltip";
import { Toaster } from "#components/ui/toast";

import "./index.css";

const App = lazy(() => import("./App"));
const root = createRoot(document.getElementById("root")!);

root.render(
  <StrictMode>
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" />
          <span>Loading editor…</span>
        </div>
      }
    >
      <TooltipProvider>
        <App />
      </TooltipProvider>
      <Toaster />
    </Suspense>
  </StrictMode>,
);
document.getElementById("static-shell")?.remove();
