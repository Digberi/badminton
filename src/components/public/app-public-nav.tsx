"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, Menu, Folder, Link as LinkIcon } from "lucide-react";

import type { Language } from "@/i18n/settings";
import { useTranslation } from "@/i18n/client";
import { buildMenu, type MenuItem } from "@/lib/menu-tools";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

function isActive(item: MenuItem, pathname: string): boolean {
  if (item.href) {
    if (pathname === item.href) return true;
    if (pathname.startsWith(item.href + "/")) return true;
  }
  return item.children?.some((c) => isActive(c, pathname)) ?? false;
}

function pickIcon(item: MenuItem) {
  if (item.icon) return item.icon;
  return item.children?.length ? Folder : LinkIcon;
}

function DesktopLeaf({ item, active }: { item: MenuItem; active: boolean }) {
  const Icon = pickIcon(item);

  return (
    <Link
      href={item.href ?? "#"}
      aria-disabled={!item.href}
      className={cn(
        "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
        !item.href && "pointer-events-none opacity-60"
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{item.label}</span>
    </Link>
  );
}

function renderDropdownTree(items: MenuItem[], pathname: string, depth = 0): React.ReactNode[] {
  const out: React.ReactNode[] = [];

  for (const item of items) {
    const active = isActive(item, pathname);
    const Icon = pickIcon(item);

    if (item.children?.length) {
      // “group label”
      out.push(
        <DropdownMenuItem
          key={`group-${item.key}`}
          disabled
          className={cn("font-medium opacity-80", depth > 0 && "pl-2")}
        >
          <span className="inline-flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {item.label}
          </span>
        </DropdownMenuItem>
      );

      // Optional overview link (if group has href)
      if (item.href) {
        out.push(
          <DropdownMenuItem key={`${item.key}-overview`} asChild className={cn(depth > 0 && "pl-6")}>
            <Link
              href={item.href}
              className={cn("w-full", active && pathname === item.href && "font-medium")}
            >
              Overview
            </Link>
          </DropdownMenuItem>
        );
      }

      out.push(...renderDropdownTree(item.children, pathname, depth + 1));
      out.push(<DropdownMenuSeparator key={`${item.key}-sep`} />);
      continue;
    }

    // leaf
    out.push(
      <DropdownMenuItem key={item.key} asChild className={cn(depth > 0 && "pl-6")}>
        <Link href={item.href ?? "#"} aria-disabled={!item.href} className={cn(active && "font-medium")}>
          <span className="inline-flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {item.label}
          </span>
        </Link>
      </DropdownMenuItem>
    );
  }

  // remove trailing separator if any
  while (out.length && (out[out.length - 1] as any)?.type === DropdownMenuSeparator) out.pop();

  return out;
}

function MobileNode({
                      item,
                      pathname,
                      depth,
                    }: {
  item: MenuItem;
  pathname: string;
  depth: number;
}) {
  const active = isActive(item, pathname);
  const Icon = pickIcon(item);

  if (!item.children?.length) {
    return (
      <SheetClose asChild>
        <Link
          href={item.href ?? "#"}
          aria-disabled={!item.href}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
            depth > 0 && "ml-3 border-l pl-3",
            active
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
            !item.href && "pointer-events-none opacity-60"
          )}
        >
          <Icon className="h-4 w-4" />
          <span>{item.label}</span>
        </Link>
      </SheetClose>
    );
  }

  return (
    <Collapsible defaultOpen={active} className="w-full">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
            active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
            depth > 0 && "ml-3 border-l pl-3"
          )}
        >
          <Icon className="h-4 w-4" />
          <span className="flex-1">{item.label}</span>
          <ChevronRight className="h-4 w-4 data-[state=open]:rotate-90" />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-1 space-y-1">
        {item.href ? (
          <SheetClose asChild>
            <Link
              href={item.href}
              className={cn(
                "ml-3 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground",
                pathname === item.href && "bg-accent text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 opacity-80" />
              <span>Overview</span>
            </Link>
          </SheetClose>
        ) : null}

        {item.children.map((c) => (
          <MobileNode key={c.key} item={c} pathname={pathname} depth={depth + 1} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function AppPublicNav({
                               lng,
                               group = "public",
                               adminHref,
                             }: {
  lng: Language;
  group?: string;
  /** optional: put admin link into the mobile menu */
  adminHref?: string;
}) {
  const pathname = usePathname();
  const { t } = useTranslation({ lng, ns: "common" });

  // 🔑 For /{lng}/... we strip 1 segment so menu is built relative to the locale root.
  const menu = React.useMemo(
    () =>
      buildMenu({
        group,
        params: { lng },
        stripLeading: 1,
        t,
      }),
    [group, lng, t]
  );

  return (
    <div className="flex items-center">
      {/* Mobile: hamburger + sheet */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Menu">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="w-[320px] sm:w-[360px]">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>

            <div className="mt-4 space-y-1">
              {menu.map((item) => (
                <MobileNode key={item.key} item={item} pathname={pathname} depth={0} />
              ))}
            </div>

            {adminHref ? (
              <>
                <div className="my-4 border-t" />
                <SheetClose asChild>
                  <Link
                    href={adminHref}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <LinkIcon className="h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                </SheetClose>
              </>
            ) : null}
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: horizontal menu */}
      <nav className="hidden items-center gap-1 md:flex">
        {menu.map((item) => {
          const active = isActive(item, pathname);

          // Leaf
          if (!item.children?.length) {
            return <DesktopLeaf key={item.key} item={item} active={active} />;
          }

          // Group => dropdown
          const Icon = pickIcon(item);

          return (
            <DropdownMenu key={item.key}>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  <ChevronDown className="h-4 w-4 opacity-80" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" className="min-w-[14rem]">
                {renderDropdownTree(
                  item.href ? [{ ...item, children: undefined }, ...(item.children ?? [])] : item.children ?? [],
                  pathname
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        })}
      </nav>
    </div>
  );
}