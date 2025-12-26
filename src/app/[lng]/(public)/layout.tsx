// file: src/app/[lng]/(public)/layout.tsx
import type { Language } from "@/i18n/settings";
import { languages } from "@/i18n/settings";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppPublicNav } from "@/components/public/app-public-nav";

export default async function PublicLayout({
                                             children,
                                             params,
                                           }: {
  children: React.ReactNode;
  params: Promise<{ lng: Language }>;
}) {
  const { lng } = await params;

  return (
    <div className="min-h-dvh">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href={`/${lng}/gallery`} className="font-semibold">
              photo-app
            </Link>

            <AppPublicNav lng={lng} group="public" adminHref={`/${lng}/admin`} />
          </div>

          <div className="flex items-center gap-2">
            {/* languages (desktop only to keep header clean on mobile) */}
            <nav className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
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

            {/* Admin link (desktop). On mobile it’s available inside the sheet */}
            <Link
              href={`/${lng}/admin`}
              className="hidden text-sm text-muted-foreground hover:text-foreground md:inline-flex"
            >
              Admin
            </Link>

            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}