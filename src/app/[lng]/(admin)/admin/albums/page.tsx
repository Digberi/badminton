import { serverTranslation } from "@/i18n";
import { resolveMetaText } from "@/lib/route-meta";
import type { RouteInfoToContext } from "@/lib/routes/next-route-types";
import { Route } from "./page.info";
import { AdminAlbumsClient } from "@/features/albums/admin/admin-albums";

export default async function AdminAlbumsPage({ params }: RouteInfoToContext<typeof Route>) {
  const { lng } = await params;

  const { t } = await serverTranslation(lng, ["common", "albums"]);
  const title = resolveMetaText(t, Route.meta?.title, "Albums");

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <AdminAlbumsClient lng={lng} />
    </section>
  );
}