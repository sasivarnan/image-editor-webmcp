import { createStoreLogic } from "@xstate/store-react";
import z from "zod";

export const imageEditorLogic = createStoreLogic({
  schemas: {
    context: z.object({
      imageUrl: z.string().optional(),
      color: z.string(),
      strokeWidth: z.number(),
    }),
    emitted: {
      showToast: z.object({ text: z.string() }),
    },
  },
  context: () => ({ imageUrl: undefined, color: "#4f46e5", strokeWidth: 4 }),
  on: {
    onUpload: (context, event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !file.type.startsWith("image/")) return context;
      return { ...context, imageUrl: URL.createObjectURL(file) };
    },
    setImageUrl: (context, event: { imageUrl: string }) => ({
      ...context,
      imageUrl: event.imageUrl,
    }),
    setColor: (context, event: { color: string }) => ({ ...context, color: event.color }),
    setStrokeWidth: (context, event: { width: number }) => ({ ...context, strokeWidth: event.width }),
  },
});
