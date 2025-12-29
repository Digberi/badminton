import { serverTranslation } from "@/i18n";
import { resolveMetaText } from "@/lib/route-meta";
import type { RouteInfoToContext } from "@/lib/routes/next-route-types";
import { Route } from "./page.info";

export default async function AdminHome({ params }: RouteInfoToContext<typeof Route>) {
  const { lng } = await params;

  const {t} = await serverTranslation(lng, "common");

  const title = resolveMetaText(t, Route.meta?.title, "Dashboard");

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-sm text-muted-foreground">Welcome (lng: {lng}).</p>
    </div>
  );
}