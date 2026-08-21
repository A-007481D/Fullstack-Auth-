/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for Docker — bundles only used modules
  // This is what enables the minimal Docker image (Stage 3 in Dockerfile)
  output: 'standalone',

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // Route API requests internally to the backend Docker service
        destination: 'http://backend:8000/api/:path*',
      },
    ]
  },
}

export default nextConfig
