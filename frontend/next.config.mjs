/** @type {import('next').NextConfig} */
const nextConfig = {
  // The 'output: export' and 'trailingSlash' lines have been removed
  // to enable default Server-Side Rendering (SSR).

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
