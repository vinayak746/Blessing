import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,

  // Keep these out of the server bundle.
  //
  // unpdf bundles its own serverless build of PDF.js; bundling it a second
  // time through webpack risks resolving the wrong entry point (the one that
  // expects a browser canvas) instead of the serverless one we want.
  //
  // mammoth and imap are CommonJS with dynamic requires and misbehave under
  // webpack the same way.
  serverExternalPackages: ["unpdf", "mammoth", "imap"],

  webpack: (config, { isServer, webpack }) => {
    // handlebars uses require.extensions (CJS-only, works fine at runtime) and
    // @opentelemetry/instrumentation-winston optionally requires a transport we
    // don't install. Both are warnings only — silence them on BOTH the client
    // and the server build. The previous `if (!isServer)` guard missed the
    // server pass, which is where they actually fire.
    config.ignoreWarnings = (config.ignoreWarnings || []).concat([
      { module: /handlebars/ },
      { module: /@opentelemetry/ },
      { message: /require\.extensions is not supported by webpack/ },
      { message: /Can't resolve '@opentelemetry\/winston-transport'/ },
    ]);

    if (isServer) {
      // Never attempt to bundle the optional winston transport.
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^@opentelemetry\/winston-transport$/,
        }),
      );
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
  tunnelRoute:
    process.env.NODE_ENV === "production" ? "/monitoring" : undefined,
  // `disableLogger` and `automaticVercelMonitors` are deprecated in the current
  // @sentry/nextjs. Their replacements:
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
  },
});
