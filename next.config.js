/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  distDir: "dist",
  images: {
    unoptimized: true,
  },
  exportPathMap: async function (
    defaultPathMap,
    { dev, dir, outDir, distDir, buildId }
  ) {
    const onlyStatic = Object.fromEntries(
      Object.entries(defaultPathMap).filter(([path]) => !path.includes("["))
    );
    return onlyStatic;
  },
};

module.exports = nextConfig;
