import {FlatNamespace, KeyPrefix, TFunction} from "i18next";
import {FallbackNs} from "react-i18next";

export type I18nRef<
  Ns extends FlatNamespace,
  KPrefix extends KeyPrefix<FallbackNs<Ns>> = undefined,
> = {
  ns: Ns;
  key: KPrefix extends string ? KPrefix : string;
  defaultValue?: string;
};

export type MetaText<
  Ns extends FlatNamespace,
  KPrefix extends KeyPrefix<FallbackNs<Ns>> = undefined,
> = string | I18nRef<Ns, KPrefix>;

export type TranslateFn = (
  key: string,
  options?: { ns?: string; defaultValue?: string }
) => string;

/**
 * Resolve meta text into a localized string.
 * - If meta is a string -> return as-is
 * - If meta is {ns,key} -> use i18n t(key, { ns })
 */
export function resolveMetaText<
  Ns extends FlatNamespace,
  KPrefix extends KeyPrefix<FallbackNs<Ns>> = undefined,
>(
  t: TFunction<FallbackNs<Ns>, KPrefix> | null | undefined,
  value: MetaText<Ns, KPrefix> | undefined,
  fallback: string
): string {
  if (!value) return fallback;
  if (typeof value === "string") return value;

  // no translator => best-effort fallback
  if (!t) return value.defaultValue ?? fallback;

  //@ts-ignore
  return t(value.key, {
    ns: value.ns,
    defaultValue: value.defaultValue ?? fallback,
  });
}