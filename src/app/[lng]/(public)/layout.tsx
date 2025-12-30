import type { Language } from "@/i18n/settings";
import { languages } from "@/i18n/settings";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppPublicNav } from "@/components/public/app-public-nav";
import { UserNav } from "@/components/auth/user-nav";

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

            <UserNav lng={lng} />

            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}