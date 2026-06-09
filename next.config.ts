import type { NextConfig } from "next";

const repositoryBasePath = "/mijn-leesreis-portfolio";

const nextConfig: NextConfig = {
  output: "export",
  basePath: repositoryBasePath,
  images: {
    unoptimized: true
  }
};

export default nextConfig;
