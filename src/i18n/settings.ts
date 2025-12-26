export const languages = ["en", "ua"] as const;
export type Language = (typeof languages)[number];

export const fallbackLng: Language = "en";
export const cookieName = "i18next";

export function getOptions(lng: Language, ns: string | string[] = "common") {
  return {
    supportedLngs: languages,
    fallbackLng,
    lng,
    defaultNS: "common",
    ns,
    interpolation: { escapeValue: false },
  } as const;
}