/** @type {import('next').NextConfig} */
const nextConfig = { 
    images: {
        domains: ['localhost', 'res.cloudinary.com', 'static.wixstatic.com']
    },
    experimental: {
        serverActions: true,
    },
    async headers() {
        return [
          {
            source: '/(.*)',
            headers: [
              {
                key: 'Content-Security-Policy',
                value: "default-src 'self'; img-src *; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'",
              },
            ],
          },
        ];
      },
}

module.exports = nextConfig
