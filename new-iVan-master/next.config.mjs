import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/**',
      }
    ],
  },
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error"],
          }
        : false,
  },
async headers() {
  return [
    {
      source: '/en/:path*',
      headers: [
        {
          key: 'Content-Language',
          value: 'en',
        },
      ],
    },
    {
      source: '/tr/:path*',
      headers: [
        {
          key: 'Content-Language',
          value: 'tr',
        },
      ],
    },
    {
      source: '/',
      headers: [
        {
          key: 'Content-Language',
          value: 'en', // default fallback
        },
      ],
    },
  ];
}

};

export default withNextIntl(nextConfig);
