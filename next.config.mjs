/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow the Next.js dev server to accept requests from any Cloudflare trycloudflare tunnel.
  // Each time cloudflared restarts you get a new random subdomain, so use a wildcard.
  allowedDevOrigins: ['*.trycloudflare.com'],
}
export default nextConfig
