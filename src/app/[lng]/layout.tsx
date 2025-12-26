import type {Language} from "@/i18n/settings";
import {languages} from "@/i18n/settings";
import Link from "next/link";
import {ThemeToggle} from "@/components/theme-toggle";

export const dynamicParams = false;

export function generateStaticParams() {
  return languages.map((lng) => ({lng}));
}

export default async function LngLayout({
                                          children,
                                          params,
                                        }: {
  children: React.ReactNode;
  params: Promise<{ lng: Language }>;
}) {
  const {lng} = await params;
  return (
    <div className="min-h-dvh" lang={lng}>
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href={`/${lng}/gallery`} className="font-semibold">
              photo-app
            </Link>

            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              {languages.map((l) => (
                <Link
                  key={l}
                  href={`/${l}/gallery`}
                  className={l === lng ? "text-foreground" : "hover:text-foreground"}
                >
                  {l.toUpperCase()}
                </Link>
              ))}
            </nav>
          </div>

          <ThemeToggle/>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}