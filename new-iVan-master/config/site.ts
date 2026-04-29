import { SiteConfig } from "@/types/siteConfig";

export const BASE_URL =
  process.env.NEXTAUTH_URL || "https://dev.swippped.com";



export const siteConfig: SiteConfig = {
  name: "Swipped",
  tagLine: "Hire smarter, faster",
  description:
    "Swipped connects businesses with trusted providers for deliveries, cleaning, locksmiths, and more across the UK.",
  url: BASE_URL,
  authors: [
    {
      name: "Swipped",
      url: BASE_URL,
    },
  ],
  creator: "@swipped",
  socialLinks: {
    github: "",
    bluesky: "",
    twitter: "",
    email: "",
  },
  themeColors: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  defaultNextTheme: "system", // next-theme option: system | dark | light
  icons: {
    icon: "/assets/img/favicon.ico",
    shortcut: "/assets/img/logo.png",
    apple: "/assets/img/logo.png",
  },
};
