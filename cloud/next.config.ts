import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;

if (process.env.NODE_ENV === "development") {
  // Bind Cloudflare bindings to Next.js dev server.
  import("@opennextjs/cloudflare").then(({ initOpenNextCloudflareForDev }) => {
    initOpenNextCloudflareForDev();
  });
}
