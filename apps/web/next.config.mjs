/** @type {import('next').NextConfig} */

// §9.2 CSP: default-src 'self'; no third-party scripts. 'unsafe-eval'/'unsafe-inline' for scripts
// are present only so the Next dev server and hydration work in v0.1; WP-09 replaces them with
// per-request nonces. Everything is first-party — the mascot is an inline SVG, no remote fetches.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig = {
  reactStrictMode: true,
  // Pin tracing to this monorepo (a stray package-lock.json elsewhere can confuse inference).
  outputFileTracingRoot: new URL("../../", import.meta.url).pathname,
  // Workspace packages ship TypeScript source (Turborepo just-in-time packages).
  transpilePackages: [
    "@ecclesia/shared",
    "@ecclesia/receipt",
    "@ecclesia/tally",
    "@ecclesia/audit",
    "@ecclesia/ballot-engine",
  ],
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
