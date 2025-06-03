/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: [],
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
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production' 
          ? 'http://nginx/api/:path*'
          : 'http://backend:8000/api/:path*', // 開発環境ではバックエンドに直接
      },
    ]
  },
}

module.exports = nextConfig