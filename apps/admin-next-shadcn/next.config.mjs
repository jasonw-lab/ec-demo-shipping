/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactCompiler: true,
  reactStrictMode: false, // Disable strict mode to prevent double rendering in development
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  // redirects are not supported in static export mode
  // Handle redirects client-side instead

  // async redirects() {
  //   return [
  //     {
  //       source: "/dashboard",
  //       destination: "/dashboard/default",
  //       permanent: false,
  //     },
  //   ];
  // },
  //
};

export default nextConfig;
