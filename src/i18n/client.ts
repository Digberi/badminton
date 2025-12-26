"use client";

import i18next, {FlatNamespace, KeyPrefix} from "i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import {useParams} from "next/navigation";
import {useEffect} from "react";
import {
  FallbackNs,
  initReactI18next,
  useTranslation as useTranslationOrg,
  type UseTranslationOptions,
  type UseTranslationResponse,
} from "react-i18next";

import {cookieName, fallbackLng, getOptions, languages, type Language} from "./settings";

function getCookie(name: string) {
  if (typeof document === "undefined") return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return undefined;
}

function setCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${value}; path=/; max-age=31536000; samesite=lax`;
}

let initialized = false;

// singleton на клиенте
function initClientI18n() {
  if (initialized) return;
  initialized = true;

  i18next
    .use(initReactI18next)
    .use(resourcesToBackend(
      (language: string, namespace: string) => import(`./locales/${language}/${namespace}.json`),
    ))
    .init({
      ...getOptions(fallbackLng, "common"),
      lng: undefined, // определим ниже
      ns: ["common"],
    });
}

export function useTranslation<
  Ns extends FlatNamespace,
  KPrefix extends KeyPrefix<FallbackNs<Ns>> = undefined,
>({
    lng,
    ns,
    options,
  }: {
  lng?: Language;
  ns?: Ns;
  options?: UseTranslationOptions<KPrefix>;
} = {}): UseTranslationResponse<FallbackNs<Ns>, KPrefix> & { lng: Language } {
  initClientI18n();

  const params = useParams<{ lng?: Language }>();
  const routeLng = params?.lng;

  if (!lng && routeLng) lng = routeLng;
  if (!lng) lng = (getCookie(cookieName) as Language | undefined) ?? fallbackLng;
  if (!languages.includes(lng)) lng = fallbackLng;

  const ret = useTranslationOrg(ns, options);
  const {i18n} = ret;

  useEffect(() => {
    if (i18n.resolvedLanguage !== lng) void i18n.changeLanguage(lng);
  }, [lng, i18n]);

  useEffect(() => {
    if (getCookie(cookieName) !== lng) setCookie(cookieName, lng);
  }, [lng]);

  return Object.assign(ret, {lng});
}