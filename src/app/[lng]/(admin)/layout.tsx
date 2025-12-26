import type { Language } from "@/i18n/settings";
import { cookies } from "next/headers";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { AppAdminSidebar } from "@/components/admin/app-admin-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default async function AdminLayout({
                                            children,
                                            params,
                                          }: {
  children: React.ReactNode;
  params: Promise<{ lng: Language }>;
}) {
  const { lng } = await params;

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppAdminSidebar lng={lng} group="admin" />

      <SidebarInset>
        <div className="flex h-svh flex-col">
          <header className="flex items-center justify-between gap-2 border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <Link href={`/${lng}/gallery`} className="font-semibold">
                photo-app
              </Link>
              <span className="text-sm text-muted-foreground">Admin</span>
            </div>

            <ThemeToggle />
          </header>

          <main className="flex-1 overflow-auto p-4">{children}</main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}