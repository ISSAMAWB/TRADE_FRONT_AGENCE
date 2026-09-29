/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /* Permet de servir un build de production à côté du dev server :
     BUILD_DIR=.next-prod npm run build && BUILD_DIR=.next-prod npx next start -p 3002 */
  distDir: process.env.BUILD_DIR || ".next",
};
module.exports = nextConfig;
