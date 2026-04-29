import Providers from "@/Providers";
import SessionProvider from "@/utils/SessionProvider";
import "./globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, getLocale } from "next-intl/server";
import { constructMetadata } from "@/lib/metadata";
import { siteConfig } from "@/config/site";

export async function generateMetadata() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "Home" });

  return constructMetadata({
    page: "Home",
    title: t("title"),
    description: t("description"),
    locale,
    path: `/`,
    canonicalUrl: `/`,
  });
}

export const viewport = {
  themeColor: siteConfig.themeColors,
};

export default async function RootLayout({ children }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta httpEquiv="Content-Language" content={`${locale}, en, tr`} />
        <meta name="language" content="English, Turkish" />
        <meta name="locale" content={locale} />
        <link rel="icon" href="/assets/img/favicon.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* External styles */}
        <link
          href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png" />
        <link href="https://fonts.gstatic.com" rel="preconnect" />
        <link
          href="https://fonts.googleapis.com/css?family=Open+Sans:300,300i,400,400i,600,600i,700,700i|Nunito:300,300i,400,400i,600,600i,700,700i|Poppins:300,300i,400,400i,500,500i,600,600i,700,700i"
          rel="stylesheet"
        />
        <link
          href="https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css"
          rel="stylesheet"
        />
        {/* Local vendor + custom css */}
        <link href="/assets/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet" />
        <link href="/assets/vendor/bootstrap-icons/bootstrap-icons.css" rel="stylesheet" />
        <link href="/assets/vendor/boxicons/css/boxicons.min.css" rel="stylesheet" />
        <link href="/assets/vendor/remixicon/remixicon.css" rel="stylesheet" />
        <link href="/assets/css/style.css" rel="stylesheet" />
        <link href="/assets/css/shimmerEffect.css" rel="stylesheet" />
      </head>
      <body>
        <SessionProvider>
          <Providers>
            <NextIntlClientProvider locale={locale} messages={messages}>
              {children}
            </NextIntlClientProvider>
          </Providers>
        </SessionProvider>
      </body>
    </html>
  );
}
