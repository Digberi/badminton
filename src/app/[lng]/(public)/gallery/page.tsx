import Link from "next/link";

import { serverTranslation } from "@/i18n";
import { resolveMetaText } from "@/lib/route-meta";
import type { RouteInfoToContext } from "@/lib/routes/next-route-types";
import { Route } from "./page.info";

import { prisma } from "@/server/db/prisma";
import { photoCdnUrl } from "@/server/aws/s3";
import { PhotoGrid } from "@/features/photos/gallery/photo-grid";

export default async function GalleryPage({ params }: RouteInfoToContext<typeof Route>) {
  const { lng } = await params;

  const { t } = await serverTranslation(lng, ["gallery", "albums", "common"]);
  const title = resolveMetaText(t, Route.meta?.title, "Gallery");

  const albums = await prisma.album.findMany({
    where: { deletedAt: null, visibility: "PUBLIC" },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    include: {
      coverPhoto: { select: { key: true, status: true, deletedAt: true } },
      photos: {
        take: 1,
        orderBy: { position: "asc" },
        include: { photo: { select: { key: true, status: true, deletedAt: true } } },
      },
      _count: { select: { photos: true } },
    },
  });

  const latest = await prisma.photo.findMany({
    where: { status: "READY", deletedAt: null },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 12,
    select: { id: true, key: true },
  });

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{t("listTitle", { ns: "albums" })}</p>
      </div>

      {/* Albums grid */}
      {albums.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noAlbums", { ns: "albums" })}</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((a) => {
            const coverKey =
              (a.coverPhoto && a.coverPhoto.status === "READY" && !a.coverPhoto.deletedAt
                ? a.coverPhoto.key
                : null) ??
              (a.photos[0]?.photo &&
              a.photos[0].photo.status === "READY" &&
              !a.photos[0].photo.deletedAt
                ? a.photos[0].photo.key
                : null);

            const coverUrl = coverKey ? photoCdnUrl(coverKey) : null;

            return (
              <Link
                key={a.id}
                href={`/${lng}/gallery/${encodeURIComponent(a.slug)}`}
                className="group overflow-hidden rounded-lg border bg-card"
              >
                <div className="aspect-video bg-muted">
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                    />
                  ) : null}
                </div>

                <div className="p-3">
                  <div className="text-sm font-medium">{a.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {a._count.photos} photos • {a.slug}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Latest photos */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">{t("latestTitle", { ns: "albums" })}</h2>

        {latest.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty", { ns: "gallery" })}</p>
        ) : (
          <PhotoGrid photos={latest.map((p) => ({ id: p.id, url: photoCdnUrl(p.key) }))} />
        )}
      </div>
    </section>
  );
}