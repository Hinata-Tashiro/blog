/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: []
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '',
        pathname: '/uploads/**',
      }
    ],
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: process.env.NODE_ENV === 'production' 
          ? 'http://nginx/uploads/:path*'
          : 'http://nginx/uploads/:path*', // Docker環境では常にnginxを使用
      },
    ]
  },
}

module.exports = nextConfig