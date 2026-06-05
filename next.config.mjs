/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: [
    'pg',
    'better-auth',
    '@better-auth/kysely-adapter',
    'kysely',
  ],
}

export default nextConfig
