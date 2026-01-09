// file: src/lib/routes/next-route-types.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import type { DeleteInfo, GetInfo, PostInfo, PutInfo, RouteInfo } from "@routes/makeRoute";

type RouteInfoSchema = RouteInfo<z.ZodSchema, z.ZodSchema>;

//#region RouteInfoToLayout
export type RouteInfoToLayout<
  Info extends OptionalFields<RouteInfoSchema, "search"> = RouteInfoSchema,
> = Prettify<{
  // Next 15/16: params are Promises
  params: Promise<z.output<Info["params"]>>;
}>;

export type RouteInfoToContext<
  Info extends OptionalFields<RouteInfoSchema, "search"> = RouteInfoSchema,
> = Prettify<{
  // Next 15/16: params/searchParams are Promises
  params: Promise<z.output<Info["params"]>>;
  // Optional (чтобы было совместимо с Route Handlers, где searchParams обычно не дают)
  searchParams?: Info extends { search: z.ZodSchema }
    ? Promise<z.output<NonNullable<Info["search"]>>>
    : Promise<Record<string, string | string[] | undefined>>;
}>;
//#endregion RouteInfoToLayout

type InfoWithError<Info extends z.output<typeof z.ZodSchema>> = Info | {
  error: any;
};

type NextRequestWithBody<Body extends z.ZodSchema> = Omit<NextRequest, "json"> & {
  json(): Promise<z.output<Body>>;
};

export type RouteInfoToGetRoute<
  Info extends GetInfo<z.ZodSchema> = GetInfo<z.ZodSchema>,
  RInfo extends OptionalFields<RouteInfoSchema, "search"> = RouteInfoSchema,
> = (
  req: NextRequest,
  context: RouteInfoToContext<RInfo>,
) => Promise<NextResponse<InfoWithError<z.output<Info["result"]>>>>;

export type RouteInfoToPostRoute<
  Info extends PostInfo<z.ZodSchema, z.ZodSchema> = PostInfo<z.ZodSchema, z.ZodSchema>,
  RInfo extends OptionalFields<RouteInfoSchema, "search"> = RouteInfoSchema,
> = (
  req: NextRequestWithBody<Info["body"]>,
  context: RouteInfoToContext<RInfo>,
) => Promise<NextResponse<InfoWithError<z.output<Info["result"]>>>>;

export type RouteInfoToPutRoute<
  Info extends PutInfo<z.ZodSchema, z.ZodSchema> = PutInfo<z.ZodSchema, z.ZodSchema>,
  RInfo extends OptionalFields<RouteInfoSchema, "search"> = RouteInfoSchema,
> = (
  req: NextRequestWithBody<Info["body"]>,
  context: RouteInfoToContext<RInfo>,
) => Promise<NextResponse<InfoWithError<z.output<Info["result"]>>>>;

export type RouteInfoToDeleteRoute<
  Info extends DeleteInfo<z.ZodSchema> = DeleteInfo<z.ZodSchema>,
  RInfo extends OptionalFields<RouteInfoSchema, "search"> = RouteInfoSchema,
> = (
  req: NextRequest,
  context: RouteInfoToContext<RInfo>,
) => Promise<NextResponse<InfoWithError<z.output<Info["result"]>>>>;

//#region Tools
type OptionalFields<T extends object, F extends keyof T> = Omit<T, F> & Partial<Pick<T, F>>;

type Prettify<T> = {
  [K in keyof T]: T[K];
};

export type Unprettify<T> = T extends Prettify<infer U> ? U : never;
//#endregion Tools