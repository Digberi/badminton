import { serverTranslation } from "@/i18n";
import { resolveMetaText } from "@/lib/route-meta";
import type { RouteInfoToContext } from "@/lib/routes/next-route-types";
import { Route } from "./page.info";
import { AdminPhotosClient } from "@/features/photos/admin/admin-photos";

export default async function AdminPhotosPage({ params }: RouteInfoToContext<typeof Route>) {
  const { lng } = await params;

  const { t } = await serverTranslation(lng, ["common"]);
  const title = resolveMetaText(t, Route.meta?.title, "Photos");

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <AdminPhotosClient lng={lng} />
    </section>
  );
}