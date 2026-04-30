import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
    output: "standalone",
    outputFileTracingRoot: path.join(__dirname),
    turbopack: {},
    images: {
        unoptimized: true, // ✅ Enable unoptimized images for development
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**",
            },
            {
                protocol: "http",
                hostname: "localhost",
                port: "8080",
            },
            {
                protocol: "http",
                hostname: "backend",
                port: "3001",
            },
            {
                protocol: "https",
                hostname: "api.dicebear.com",
            }
        ],
    },
    webpack(config) {
        config.module.rules.push({
            test: /\.svg$/,
            use: [{
                loader: '@svgr/webpack',
                options: {
                    icon: true,
                },
            }],
        });
        return config;
    },
    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination: `http://backend:${process.env.BACKEND_PORT || 3001}/api/:path*`,
            },
            {
                source: "/uploads/:path*",
                destination: `http://backend:${process.env.BACKEND_PORT || 3001}/uploads/:path*`,
            },
        ];
    },
};
export default nextConfig;