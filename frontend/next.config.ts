import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Standalone output for Docker — bundles only used modules
  // This is what enables the minimal Docker image (Stage 3 in Dockerfile)
  output: 'standalone',

  // Environment variable available in the browser (NEXT_PUBLIC_ prefix required)
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api',
  },
}

export default nextConfig
