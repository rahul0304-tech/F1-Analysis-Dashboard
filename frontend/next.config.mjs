/** @type {import('next').NextConfig} */
const nextConfig = {
  // --- ADDED: This is the critical line for static export ---
  output: 'export',
  
  // --- ADDED: This helps static hosts correctly resolve routes like /meetings/123 ---
  trailingSlash: true,

  // Your existing settings are preserved below
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
