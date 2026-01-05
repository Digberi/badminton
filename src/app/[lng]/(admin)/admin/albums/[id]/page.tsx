import { notFound } from "next/navigation";

import { serverTranslation } from "@/i18n";
import type { RouteInfoToContext } from "@/lib/routes/next-route-types";
import { Route } from "./page.info";

import { prisma } from "@/server/db/prisma";
import { photoCdnUrl } from "@/server/aws/s3";
import { AdminAlbumDetailClient } from "@/features/albums/admin/admin-album-detail";

export default async function AdminAlbumDetailPage({ params }: RouteInfoToContext<typeof Route>) {
  const { lng, id } = await params;

  await serverTranslation(lng, ["common", "albums"]); // просто прогреваем, если хочешь тексты — добавим позже

  const album = await prisma.album.findUnique({
    where: { id },
    include: {
      coverPhoto: { select: { id: true, key: true, status: true, deletedAt: true } },
    },
  });

  if (!album || album.deletedAt) notFound();

  const items = await prisma.albumPhoto.findMany({
    where: {
      albumId: album.id,
      photo: { deletedAt: null, status: "READY" },
    },
    orderBy: [{ position: "asc" }],
    select: {
      photoId: true,
      position: true,
      photo: { select: { key: true, originalName: true, createdAt: true } },
    },
  });

  const coverUrl =
    album.coverPhoto && album.coverPhoto.status === "READY" && !album.coverPhoto.deletedAt
      ? photoCdnUrl(album.coverPhoto.key)
      : null;

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{album.title}</h1>
        <div className="text-sm text-muted-foreground">
          slug: <span className="font-mono">{album.slug}</span> • {album.visibility}
        </div>
      </div>

      <AdminAlbumDetailClient
        lng={lng}
        album={{
          id: album.id,
          slug: album.slug,
          title: album.title,
          visibility: album.visibility,
          coverPhotoId: album.coverPhotoId,
          coverUrl,
        }}
        initialItems={items.map((it) => ({
          photoId: it.photoId,
          position: it.position,
          url: photoCdnUrl(it.photo.key),
          originalName: it.photo.originalName,
          createdAt: it.photo.createdAt.toISOString(),
        }))}
      />
    </section>
  );
}