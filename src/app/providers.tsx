'use client';

import Link from 'next/link';
import { Theme } from '@astryxdesign/core/theme';
import { LinkProvider } from '@astryxdesign/core/Link';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
import { IconContext } from '@phosphor-icons/react';
import { ThemeProvider, useTheme } from '@/lib/theme';
import { LanguageProvider } from '@/i18n/LanguageContext';

/**
 * Applies the Astryx neutral theme (recolored as "garden" in globals.css),
 * following the app's light/dark setting.
 */
function AstryxTheme({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <Theme theme={neutralTheme} mode={theme}>
      <LinkProvider component={Link}>{children}</LinkProvider>
    </Theme>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AstryxTheme>
        <IconContext.Provider value={{ weight: 'duotone', size: 20 }}>
          <LanguageProvider>{children}</LanguageProvider>
        </IconContext.Provider>
      </AstryxTheme>
    </ThemeProvider>
  );
}
