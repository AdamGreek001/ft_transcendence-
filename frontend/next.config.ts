import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import path from "path";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
    output: "standalone",
    outputFileTracingRoot: path.join(__dirname),
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**",
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
        ];
    },
};

export default withNextIntl(nextConfig);