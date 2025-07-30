/** @type {import('next').NextConfig} */
const nextConfig = {
  // This tells Next.js to produce a static-only build
  output: 'export',

  // This ensures that routes like /meetings/123 are generated as /meetings/123/index.html,
  // which is a standard pattern that all static hosts understand.
  trailingSlash: true,
};

export default nextConfig;
