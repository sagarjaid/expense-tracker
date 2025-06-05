/** @format */

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import config from '@/config';
import logo from '@/app/logo.png';
import logo2 from '@/app/logo-2.png';
import icon from '@/app/icon.png';
import { useState, useEffect } from 'react';

interface LogoProps {
  className?: string;
  isCollapsed?: boolean;
  priority?: boolean;
}

const Logo = ({
  className = '',
  isCollapsed = false,
  priority = false,
}: LogoProps) => {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getLogo = () => {
    if (isCollapsed) {
      return icon;
    }
    return resolvedTheme === 'dark' ? logo2 : logo;
  };

  if (!mounted) {
    return null;
  }

  return (
    <Link
      className={`flex items-center gap-2 shrink-0 ${className}`}
      href='/'
      title={`${config.appName} homepage`}>
      <Image
        src={getLogo()}
        alt={`${config.appName} logo`}
        className={`transition-all duration-300 ${
          isCollapsed ? 'w-[40px]' : 'w-[160px]'
        }`}
        priority={priority}
        width={160}
        height={160}
      />
    </Link>
  );
};

export default Logo;
