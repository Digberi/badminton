import { serverTranslation } from "@/i18n";
import { resolveMetaText } from "@/lib/route-meta";
import type { RouteInfoToContext } from "@/lib/routes/next-route-types";
import { Route } from "./page.info";

export default async function GalleryPage({ params }: RouteInfoToContext<typeof Route>) {
  const { lng } = await params;

  const i18n = await serverTranslation(lng, ["gallery", "common"]);
  const t = i18n.getFixedT(lng);

  const title = resolveMetaText(t, Route.meta?.title, "Gallery");

  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-sm text-muted-foreground">{t("empty", { ns: "gallery" })}</p>
    </section>
  );
}