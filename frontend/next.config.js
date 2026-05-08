/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'res.cloudinary.com',
      's3.amazonaws.com',
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com',
    ],
  },
  experimental: {
    swcMinify: false,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000',
  },
}

module.exports = nextConfig
