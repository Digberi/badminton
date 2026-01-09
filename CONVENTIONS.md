# Project conventions

This file is a single source of truth for code style / architecture decisions in this repo.
It is intentionally opinionated to keep refactors predictable.

> Russian localization is not required (supported languages are `en` and `ua`).

---

## 0) Project principles

1. **Type-safety first**
   - TypeScript strict mode
   - Zod runtime validation in API handlers
   - Typed routes/contracts via `declarative-routing`
2. **No magic strings**
   - UI text / toasts / labels: only via i18n
   - Exceptions: technical constants (enum values). Display text still must be localized.
3. **No raw URLs**
   - Do not hardcode `"/api/..."` and `"/{lng}/..."`.
   - Use `@routes` (href + Link + typed fetch wrappers).
4. **Next 15/16 semantics**
   - `params` and `searchParams` are `Promise`. Always `await`.
5. **Minimum manual glue**
   - Generation (routes/types) should solve ~80%
   - Handwritten code: only business logic.
6. **Server/Client boundary**
   - server-only code in `src/server/*`
   - client-only code uses `"use client"`
   - do not mix.

---

## 1) Repository structure (canonical)

Top-level:

- `src/` — all app code
- `prisma/` — schema folder + models/enums + seed
- `@types/` — i18n resource types + module augmentation
- `localstack/` — init hooks (S3 bucket/CORS)
- `scripts/` — generators/patches/dumps
- `public/` — static files

`src/` layers:

- `src/app/` — Next App Router (pages/layouts/api)
- `src/components/` — UI/layout components
- `src/features/` — feature folders (albums/photos/...)
- `src/lib/` — utilities
- `src/server/` — server-only logic (db/auth/aws)
- `src/i18n/` — i18next server+client + translation types
- `src/routes/` — declarative-routing output + patches
- `src/middlewares/` — stackable proxy middlewares
- `src/proxy.ts` — proxy entrypoint for Next 16

---

## 2) Imports, aliases, style

### 2.1 Aliases

- `@/*` → `src/*`
- `@UI/*` → `src/components/*`
- `@routes/*` → `src/routes/*`
- `@routes` → `src/routes/index`

### 2.2 Hooks import style

Do:

```ts
import { useMemo, useState, useEffect } from "react";
```

Do not:

```ts
React.useMemo(...)
```

### 2.3 Type-only imports

Where possible:

```ts
import type { ReactNode } from "react";
```

### 2.4 TS exceptions

TS errors are ignored in:

- `src/routes/makeRoute.tsx`
- `src/routes/utils.ts`

These files are patched after generation with `// @ts-nocheck`.

---

## 3) Routing: declarative-routing as source of truth

### 3.1 Generation

- `pnpm dr:build` generates `src/routes/index.ts` and related files, then patches `makeRoute.tsx/utils.ts`.
- Patch script: `scripts/patch-generated-routes.mjs`

Rule: before `dev/build/typecheck` we run `dr:build` (already in `predev/prebuild/pretypecheck`).

### 3.2 `page.info.ts` format (canonical)

- `lng: z.enum(languages)`
- `as const`
- `meta` is localized via `{ ns, key, defaultValue? }`

Example:

```ts
import { z } from "zod";
import { languages } from "@/i18n/settings";

export const Route = {
  name: "AdminLogin",
  params: z.object({
    lng: z.enum(languages),
  }),
  search: z.object({
    next: z.string().optional(),
    error: z.enum(["unauthorized", "forbidden"]).optional(),
  }),
  meta: {
    title: { ns: "auth", key: "adminLogin.title" },
    hideInMenu: true,
  },
} as const;
```

### 3.3 `route.info.ts` format (API)

`Route` + methods (`GET/POST/PUT/DELETE`) with Zod schemas:

- `body` (for write methods)
- `result` (always)

Rule: handler implementations should reuse schemas from `route.info.ts` to validate input/output.

---

## 4) Next 15/16: `params/searchParams` are Promise

Pages/layouts:

```ts
export default async function Page({ params, searchParams }: RouteInfoToContext<typeof Route>) {
  const { lng } = await params;
  const sp = searchParams ? await searchParams : undefined;
}
```

Use `src/lib/routes/next-route-types.ts` (`RouteInfoToContext`, `RouteInfoToLayout`) for typing.

---

## 5) i18n: path-based + strict key typing

- All pages live under `app/[lng]/...`
- Supported languages live in `src/i18n/settings.ts` as a tuple `as const`
- Server: `serverTranslation(lng, ns[])`
- Client: `useTranslation({ lng?, ns? })`

Types source: `src/i18n/locales/en/*.json`

Generate types after changing EN locale:

```bash
pnpm i18n:types
```

Commit updated `@types/resources.d.ts`.

---

## 6) Meta localization

Meta fields `title/menuTitle/groupLabel` are:

- string (rare)
- or `{ ns, key, defaultValue? }`

Resolve via:

- `resolveMetaText(t, Route.meta?.title, "Fallback")`

---

## 7) Proxy instead of Middleware

In Next 16 we use `src/proxy.ts` and composition via `stackProxies`.

---

## 8) Navigation/menu built from `@routes` meta

Menu is generated from routes + meta:

- `meta.menuTitle`
- `meta.groupLabel`
- `meta.order`
- `meta.hideInMenu`
- `meta.requiredRoles`

Rule: features/components import routes directly:

✅ `import { getApiAdminPhotos, AdminPhotos } from "@routes";`

❌ do not use `Routes.getApiAdminPhotos` (except internal scanners like menu-tools).

---

## 9) API calls: only typed wrappers from `@routes`

Forbidden:

```ts
await fetch(`/api/admin/albums/${id}`, { method: "DELETE" });
```

Correct:

```ts
import { deleteApiAdminAlbumsId } from "@routes";
await deleteApiAdminAlbumsId({ id });
```

---

## 10) Client requests: SWR as default

- Live admin lists (photos/albums) use SWR.
- SWR keys live in `src/lib/swr/keys.ts`.

---

## 16) PR / refactor checklist

- No `fetch("/api/...")` — only `@routes` wrappers
- No `Link href="/..."` with hand-built paths — only `@routes` helpers
- No `React.useX`
- No UI strings without i18n
- Page/Layout: `await params`, `await searchParams`
- API handlers validate input/output
- After EN locale update: `pnpm i18n:types`
- After route info changes: `pnpm dr:build`
