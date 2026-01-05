"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowRight } from "lucide-react";

import type { Language } from "@/i18n/settings";
import { useTranslation } from "@/i18n/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Album = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  visibility: "PUBLIC" | "UNLISTED" | "PRIVATE";
  order: number;
  coverUrl: string | null;
  count: number;
};

function slugifyLocal(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function AdminAlbumsClient({ lng }: { lng: Language }) {
  const { t } = useTranslation({ lng, ns: "albums" });

  const [items, setItems] = React.useState<Album[]>([]);
  const [loading, setLoading] = React.useState(false);

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Album | null>(null);

  // form state (simple MVP; позже переведём на RHF+Zod feature-folder)
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [visibility, setVisibility] = React.useState<Album["visibility"]>("PUBLIC");

  function resetForm() {
    setTitle("");
    setSlug("");
    setDescription("");
    setVisibility("PUBLIC");
    setEditing(null);
  }

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/albums", { method: "GET" });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { items: Album[] };
      setItems(data.items);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load albums");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void load();
  }, []);

  function startCreate() {
    resetForm();
    setOpen(true);
  }

  function startEdit(a: Album) {
    setEditing(a);
    setTitle(a.title);
    setSlug(a.slug);
    setDescription(a.description ?? "");
    setVisibility(a.visibility);
    setOpen(true);
  }

  async function submit() {
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
        visibility,
      };

      if (!payload.title) {
        toast.error("Title is required");
        return;
      }

      if (editing) {
        const res = await fetch(`/api/admin/albums/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await res.text());
        toast.success("Saved");
      } else {
        const res = await fetch("/api/admin/albums", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await res.text());
        toast.success("Created");
      }

      setOpen(false);
      resetForm();
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    }
  }

  async function removeAlbum(id: string) {
    if (!confirm("Delete album?")) return;
    try {
      const res = await fetch(`/api/admin/albums/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Deleted");
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Delete failed");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Button onClick={startCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t("admin.create", { defaultValue: "Create album" })}
        </Button>

        <Button variant="outline" onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead className="text-right">Photos</TableHead>
              <TableHead className="w-[220px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {items.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.title}</TableCell>
                <TableCell className="text-muted-foreground">{a.slug}</TableCell>
                <TableCell>{a.visibility}</TableCell>
                <TableCell className="text-right">{a.count}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => startEdit(a)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>

                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/${lng}/admin/albums/${a.id}`}>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Open
                    </Link>
                  </Button>

                  <Button variant="destructive" size="sm" onClick={() => removeAlbum(a.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {!items.length ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  No albums yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit album" : "Create album"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <div className="text-sm font-medium">Title</div>
              <Input
                value={title}
                onChange={(e) => {
                  const v = e.target.value;
                  setTitle(v);
                  if (!editing && (!slug || slug === slugifyLocal(title))) {
                    setSlug(slugifyLocal(v));
                  }
                }}
              />
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium">Slug</div>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="summer-2026" />
              <div className="text-xs text-muted-foreground">
                kebab-case (a-z0-9-). If empty, we generate it from title.
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium">Description</div>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium">Visibility</div>
              <Select value={visibility} onValueChange={(v) => setVisibility(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">PUBLIC</SelectItem>
                  <SelectItem value="UNLISTED">UNLISTED</SelectItem>
                  <SelectItem value="PRIVATE">PRIVATE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>{editing ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}