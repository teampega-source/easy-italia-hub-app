/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // L'intro passa poi al sito statico esistente. Cambia questo URL con il dominio prod.
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.easyitaliahub.it/',
  },
};
export default nextConfig;
