/** @format */

import { ReactNode } from 'react';
import { getSEOTags } from '@/lib/seo';
import config from '@/config';

export const metadata = getSEOTags({
  title: `Sign In | ${config.appName}`,
  description:
    'Sign in to ex.sagarjaid to track and compare asset prices against Bitcoin in real-time.',
  canonicalUrlRelative: '/signin',
});

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
