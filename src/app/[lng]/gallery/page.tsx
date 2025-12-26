import type { Language } from "@/i18n/settings";
import { serverTranslation } from "@/i18n";

export default async function GalleryPage({ params }: { params: Promise<{ lng: Language }> }) {
  const { lng } = await params;

  const i18n = await serverTranslation(lng, ["gallery"]);
  const t = i18n.getFixedT(lng, "gallery");

  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-sm text-muted-foreground">{t("empty")}</p>
    </section>
  );
}