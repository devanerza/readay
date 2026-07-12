import en from './en.json';

type TranslationKey = keyof typeof en;

const translations: Record<string, Record<string, string>> = { en };

let currentLocale: string = 'en';

export function setLocale(locale: string) {
  currentLocale = locale;
}

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  const localeStrings = translations[currentLocale] ?? en;
  let value = localeStrings[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(`{{${k}}}`, String(v));
    }
  }
  return value;
}
