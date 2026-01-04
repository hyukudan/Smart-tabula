import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // Optimize for Docker
  experimental: {
    // Enable server actions
  },

  // Disable telemetry
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: false,
  },

  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
