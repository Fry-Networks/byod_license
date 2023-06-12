/** @type {import('next').NextConfig} */
const nextConfig = { 
    images: {
        domains: ['localhost', 'res.cloudinary.com', 'static.wixstatic.com']
    },
    experimental: {
        serverActions: true,
    }
}

module.exports = nextConfig
