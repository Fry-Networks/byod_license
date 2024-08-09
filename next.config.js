/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['localhost', 'res.cloudinary.com', 'static.wixstatic.com']
    },
    experimental: {
        serverActions: {
            
            allowedOrigins: ["https://byod.fryfoundation.com",
             "byod.fryfoundation.com",
              "https://www.byod.fryfoundation.com", 
              "www.byod.fryfoundation.com",
              "https://byod.frynetworks.com",
                "byod.frynetworks.com",
                "https://www.byod.frynetworks.com",
                "www.byod.frynetworks.com",
              "localhost:3001"]
        }
    },
    headers: async () => {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: ContentSecurityPolicy.replace(/\n/g, ''),
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'origin-when-cross-origin',
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()',
                    },
                ],
            },
        ]
    }

}

const ContentSecurityPolicy = `
  font-src 'self' js.stripe.com fonts.gstatic.com fonts.googleapis.com;
  
`

module.exports = nextConfig
