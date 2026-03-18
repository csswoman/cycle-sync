import type { Metadata } from 'next';
import Providers from './providers';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'CycleSync - Holistic Health',
  description: 'Track your cycle, sync your life. Holistic health for women with PCOS.',
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
