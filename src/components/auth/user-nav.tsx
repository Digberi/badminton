"use client";

import * as React from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { LogOut, Shield, User as UserIcon } from "lucide-react";

import type { Language } from "@/i18n/settings";
import { useTranslation } from "@/i18n/client";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {useRouter} from "next/navigation";

function initials(name?: string | null, email?: string | null) {
  const src = (name ?? "").trim() || (email ?? "").trim();
  if (!src) return "U";
  const parts = src.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "U";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase();
}

export function UserNav({ lng, className }: { lng: Language; className?: string }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { t } = useTranslation({ lng, ns: "auth" });

  const user = session?.user;
  const isAdmin = user?.role === "ADMIN";

  // Loading state: small placeholder
  if (status === "loading") {
    return (
      <div className={cn("h-9 w-9 rounded-full border bg-muted/30", className)} aria-hidden />
    );
  }

  // Unauthed: show sign-in button (points to admin login)
  if (!user) {
    return (
      <Button asChild variant="outline" size="sm" className={className}>
        <Link href={`/${lng}/admin/login`}>{t("user.signIn")}</Link>
      </Button>
    );
  }

  const displayName = user.name?.trim() || user.email || "User";
  const email = user.email ?? undefined;

  async function onSignOut() {
    await signOut({ redirect: false }); // session удалится, useSession обновится  [oai_citation:1‡NextAuth](https://next-auth.js.org/getting-started/client)
    router.push(`/${lng}/gallery`);
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("rounded-full", className)}
          aria-label="User menu"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image ?? undefined} alt={displayName} />
            <AvatarFallback>{initials(user.name, user.email)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="space-y-1">
          <div className="text-sm font-medium leading-none">{displayName}</div>
          {email ? <div className="text-xs font-normal text-muted-foreground">{email}</div> : null}
          <div className="pt-2">
            <Badge variant={isAdmin ? "default" : "secondary"}>
              {isAdmin ? t("user.role.admin") : t("user.role.user")}
            </Badge>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {isAdmin ? (
          <DropdownMenuItem asChild>
            <Link href={`/${lng}/admin`} className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>{t("user.adminPanel")}</span>
            </Link>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <Link href={`/${lng}/gallery`} className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onClick={onSignOut} className="flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          <span>{t("user.signOut")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}