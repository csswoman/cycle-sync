import { withSerwist } from '@serwist/turbopack';

const isDev = process.env.NODE_ENV !== 'production';

// Next.js and next-themes inject inline scripts, so script-src keeps 'unsafe-inline'.
// Images and media come from many hosts (exercise GIFs, recipe photos, Supabase storage), so they allow any https source.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' data: blob: https:",
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://fonts.googleapis.com https://fonts.gstatic.com${isDev ? ' ws: http://localhost:*' : ''}`,
  'frame-src https://www.youtube.com https://www.youtube-nocookie.com',
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(), payment=(), usb=()' },
];

export default withSerwist({
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'img.spoonacular.com' },
    ],
  },
  async headers() {
    return [
      // The service worker caches cross-origin images, so it is left out of the page CSP.
      { source: '/((?!serwist/).*)', headers: securityHeaders },
      // Webhook tokens travel in the query string: never leak the URL through Referer.
      { source: '/api/health/webhook', headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }] },
    ];
  },
});
