/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/:page.html",
          destination: "/html/:page.html"
        },
        {
          source: "/_legacy/:path*",
          destination: "/legacy/:path*"
        },
        {
          source: "/_html/:path*",
          destination: "/html/:path*"
        }
      ]
    };
  }
};

export default nextConfig;