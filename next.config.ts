import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components stays off: the specs use the route-segment caching model
  // (static pages + revalidatePath, `revalidate`, `dynamic`) — see STATUS.md.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
