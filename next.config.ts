import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 👇 ADD THESE TWO LINES
    loader: 'custom',
    loaderFile: './src/lib/cloudinaryLoader.ts', // Make sure this path matches where you saved the file
    
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;