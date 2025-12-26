import { serverTranslation } from "@/i18n";
import { resolveMetaText } from "@/lib/route-meta";
import type { RouteInfoToContext } from "@/lib/routes/next-route-types";
import { Route } from "./page.info";

export default async function AdminPhotosPage({ params }: RouteInfoToContext<typeof Route>) {
  const { lng } = await params;

  const i18n = await serverTranslation(lng, ["common"]);
  const t = i18n.getFixedT(lng);

  const title = resolveMetaText(t, Route.meta?.title, "Photos");

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-sm text-muted-foreground">
        Upload/list/delete will be here. (lng: {lng})
      </p>
    </div>
  );
}