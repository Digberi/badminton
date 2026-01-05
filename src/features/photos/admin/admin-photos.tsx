"use client";

import {cn} from "@/lib/utils";
import * as React from "react";
import Link from "next/link";
import {toast} from "sonner";
import {Trash2, UploadCloud, RefreshCw, Plus, FolderPlus} from "lucide-react";

import type {Language} from "@/i18n/settings";
import {Button} from "@/components/ui/button";
import {Progress} from "@/components/ui/progress";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AlbumMini = {
  id: string;
  slug: string;
  title: string;
};

type AdminPhoto = {
  id: string;
  status: "PENDING" | "READY" | "DELETED";
  url: string;
  originalName: string | null;
  contentType: string;
  size: number;
  createdAt: string;
  albums?: AlbumMini[];
};

type UploadTask = {
  localId: string;
  name: string;
  progress: number;
  state: "queued" | "uploading" | "confirming" | "done" | "error";
  error?: string;
};

function xhrPutWithProgress(args: {
  url: string;
  file: File;
  headers: Record<string, string>;
  onProgress: (pct: number) => void;
}) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", args.url);

    for (const [k, v] of Object.entries(args.headers)) {
      xhr.setRequestHeader(k, v);
    }

    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      const pct = Math.round((e.loaded / e.total) * 100);
      args.onProgress(pct);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (${xhr.status})`));
    };

    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(args.file);
  });
}

function formatKB(bytes: number) {
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function uniqueById<T extends { id: string }>(arr: T[]) {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const x of arr) {
    if (seen.has(x.id)) continue;
    seen.add(x.id);
    out.push(x);
  }
  return out;
}

export function AdminPhotosClient({lng}: { lng: Language }) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = React.useState(false);

  const [photos, setPhotos] = React.useState<AdminPhoto[]>([]);
  const [albums, setAlbums] = React.useState<AlbumMini[]>([]);
  const [loading, setLoading] = React.useState(false);

  const [pendingAdds, setPendingAdds] = React.useState<Set<string>>(() => new Set());
  const [pendingRemoves, setPendingRemoves] = React.useState<Set<string>>(() => new Set());
  const [recentAdds, setRecentAdds] = React.useState<Set<string>>(() => new Set());
  const recentTimers = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  React.useEffect(() => {
    return () => {
      for (const t of Object.values(recentTimers.current)) clearTimeout(t);
      recentTimers.current = {};
    };
  }, []);

  function markRecent(key: string) {
    // add → animate once → auto-remove
    setRecentAdds((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });

    if (recentTimers.current[key]) clearTimeout(recentTimers.current[key]);

    recentTimers.current[key] = setTimeout(() => {
      setRecentAdds((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      delete recentTimers.current[key];
    }, 700);
  }

  // upload target album
  const [targetAlbumId, setTargetAlbumId] = React.useState<string>("none");

  const [tasks, setTasks] = React.useState<UploadTask[]>([]);

  async function loadAlbums() {
    try {
      const res = await fetch("/api/admin/albums", {method: "GET"});
      if (!res.ok) throw new Error(await res.text());

      const data = (await res.json()) as {
        items: Array<{ id: string; title: string; slug: string }>;
      };

      const list = uniqueById(
        (data.items ?? []).map((a) => ({id: a.id, title: a.title, slug: a.slug}))
      );

      setAlbums(list);

      // if current selected album was deleted, fall back to none
      if (targetAlbumId !== "none" && !list.some((a) => a.id === targetAlbumId)) {
        setTargetAlbumId("none");
      }
    } catch (e: any) {
      // non-fatal: photos upload can still work without album selection
      console.warn(e);
    }
  }

  async function loadPhotos() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/photos?limit=60&includePending=true", {
        method: "GET",
        headers: {"Content-Type": "application/json"},
      });
      if (!res.ok) throw new Error(await res.text());

      const data = (await res.json()) as { items: AdminPhoto[] };
      setPhotos(data.items ?? []);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load photos");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void loadAlbums();
    void loadPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pickFiles() {
    inputRef.current?.click();
  }

  async function addPhotoToAlbum(args: { photoId: string; albumId: string }) {
    const album = albumMap.get(args.albumId);
    if (!album) {
      toast.error("Album not loaded");
      return;
    }

    const opKey = `${args.photoId}:${args.albumId}`;

    // 1) optimistic UI: add badge immediately
    setPendingAdds((prev) => {
      const next = new Set(prev);
      next.add(opKey);
      return next;
    });

    markRecent(opKey);

    setPhotos((prev) =>
      prev.map((p) => {
        if (p.id !== args.photoId) return p;

        const current = p.albums ?? [];
        if (current.some((a) => a.id === album.id)) return p; // already there

        return {
          ...p,
          albums: [...current, album],
        };
      })
    );

    try {
      const res = await fetch(`/api/admin/albums/${args.albumId}/photos`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({photoIds: [args.photoId]}),
      });

      if (!res.ok) throw new Error(await res.text());

      // Success: keep optimistic state (не делаем loadPhotos(), чтобы не мигало)
      toast.success("Added to album", {
        description: album.title,
        duration: 6000,
        action: {
          label: "Undo",
          onClick: () => void undoAddToAlbum({ photoId: args.photoId, albumId: args.albumId }),
        },
      });
    } catch (e: any) {
      // 2) revert optimistic change on error
      setPhotos((prev) =>
        prev.map((p) => {
          if (p.id !== args.photoId) return p;
          return {
            ...p,
            albums: (p.albums ?? []).filter((a) => a.id !== album.id),
          };
        })
      );

      toast.error(e?.message ?? "Add to album failed");
    } finally {
      setPendingAdds((prev) => {
        const next = new Set(prev);
        next.delete(opKey);
        return next;
      });
    }
  }

  async function undoAddToAlbum(args: { photoId: string; albumId: string }) {
    const opKey = `${args.photoId}:${args.albumId}`;
    const album = albumMap.get(args.albumId);

    // guard against double-click
    setPendingRemoves((prev) => {
      if (prev.has(opKey)) return prev;
      const next = new Set(prev);
      next.add(opKey);
      return next;
    });

    // optimistic remove badge immediately
    setPhotos((prev) =>
      prev.map((p) => {
        if (p.id !== args.photoId) return p;
        return {
          ...p,
          albums: (p.albums ?? []).filter((a) => a.id !== args.albumId),
        };
      })
    );

    try {
      const res = await fetch(`/api/admin/albums/${args.albumId}/photos/${args.photoId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error(await res.text());

      toast.message("Removed from album", {
        description: album?.title ?? undefined,
        duration: 3000,
      });
    } catch (e: any) {
      // revert optimistic remove on error
      if (album) {
        setPhotos((prev) =>
          prev.map((p) => {
            if (p.id !== args.photoId) return p;
            const current = p.albums ?? [];
            if (current.some((a) => a.id === album.id)) return p;
            return { ...p, albums: [...current, album] };
          })
        );
      } else {
        // если альбом не найден локально — просто пересинхронимся
        await loadPhotos();
      }

      toast.error(e?.message ?? "Undo failed");
    } finally {
      setPendingRemoves((prev) => {
        const next = new Set(prev);
        next.delete(opKey);
        return next;
      });
    }
  }

  async function uploadOne(file: File) {
    const localId = crypto.randomUUID();

    setTasks((prev) => [
      {localId, name: file.name, progress: 0, state: "queued"},
      ...prev,
    ]);

    try {
      setTasks((prev) =>
        prev.map((t) => (t.localId === localId ? {...t, state: "uploading"} : t))
      );

      // 1) create-presigned
      const createRes = await fetch("/api/admin/photos/create-presigned", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          size: file.size,
          albumId: targetAlbumId !== "none" ? targetAlbumId : undefined,
        }),
      });

      if (!createRes.ok) {
        const txt = await createRes.text();
        throw new Error(`Presign failed: ${txt}`);
      }

      const createData = (await createRes.json()) as {
        photoId: string;
        uploadUrl: string;
        uploadHeaders: Record<string, string>;
      };

      // 2) upload direct to S3
      await xhrPutWithProgress({
        url: createData.uploadUrl,
        file,
        headers: createData.uploadHeaders,
        onProgress: (pct) => {
          setTasks((prev) =>
            prev.map((t) => (t.localId === localId ? {...t, progress: pct} : t))
          );
        },
      });

      // 3) confirm
      setTasks((prev) =>
        prev.map((t) => (t.localId === localId ? {...t, state: "confirming"} : t))
      );

      const confirmRes = await fetch("/api/admin/photos/confirm", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({photoId: createData.photoId}),
      });

      if (!confirmRes.ok) {
        const txt = await confirmRes.text();
        throw new Error(`Confirm failed: ${txt}`);
      }

      setTasks((prev) =>
        prev.map((t) =>
          t.localId === localId ? {...t, state: "done", progress: 100} : t
        )
      );

      toast.success("Uploaded");
      await loadPhotos();
    } catch (e: any) {
      setTasks((prev) =>
        prev.map((t) =>
          t.localId === localId
            ? {...t, state: "error", error: e?.message ?? "Upload failed"}
            : t
        )
      );
      toast.error(e?.message ?? "Upload failed");
    }
  }

  async function uploadFiles(files: File[]) {
    const filtered = files.filter((f) => !!f.type && f.size > 0);

    if (!filtered.length) {
      toast.error("No supported files (jpeg/png/webp)");
      return;
    }

    // MVP: sequential uploads (cheap & predictable).
    // Later we can add concurrency=2-3.
    for (const f of filtered) {
      // eslint-disable-next-line no-await-in-loop
      await uploadOne(f);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete photo?")) return;

    try {
      const res = await fetch(`/api/admin/photos/${id}`, {method: "DELETE"});
      if (!res.ok) throw new Error(await res.text());
      toast.success("Deleted");
      await loadPhotos();
    } catch (e: any) {
      toast.error(e?.message ?? "Delete failed");
    }
  }

  const albumMap = React.useMemo(() => {
    const m = new Map<string, AlbumMini>();
    for (const a of albums) m.set(a.id, a);
    return m;
  }, [albums]);

  return (
    <div className="space-y-4">
      {/* Upload */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>Upload</CardTitle>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadPhotos} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4"/>
              Refresh
            </Button>

            <Button variant="outline" onClick={loadAlbums}>
              <RefreshCw className="mr-2 h-4 w-4"/>
              Albums
            </Button>

            <Button onClick={pickFiles}>
              <UploadCloud className="mr-2 h-4 w-4"/>
              Choose files
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="text-sm font-medium">Target album (optional)</div>
              <div className="flex items-center gap-2">
                <Select value={targetAlbumId} onValueChange={setTargetAlbumId}>
                  <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="No album"/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No album</SelectItem>
                    {albums.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button asChild variant="outline" size="sm">
                  <Link href={`/${lng}/admin/albums`}>
                    <Plus className="mr-2 h-4 w-4"/>
                    Albums
                  </Link>
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                If selected, new uploads will be added to that album automatically.
              </div>
            </div>
          </div>

          <div
            className={[
              "rounded-lg border border-dashed p-6 text-center transition-colors",
              dragOver ? "bg-accent" : "bg-card",
            ].join(" ")}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const files = Array.from(e.dataTransfer.files ?? []);
              void uploadFiles(files);
            }}
          >
            <p className="text-sm text-muted-foreground">
              Drag & drop images here (jpeg/png/webp, max 10MB)
            </p>

            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = "";
                void uploadFiles(files);
              }}
            />
          </div>

          {tasks.length ? (
            <div className="mt-4 space-y-3">
              {tasks.map((t) => (
                <div key={t.localId} className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{t.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {t.state}
                        {t.error ? ` — ${t.error}` : ""}
                      </div>
                    </div>
                    <div className="w-32">
                      <Progress value={t.progress}/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardHeader>
          <CardTitle>Photos</CardTitle>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No photos yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {photos.map((p) => {
                const photoAlbums = (p.albums ?? []).map((a) => ({
                  ...a,
                  title: a.title || albumMap.get(a.id)?.title || a.slug || a.id,
                }));

                const alreadyIn = new Set(photoAlbums.map((a) => a.id));

                return (
                  <div key={p.id} className="overflow-hidden rounded-lg border">
                    <div className="aspect-video bg-muted">
                      <img
                        src={p.url}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="space-y-2 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant={p.status === "READY" ? "default" : "secondary"}>
                          {p.status}
                        </Badge>

                        <div className="flex items-center gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <FolderPlus className="mr-2 h-4 w-4"/>
                                Add
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64">
                              <DropdownMenuLabel>Add to album</DropdownMenuLabel>
                              <DropdownMenuSeparator/>

                              {albums.length === 0 ? (
                                <DropdownMenuItem disabled>
                                  No albums yet (create one)
                                </DropdownMenuItem>
                              ) : albums.map((a) => {
                                const opKey = `${p.id}:${a.id}`;

                                const isPendingAdd = pendingAdds.has(opKey);
                                const isPendingRemove = pendingRemoves.has(opKey);

                                const isIn = alreadyIn.has(a.id);
                                const isBusy = isPendingAdd || isPendingRemove;

                                return (
                                  <DropdownMenuItem
                                    key={a.id}
                                    disabled={isBusy}
                                    onClick={() => {
                                      if (isIn) {
                                        void undoAddToAlbum({ photoId: p.id, albumId: a.id }); // ✅ toggle OFF
                                      } else {
                                        void addPhotoToAlbum({ photoId: p.id, albumId: a.id }); // ✅ toggle ON
                                      }
                                    }}
                                    className={cn(isBusy && "opacity-70")}
                                  >
                                    <span className="flex-1 truncate">
                                      {isIn ? "✓ " : ""}
                                      {a.title}
                                    </span>

                                    {isPendingAdd ? (
                                      <span className="text-xs text-muted-foreground motion-safe:animate-pulse">adding…</span>
                                    ) : isPendingRemove ? (
                                      <span className="text-xs text-muted-foreground motion-safe:animate-pulse">removing…</span>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">{isIn ? "remove" : "add"}</span>
                                    )}
                                  </DropdownMenuItem>
                                );
                              })}

                              <DropdownMenuSeparator/>
                              <DropdownMenuItem asChild>
                                <Link href={`/${lng}/admin/albums`}>Manage albums</Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => void onDelete(p.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4"/>
                          </Button>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {p.originalName ?? "—"}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {p.contentType} • {formatKB(p.size)}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {new Date(p.createdAt).toLocaleString()}
                      </div>

                      {/* Albums badges */}
                      <div className="flex flex-wrap gap-1">
                        {photoAlbums.length ? (
                          photoAlbums.map((a) => {
                            const opKey = `${p.id}:${a.id}`;
                            const isRecent = recentAdds.has(opKey);

                            return (
                              <Badge
                                key={a.id}
                                variant="secondary"
                                className={cn(
                                  "font-normal relative",
                                  // маленькая “pop” анимация при добавлении
                                  isRecent &&
                                  "motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in duration-200"
                                )}
                              >
                                <Link href={`/${lng}/admin/albums/${a.id}`} className="hover:underline">
                                  {a.title}
                                </Link>
                              </Badge>
                            );
                          })
                        ) : (
                          <span className="text-xs text-muted-foreground">No albums</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}