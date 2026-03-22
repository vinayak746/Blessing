import {withSentryConfig} from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators:false,
  webpack: (config, { isServer }) => {
    // Suppress handlebars webpack warning about require.extensions
    // Handlebars uses CommonJS require.extensions which webpack doesn't support,
    // but it works fine at runtime on the server side
    if (!isServer) {
      config.ignoreWarnings = (config.ignoreWarnings || []).concat([
        { module: /handlebars/ },
      ]);
    }
    return config;
  },
  experimental: {
    // Tree-shake barrel exports from heavy packages
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "date-fns",
      "recharts",
    ],
  },
};

export default withSentryConfig(nextConfig, {
  org: "vinayak-xd",
  project: "blessing",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: process.env.NODE_ENV === "production" ? "/monitoring" : undefined,
  disableLogger: true,
  automaticVercelMonitors: true,
});