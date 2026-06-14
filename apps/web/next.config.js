/** @type {import('next').NextConfig} */
const nextConfig = {
  rewrites: async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    
    return {
      beforeFiles: [
        {
          source: '/api/v1/:path*',
          destination: `${apiUrl}/api/v1/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
