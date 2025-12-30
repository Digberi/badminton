import { serverTranslation } from "@/i18n";
import { resolveMetaText } from "@/lib/route-meta";
import type { RouteInfoToContext } from "@/lib/routes/next-route-types";
import { Route } from "./page.info";
import { prisma } from "@/server/db/prisma";
import { photoCdnUrl } from "@/server/aws/s3";
import { PhotoGrid } from "@/features/photos/gallery/photo-grid";

export default async function GalleryPage({ params }: RouteInfoToContext<typeof Route>) {
  const { lng } = await params;

  const { t } = await serverTranslation(lng, ["gallery", "common"]);
  const title = resolveMetaText(t, Route.meta?.title, "Gallery");

  const photos = await prisma.photo.findMany({
    where: { status: "READY", deletedAt: null },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 60,
    select: { id: true, key: true },
  });

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">{title}</h1>

      {photos.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty", { ns: "gallery" })}</p>
      ) : (
        <PhotoGrid photos={photos.map((p) => ({ id: p.id, url: photoCdnUrl(p.key) }))} />
      )}
    </section>
  );
}