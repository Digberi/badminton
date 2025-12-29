import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth/options";
import { serverTranslation } from "@/i18n";
import { resolveMetaText } from "@/lib/route-meta";
import type { RouteInfoToContext } from "@/lib/routes/next-route-types";
import { Route } from "./page.info";
import { AdminLoginClient } from "./login-client";

export default async function AdminLoginPage({
                                               params,
                                               searchParams,
                                             }: RouteInfoToContext<typeof Route>) {
  const { lng } = await params;
  const sp = (await searchParams) as any;

  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";

  const nextRaw = typeof sp?.next === "string" ? sp.next : undefined;
  const nextSafe =
    nextRaw && nextRaw.startsWith(`/${lng}/`) ? nextRaw : `/${lng}/admin`;

  if (isAdmin) redirect(nextSafe);

  const {t} = await serverTranslation(lng, "auth");

  const title = resolveMetaText(t, Route.meta?.title, "Admin login");

  return (
    <div className="mx-auto max-w-md space-y-3">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-sm text-muted-foreground">{t("adminLogin.hint")}</p>

      <AdminLoginClient
        lng={lng}
        next={nextSafe}
        error={typeof sp?.error === "string" ? sp.error : undefined}
      />
    </div>
  );
}