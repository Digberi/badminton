import type { Language } from "@/i18n/settings";
import { languages } from "@/i18n/settings";

export const dynamicParams = false;

export function generateStaticParams() {
  return languages.map((lng) => ({ lng }));
}

export default async function LngLayout({
                                    children,
                                    params,
                                  }: {
  children: React.ReactNode;
  params: Promise<{ lng: Language }>;
}) {
  const { lng } = await params;
  return <div lang={lng}>{children}</div>;
}