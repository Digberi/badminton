import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { serverTranslation } from "@/i18n";
import type { RouteInfoToContext } from "@/lib/routes/next-route-types";
import { Route } from "./page.info";

import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/server/db/prisma";
import { photoCdnUrl } from "@/server/aws/s3";
import { PhotoGrid } from "@/features/photos/gallery/photo-grid";

export default async function GalleryAlbumPage({ params }: RouteInfoToContext<typeof Route>) {
  const { lng, slug } = await params;

  const { t } = await serverTranslation(lng, ["albums", "common"]);

  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";

  const album = await prisma.album.findUnique({
    where: { slug },
  });

  if (!album || album.deletedAt) notFound();

  if (!isAdmin && album.visibility === "PRIVATE") notFound();

  const items = await prisma.albumPhoto.findMany({
    where: {
      albumId: album.id,
      photo: { deletedAt: null, status: "READY" },
    },
    orderBy: [{ position: "asc" }],
    select: { photo: { select: { id: true, key: true } } },
  });

  const photos = items.map((it) => ({ id: it.photo.id, url: photoCdnUrl(it.photo.key) }));

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{album.title}</h1>
          {album.description ? (
            <p className="text-sm text-muted-foreground">{album.description}</p>
          ) : null}
        </div>

        <Link href={`/${lng}/gallery`} className="text-sm text-muted-foreground hover:text-foreground">
          ← Back
        </Link>
      </div>

      {photos.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("albumEmpty", { ns: "albums" })}</p>
      ) : (
        <PhotoGrid photos={photos} />
      )}
    </section>
  );
}