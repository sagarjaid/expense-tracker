/** @format */

import { ReactNode } from 'react';
import { Bricolage_Grotesque } from 'next/font/google';
import { Viewport } from 'next';
import { getSEOTags } from '@/lib/seo';
import ClientLayout from '@/components/LayoutClient';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import config from '@/config';
import './globals.css';
import { ThemeProvider } from '../components/theme-provider';
import Script from 'next/script';

const font = Bricolage_Grotesque({ subsets: ['latin'] });

export const viewport: Viewport = {
  // Will use the primary color of your theme to show a nice theme color in the URL bar of supported browsers
  themeColor: config.colors.main,
  width: 'device-width',
  initialScale: 1,
};

// This adds default SEO tags to all pages in our app.
// You can override them in each page passing params to getSOTags() function.
export const metadata = getSEOTags({
  title:
    'BasedinBitcoin - Track asset prices in real-time against Bitcoin (BTC)',
  description:
    "Compare any asset values directly against Bitcoin's current market price.",
  canonicalUrlRelative: '/',
  extraTags: {
    'google-site-verification': 'bpVto528QOEsbHsk4o2dP8yL3DMcQb6kFWjoQUgSoq0',
    'google-adsense-account': 'ca-pub-8500986101092156',
  },
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang='en'
      className={font.className}
      suppressHydrationWarning>
      <head>
        <Script
          async
          src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8500986101092156'
          crossOrigin='anonymous'
          strategy='afterInteractive'
        />
      </head>
      <body>
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
          storageKey='theme'
          forcedTheme={undefined}>
          <GoogleAnalytics />
          {/* ClientLayout contains all the client wrappers (Crisp chat support, toast messages, tooltips, etc.) */}
          <ClientLayout>{children}</ClientLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
