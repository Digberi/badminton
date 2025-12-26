"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  LayoutDashboard,
  Images,
  Folder,
  Link as LinkIcon,
} from "lucide-react";

import type { Language } from "@/i18n/settings";
import { buildMenu, type MenuItem } from "@/lib/menu-tools";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {useTranslation} from "@/i18n/client";

function isActive(item: MenuItem, pathname: string): boolean {
  if (item.href) {
    if (pathname === item.href) return true;
    if (pathname.startsWith(item.href + "/")) return true;
  }
  return item.children?.some((c) => isActive(c, pathname)) ?? false;
}

// Quick icon picking (can be improved later)
function pickIcon(item: MenuItem) {
  if (item.icon) return item.icon;

  const k = item.key.toLowerCase();
  const l = item.label.toLowerCase();

  if (k.includes("dashboard") || l.includes("dashboard")) return LayoutDashboard;
  if (k.includes("photos") || l.includes("photos")) return Images;

  return item.children?.length ? Folder : LinkIcon;
}

function Leaf({
                item,
                active,
                depth,
              }: {
  item: MenuItem;
  active: boolean;
  depth: number;
}) {
  const Icon = pickIcon(item);

  if (depth === 0) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={active}>
          <Link href={item.href ?? "#"} aria-disabled={!item.href}>
            <Icon />
            <span>{item.label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild isActive={active}>
        <Link href={item.href ?? "#"} aria-disabled={!item.href}>
          <Icon className="opacity-80" />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}

function Node({
                item,
                pathname,
                depth,
              }: {
  item: MenuItem;
  pathname: string;
  depth: number;
}) {
  const active = isActive(item, pathname);

  // Leaf
  if (!item.children?.length) {
    return <Leaf item={item} active={active} depth={depth} />;
  }

  const Icon = pickIcon(item);

  // Group with children => Collapsible (accordion-ish)
  if (depth === 0) {
    return (
      <SidebarMenuItem>
        <Collapsible defaultOpen={active} className="group/collapsible">
          <CollapsibleTrigger asChild>
            <SidebarMenuButton isActive={active}>
              <Icon />
              <span>{item.label}</span>
              <ChevronRight
                className={cn(
                  "ml-auto size-4 transition-transform",
                  "group-data-[state=open]/collapsible:rotate-90"
                )}
              />
            </SidebarMenuButton>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <SidebarMenuSub>
              {/* optional "Overview" link if group has href */}
              {item.href ? (
                <Leaf item={{ ...item, children: undefined }} active={pathname === item.href} depth={1} />
              ) : null}

              {item.children.map((c) => (
                <Node key={c.key} item={c} pathname={pathname} depth={1} />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuItem>
    );
  }

  // Nested group (depth >= 1)
  return (
    <SidebarMenuSubItem>
      <Collapsible defaultOpen={active} className="group/collapsible w-full">
        <CollapsibleTrigger asChild>
          <SidebarMenuSubButton isActive={active}>
            <Icon className="opacity-80" />
            <span>{item.label}</span>
            <ChevronRight
              className={cn(
                "ml-auto size-4 transition-transform",
                "group-data-[state=open]/collapsible:rotate-90"
              )}
            />
          </SidebarMenuSubButton>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <SidebarMenuSub className="mt-1">
            {item.href ? (
              <Leaf item={{ ...item, children: undefined }} active={pathname === item.href} depth={2} />
            ) : null}

            {item.children.map((c) => (
              <Node key={c.key} item={c} pathname={pathname} depth={2} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuSubItem>
  );
}

export function AppAdminSidebar({
                                  lng,
                                  group = "admin",
                                }: {
  lng: Language;
  group?: string;
}) {
  const pathname = usePathname();

  const { t } = useTranslation({ lng, ns: "common" });

  const menu = buildMenu({
    group,
    params: { lng },
    stripLeading: 2,
    t,
  });

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menu.map((item) => (
                <Node key={item.key} item={item} pathname={pathname} depth={0} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}