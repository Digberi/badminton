import "server-only";

import i18next, {type i18n as I18nInstance} from "i18next";
import {initReactI18next} from "react-i18next/initReactI18next";
import resourcesToBackend from "i18next-resources-to-backend";

import {getOptions, type Language} from "./settings";

export async function serverTranslation(
  lng: Language,
  ns: string | string[]
): Promise<I18nInstance> {
  const i18nInstance = i18next.createInstance();

  await i18nInstance
    .use(initReactI18next)
    .use(resourcesToBackend(
      (language: string, namespace: string) => import(`./locales/${language}/${namespace}.json`),
    ))
    .init(getOptions(lng, ns));

  return i18nInstance;
}