import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // Locale from the `[locale]` segment or detection
  const locale = (await requestLocale) as string | undefined;

  // Fallback to default if unsupported
  const isSupported = locale && routing.locales.includes(locale as any);
  const resolvedLocale = isSupported ? (locale as string) : routing.defaultLocale;

  return {
    locale: resolvedLocale,
    messages: (await import(`./messages/${resolvedLocale}.json`)).default
  };
});