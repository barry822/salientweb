/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: `npm run build` writes plain HTML/CSS/JS to out/, which
  // Cloudflare serves as-is. No server is needed (booking runs on Google Apps
  // Script, the form on Formspree).
  output: 'export',
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
