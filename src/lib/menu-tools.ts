import type { ComponentType, ReactNode } from "react";
import * as Routes from "@/routes";
import { resolveMetaText } from "@/lib/route-meta";
import {FlatNamespace, KeyPrefix, TFunction} from "i18next";
import {FallbackNs} from "react-i18next";
import {RouteMeta} from "@routes/makeRoute";

// Minimal shape we rely on from patched makeRoute.tsx
type PageRouteLike<
  Ns extends FlatNamespace = FlatNamespace,
  KPrefix extends KeyPrefix<FallbackNs<Ns>> = undefined,
> = {
  Link: ComponentType<{ children?: ReactNode }>;
  href?: (params?: Record<string, unknown>, search?: Record<string, unknown>) => string;
  pattern?: string;
  groups?: string[];
  routeName?: string;
  meta?: RouteMeta<Ns, KPrefix>
} & ((params?: any, search?: any) => string);

function isPageRoute(v: unknown): v is PageRouteLike {
  return !!v && typeof v === "function" && "Link" in (v as any);
}

function extractGroups(pattern: string | undefined): string[] {
  if (!pattern) return [];
  return Array.from(pattern.matchAll(/\(([^)]+)\)/g)).map((m) => m[1]);
}

function pascalToTitle(input: string) {
  return input
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

function segmentToTitle(seg: string) {
  if (!seg) return "";
  const clean = seg
    .replace(/^\[\[?\.{3}/, "")
    .replace(/^\[|\]$/g, "")
    .replace(/^\(/, "")
    .replace(/\)$/, "");
  return pascalToTitle(clean);
}

function normalizeHref(href: string) {
  const h = href.trim();
  return h.startsWith("/") ? h : `/${h}`;
}

function allowByRoles(route: PageRouteLike, roles?: string[]) {
  if (!roles?.length) return true;
  const req = route.meta?.requiredRoles;
  if (!req?.length) return true;
  return req.some((r) => roles.includes(r));
}

export type MenuItem = {
  key: string;
  label: string;
  href?: string;
  icon?: ComponentType<{ className?: string }>;
  order?: number;
  children?: MenuItem[];
};

export type BuildMenuOptions<
  Ns extends FlatNamespace = FlatNamespace,
  KPrefix extends KeyPrefix<FallbackNs<Ns>> = undefined,
> = {
  /** Filter by Next.js route group name, e.g. "(admin)" => group: "admin" */
  group?: string;
  /** Skip /api routes by default */
  includeApi?: boolean;
  /** Optional role filtering */
  roles?: string[];
  /** Base params used to compute href for dynamic segments (IMPORTANT for [lng]) */
  params?: Record<string, unknown>;
  /** Base search used to compute href */
  search?: Record<string, unknown>;
  /** Remove N leading segments from href when building the tree (e.g. strip "en/admin") */
  stripLeading?: number;

  /** Translator for meta labels */
  t?: TFunction<FallbackNs<Ns>, KPrefix> | null;

  /** Optional overrides */
  overrides?: Record<string, Partial<MenuItem> & { include?: boolean; href?: string }>;
  /** Optional additional filter */
  filter?: (r: PageRouteLike) => boolean;
  /** Root label for "index" route within this menu scope */
  rootLabel?: string;
};

type Collected = {
  key: string;
  route: PageRouteLike;
  href?: string;
  pattern: string;
  groups: string[];
  routeName: string;
};

export function collectRoutes(opts: BuildMenuOptions = {}): Collected[] {
  const out: Collected[] = [];

  for (const [key, value] of Object.entries(Routes)) {
    if (!isPageRoute(value)) continue;

    const pattern = (value as any).pattern ?? "";
    const groups = (value as any).groups ?? extractGroups(pattern);
    const routeName = (value as any).routeName ?? (value as any).name ?? key;

    // Skip /api by default
    if (!opts.includeApi) {
      const isApi =
        pattern.startsWith("/api") ||
        key.startsWith("getApi") ||
        key.startsWith("postApi") ||
        key.startsWith("putApi") ||
        key.startsWith("deleteApi") ||
        routeName.startsWith("Api");
      if (isApi) continue;
    }

    if (opts.group && !groups.includes(opts.group)) continue;
    if (opts.filter && !opts.filter(value)) continue;
    if (!allowByRoles(value, opts.roles)) continue;
    if (value.meta?.hideInMenu) continue;

    const override = opts.overrides?.[key];
    let href: string | undefined;

    if (override?.href) {
      href = override.href;
    } else if (value.meta?.menuHref) {
      href = value.meta.menuHref;
    } else {
      const baseParams = opts.params ?? {};
      const baseSearch = opts.search ?? {};
      const hrefBuilder =
        typeof (value as any).href === "function" ? ((value as any).href as any) : (value as any);

      try {
        href = hrefBuilder(baseParams, baseSearch);
      } catch {
        const mp = value.meta?.menuParams;
        const ms = value.meta?.menuSearch;
        const forced = value.meta?.menuInclude || override?.include;

        if (mp || ms) {
          try {
            href = hrefBuilder({ ...baseParams, ...(mp ?? {}) }, { ...baseSearch, ...(ms ?? {}) });
          } catch {
            // ignore
          }
        }

        if (!href && !forced) continue;
      }
    }

    out.push({
      key,
      route: value,
      href: href ? normalizeHref(href) : undefined,
      pattern,
      groups,
      routeName,
    });
  }

  return out;
}

/**
 * Build a nested tree menu by path segments.
 * Uses meta.menuTitle/meta.title for labels (localized via opts.t).
 */
export function buildMenu(opts: BuildMenuOptions = {}): MenuItem[] {
  const pages = collectRoutes(opts);
  const strip = opts.stripLeading ?? 0;

  type Node = {
    segment: string;
    key: string;
    label: string;
    href?: string;
    icon?: ComponentType<{ className?: string }>;
    order?: number;
    children: Map<string, Node>;
  };

  const root: Node = {
    segment: "",
    key: "root",
    label: opts.rootLabel ?? "Root",
    children: new Map(),
  };

  let rootIndex: MenuItem | undefined;

  function applyOverrides(item: MenuItem) {
    const o = opts.overrides?.[item.key];
    if (!o) return;
    if (o.label) item.label = o.label;
    if (o.icon) item.icon = o.icon as any;
    if (o.order !== undefined) item.order = o.order;
    if (o.href) item.href = o.href;
  }

  function hrefToParts(href: string) {
    const pathOnly = href.split("?")[0]!.split("#")[0]!;
    return pathOnly.replace(/^\/+/, "").split("/").filter(Boolean);
  }

  function labelFromRoute(route: PageRouteLike, fallback: string) {
    const meta = route.meta;
    const candidate = (meta?.menuTitle ?? meta?.title) as FlatNamespace
    return resolveMetaText(opts.t, candidate, fallback);
  }

  // Build tree
  for (const { key, route, href } of pages) {
    if (!href) continue;

    const parts = hrefToParts(href);
    const rel = parts.slice(strip);

    const routeName = String((route as any).routeName ?? (route as any).name ?? key);
    const fallbackFromName = pascalToTitle(routeName);

    // index route inside menu scope
    if (rel.length === 0) {
      rootIndex = {
        key,
        label: labelFromRoute(route, opts.rootLabel ?? fallbackFromName),
        href,
        icon: route.meta?.icon,
        order: route.meta?.order,
      };
      applyOverrides(rootIndex);
      continue;
    }

    let cur = root;
    const acc: string[] = [];

    for (const seg of rel) {
      acc.push(seg);

      if (!cur.children.has(seg)) {
        cur.children.set(seg, {
          segment: seg,
          key: `group:${acc.join("/")}`,
          label: segmentToTitle(seg),
          children: new Map(),
        });
      }

      cur = cur.children.get(seg)!;
    }

    // Attach route info to final node
    cur.key = key;
    cur.href = href;
    cur.label = labelFromRoute(route, cur.label || fallbackFromName);
    cur.icon = route.meta?.icon ?? cur.icon;
    cur.order = route.meta?.order ?? cur.order;
  }

  function inferOrder(item: MenuItem): number {
    if (item.order !== undefined) return item.order;
    if (!item.children?.length) return 9999;
    return Math.min(...item.children.map(inferOrder), 9999);
  }

  function toMenuItem(node: Node): MenuItem {
    const children = Array.from(node.children.values()).map(toMenuItem);
    children.sort((a, b) => inferOrder(a) - inferOrder(b) || a.label.localeCompare(b.label));

    const item: MenuItem = {
      key: node.key,
      label: node.label,
      href: node.href,
      icon: node.icon,
      order: node.order,
      children: children.length ? children : undefined,
    };

    applyOverrides(item);
    return item;
  }

  const items: MenuItem[] = [];
  if (rootIndex) items.push(rootIndex);

  const top = Array.from(root.children.values()).map(toMenuItem);
  top.sort((a, b) => inferOrder(a) - inferOrder(b) || a.label.localeCompare(b.label));

  items.push(...top);
  return items;
}