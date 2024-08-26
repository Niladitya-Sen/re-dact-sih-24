/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
        /* config.resolve.alias.canvas = false; */
        config.module.rules.push({
            test: /\.mjs$/,
            include: /node_modules/,
            type: "javascript/auto"
        });
        return config;
    },
};

export default nextConfig;
