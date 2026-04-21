import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import path from "path";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
    output: "standalone",
    outputFileTracingRoot: path.join(__dirname),
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

export default withNextIntl(nextConfig);