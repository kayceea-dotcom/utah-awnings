/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/quote/newport", destination: "/quote/flat-panel", permanent: true },
      { source: "/quote/flat-pan", destination: "/quote/flat-panel", permanent: true },
    ];
  },
};

export default nextConfig;
