// file: src/features/photos/gallery/photo-grid.tsx
"use client";

import * as React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export type GalleryPhoto = {
  id: string;
  url: string;
};

export function PhotoGrid({ photos }: { photos: GalleryPhoto[] }) {
  const [active, setActive] = React.useState<GalleryPhoto | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setActive(p)}
            className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
          >
            <img
              src={p.url}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
            />
          </button>
        ))}
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-5xl p-0">
          {active ? (
            <img
              src={active.url}
              alt=""
              className="h-auto w-full"
              loading="eager"
              decoding="async"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}