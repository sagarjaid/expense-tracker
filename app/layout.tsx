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

const font = Bricolage_Grotesque({ subsets: ['latin'] });

export const viewport: Viewport = {
  // Will use the primary color of your theme to show a nice theme color in the URL bar of supported browsers
  themeColor: config.colors.main,
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

// This adds default SEO tags to all pages in our app.
// You can override them in each page passing params to getSOTags() function.
export const metadata = {
  ...getSEOTags({
    title: 'Expenslly - Track your expenses in real-time',
    description:
      'Expenslly is a simple and easy to use expense tracker that helps you track your expenses in real-time.',
    canonicalUrlRelative: '/',
  }),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Expenslly',
  },
  applicationName: 'Expenslly',
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang='en'
      className={font.className}
      suppressHydrationWarning>
      <head>
        <meta
          name='application-name'
          content='Expenslly'
        />
        <meta
          name='apple-mobile-web-app-capable'
          content='yes'
        />
        <meta
          name='apple-mobile-web-app-status-bar-style'
          content='default'
        />
        <meta
          name='apple-mobile-web-app-title'
          content='Expenslly'
        />
        <meta
          name='format-detection'
          content='telephone=no'
        />
        <meta
          name='mobile-web-app-capable'
          content='yes'
        />
        <meta
          name='theme-color'
          content='#ffffff'
          media='(prefers-color-scheme: light)'
        />
        <meta
          name='theme-color'
          content='#000000'
          media='(prefers-color-scheme: dark)'
        />
        <link
          rel='apple-touch-icon'
          href='/icons/icon-192x192.png'
        />
        <link
          rel='manifest'
          href='/manifest.json'
        />
      </head>
      <body>
        <ThemeProvider
          attribute='class'
          defaultTheme='light'
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
