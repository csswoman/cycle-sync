import type { Metadata, Viewport } from 'next';
import Providers from './providers';
import { SerwistProvider } from './serwist-provider';
import '@/styles/globals.css';

export const metadata: Metadata = {
  applicationName: 'CycleSync',
  title: {
    default: 'CycleSync - Holistic Health',
    template: '%s | CycleSync',
  },
  description: 'Track your cycle, sync your life. Holistic health for women with PCOS.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CycleSync',
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/icons/apple-touch-icon.png',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#7f19e6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&family=Noto+Sans:wght@300..900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-display overflow-hidden selection:bg-primary selection:text-white" suppressHydrationWarning>
        <SerwistProvider swUrl="/serwist/sw.js">
          <Providers>{children}</Providers>
        </SerwistProvider>
      </body>
    </html>
  );
}
