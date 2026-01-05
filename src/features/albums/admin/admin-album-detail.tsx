"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowUp, ArrowDown, Trash2, Image as ImageIcon } from "lucide-react";

import type { Language } from "@/i18n/settings";
import { Button } from "@/components/ui/button";

type Album = {
  id: string;
  slug: string;
  title: string;
  visibility: "PUBLIC" | "UNLISTED" | "PRIVATE";
  coverPhotoId: string | null;
  coverUrl: string | null;
};

type Item = {
  photoId: string;
  position: number;
  url: string;
  originalName: string | null;
  createdAt: string;
};

export function AdminAlbumDetailClient({
                                         lng,
                                         album,
                                         initialItems,
                                       }: {
  lng: Language;
  album: Album;
  initialItems: Item[];
}) {
  const [items, setItems] = React.useState<Item[]>(initialItems);
  const [savingOrder, setSavingOrder] = React.useState(false);

  const orderedIds = React.useMemo(() => items.map((i) => i.photoId), [items]);

  async function saveOrder(nextIds: string[]) {
    setSavingOrder(true);
    try {
      const res = await fetch(`/api/admin/albums/${album.id}/photos/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedPhotoIds: nextIds }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Order saved");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save order");
    } finally {
      setSavingOrder(false);
    }
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...items];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setItems(next);
    void saveOrder(next.map((x) => x.photoId));
  }

  async function remove(photoId: string) {
    if (!confirm("Remove photo from album?")) return;
    try {
      const res = await fetch(`/api/admin/albums/${album.id}/photos/${photoId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Removed");
      setItems((prev) => prev.filter((x) => x.photoId !== photoId));
    } catch (e: any) {
      toast.error(e?.message ?? "Remove failed");
    }
  }

  async function setCover(photoId: string | null) {
    try {
      const res = await fetch(`/api/admin/albums/${album.id}/cover`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Cover updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Cover update failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-24 overflow-hidden rounded-md border bg-muted">
            {album.coverUrl ? (
              <img src={album.coverUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full grid place-items-center text-muted-foreground">
                <ImageIcon className="h-5 w-5" />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="font-medium">{album.title}</div>
            <div className="text-sm text-muted-foreground">
              {album.visibility} • {items.length} photos
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/${lng}/gallery/${encodeURIComponent(album.slug)}`}>Open public</Link>
          </Button>

          <Button variant="outline" onClick={() => void setCover(null)}>
            Clear cover
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">No photos in this album yet.</div>
        ) : (
          items.map((it, idx) => (
            <div key={it.photoId} className="flex items-center gap-3 rounded-lg border p-3">
              <div className="h-14 w-20 overflow-hidden rounded-md border bg-muted">
                <img src={it.url} alt="" className="h-full w-full object-cover" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{it.originalName ?? it.photoId}</div>
                <div className="text-xs text-muted-foreground">{it.createdAt}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" disabled={savingOrder} onClick={() => move(idx, -1)}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" disabled={savingOrder} onClick={() => move(idx, 1)}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => void setCover(it.photoId)}>
                  Set cover
                </Button>
                <Button variant="destructive" size="icon" onClick={() => void remove(it.photoId)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Debug: ids */}
      <div className="text-xs text-muted-foreground">
        order: {orderedIds.join(", ")}
      </div>
    </div>
  );
}