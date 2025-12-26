import { redirect } from "next/navigation";
import type { Language } from "@/i18n/settings";

export default async function LngHome({ params }: { params: Promise<{ lng: Language }> }) {
  const { lng } = await params;
  redirect(`/${lng}/gallery`);
}