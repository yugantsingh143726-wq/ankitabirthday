/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // Privacy: keep the site out of search engines (spec: X-Robots-Tag: noindex)
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
