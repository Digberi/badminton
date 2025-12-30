"use client";

import * as React from "react";
import { toast } from "sonner";
import { Trash2, UploadCloud, RefreshCw } from "lucide-react";

import type { Language } from "@/i18n/settings";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type AdminPhoto = {
  id: string;
  status: "PENDING" | "READY" | "DELETED";
  url: string;
  originalName: string | null;
  contentType: string;
  size: number;
  createdAt: string;
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

export function AdminPhotosClient({ lng }: { lng: Language }) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = React.useState(false);

  const [photos, setPhotos] = React.useState<AdminPhoto[]>([]);
  const [loading, setLoading] = React.useState(false);

  const [tasks, setTasks] = React.useState<UploadTask[]>([]);

  async function loadPhotos() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/photos?limit=60&includePending=true", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { items: AdminPhoto[] };
      setPhotos(data.items);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load photos");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void loadPhotos();
  }, []);

  function pickFiles() {
    inputRef.current?.click();
  }

  async function uploadOne(file: File) {
    const localId = crypto.randomUUID();
    setTasks((prev) => [
      { localId, name: file.name, progress: 0, state: "queued" },
      ...prev,
    ]);

    try {
      setTasks((prev) =>
        prev.map((t) => (t.localId === localId ? { ...t, state: "uploading" } : t))
      );

      // 1) create-presigned
      const createRes = await fetch("/api/admin/photos/create-presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          size: file.size,
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
            prev.map((t) => (t.localId === localId ? { ...t, progress: pct } : t))
          );
        },
      });

      // 3) confirm
      setTasks((prev) =>
        prev.map((t) => (t.localId === localId ? { ...t, state: "confirming" } : t))
      );

      const confirmRes = await fetch("/api/admin/photos/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId: createData.photoId }),
      });

      if (!confirmRes.ok) {
        const txt = await confirmRes.text();
        throw new Error(`Confirm failed: ${txt}`);
      }

      setTasks((prev) =>
        prev.map((t) => (t.localId === localId ? { ...t, state: "done", progress: 100 } : t))
      );

      toast.success("Uploaded");
      await loadPhotos();
    } catch (e: any) {
      setTasks((prev) =>
        prev.map((t) =>
          t.localId === localId
            ? { ...t, state: "error", error: e?.message ?? "Upload failed" }
            : t
        )
      );
      toast.error(e?.message ?? "Upload failed");
    }
  }

  async function uploadFiles(files: File[]) {
    const filtered = files.filter((f) => !!f.type && f.size > 0);
    for (const f of filtered) {
      // sequential is simplest & cheap. later можем сделать concurrency=2
      // eslint-disable-next-line no-await-in-loop
      await uploadOne(f);
    }
  }

  async function onDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/photos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Deleted");
      await loadPhotos();
    } catch (e: any) {
      toast.error(e?.message ?? "Delete failed");
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>Upload</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadPhotos} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={pickFiles}>
              <UploadCloud className="mr-2 h-4 w-4" />
              Choose files
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div
            className={[
              "rounded-lg border border-dashed p-6 text-center",
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
                      <Progress value={t.progress} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Photos</CardTitle>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No photos yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {photos.map((p) => (
                <div key={p.id} className="rounded-lg border overflow-hidden">
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
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => void onDelete(p.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {p.originalName ?? "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {p.contentType} • {(p.size / 1024).toFixed(0)} KB
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}