/** @format */

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button-2';
import { AssetSearch } from './asset-search';
import Logo from './Logo';
import ButtonLogin from './ButtonLogin';

const Header = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const shouldShowSearch = pathname?.match(
    /^\/(stock|currency|commodity|indices|real-estate|bond|all)/
  );

  useEffect(() => {
    setIsOpen(false);
  }, [searchParams]);

  // Focus search input when search popup opens
  useEffect(() => {
    if (isSearchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleSearchClick = () => {
    setIsSearchOpen(true);
    // Force the search popup to open by triggering a click on the input
    if (searchRef.current) {
      searchRef.current.click();
    }
  };

  // Prevent flash of wrong theme
  if (!mounted) {
    return null;
  }

  return (
    <header className='border-b border-border sticky top-0 w-full z-40 bg-background'>
      <nav
        className='w-full max-w-7xl mx-auto flex items-center justify-between p-4'
        aria-label='Global'>
        <div className={`flex ${shouldShowSearch ? 'lg:hidden' : 'lg:block'}`}>
          <Logo priority={true} />
        </div>
        <div className='flex lg:hidden'>
          {pathname !== '/' && (
            <Button
              variant='ghost'
              size='icon'
              onClick={handleSearchClick}>
              <span className='sr-only'>Open search</span>
              <svg
                fill='none'
                strokeWidth={1.8}
                stroke='currentColor'
                className='w-5 h-5'
                viewBox='0 0 24 24'
                xmlns='http://www.w3.org/2000/svg'
                aria-hidden='true'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z'
                />
              </svg>
            </Button>
          )}
          <Button
            variant='ghost'
            size='icon'
            onClick={() => setIsOpen(true)}>
            <span className='sr-only'>Open main menu</span>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              strokeWidth={1.5}
              stroke='currentColor'
              className='w-6 h-6'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'
              />
            </svg>
          </Button>
        </div>

        <div className='hidden lg:flex lg:flex-1'>
          {shouldShowSearch && <AssetSearch />}
        </div>

        <div className='hidden items-center lg:flex lg:flex-1 lg:justify-end lg:gap-x-4'>
          <div className='hidden lg:flex lg:gap-x-4'>
            <Link
              href='/'
              className='text-sm font-semibold leading-6 text-foreground hover:text-muted-foreground transition-colors'>
              Home
            </Link>
            <Link
              href='/all'
              className='text-sm font-semibold leading-6  text-foreground hover:text-muted-foreground transition-colors'>
              Assets
            </Link>
            <Link
              href='/blog'
              className='text-sm font-semibold leading-6 text-foreground hover:text-muted-foreground transition-colors'>
              Blog
            </Link>
          </div>

          <Button
            variant='ghost'
            size='icon'
            className='border'
            onClick={() =>
              setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
            }>
            <span className='sr-only'>Toggle theme</span>
            {resolvedTheme === 'dark' ? (
              <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                className='w-5 h-5'
                viewBox='0 0 24 24'
                strokeWidth={1.5}
                stroke='currentColor'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z'
                />
              </svg>
            ) : (
              <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth={1.5}
                stroke='currentColor'
                className='w-5 h-5'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z'
                />
              </svg>
            )}
          </Button>
          <ButtonLogin />
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`lg:hidden ${isOpen ? 'fixed inset-0 z-50' : 'hidden'}`}>
        <div className='fixed inset-0 bg-background/80 backdrop-blur-sm' />
        <div className='fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-background border-l border-border p-4 sm:max-w-sm sm:ring-1 sm:ring-border'>
          <div className='flex items-center justify-between'>
            <Logo priority={true} />
            <Button
              variant='ghost'
              size='icon'
              onClick={() => setIsOpen(false)}>
              <span className='sr-only'>Close menu</span>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth={1.5}
                stroke='currentColor'
                className='w-6 h-6'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </Button>
          </div>

          <div className='flow-root mt-4'>
            <div className='pb-4'>
              <div className='flex flex-col gap-y-4 items-start'>
                <Link
                  href='/'
                  className='text-sm font-semibold leading-6 text-foreground hover:text-muted-foreground transition-colors'>
                  Home
                </Link>
                <Link
                  href='/all'
                  className='text-sm font-semibold leading-6 text-foreground hover:text-muted-foreground transition-colors'>
                  Assets
                </Link>
                <Link
                  href='/blog'
                  className='text-sm font-semibold leading-6 text-foreground hover:text-muted-foreground transition-colors'>
                  Blog
                </Link>
              </div>
            </div>
            <div className='-ml-1 pb-4'>
              <div className='flex items-center gap-x-4'>
                <Button
                  className='border'
                  variant='ghost'
                  size='icon'
                  onClick={() =>
                    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
                  }>
                  <span className='sr-only'>Toggle theme</span>
                  {resolvedTheme === 'dark' ? (
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                      strokeWidth={1.5}
                      stroke='currentColor'
                      className='w-6 h-6'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z'
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                      strokeWidth={1.5}
                      stroke='currentColor'
                      className='w-6 h-6'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z'
                      />
                    </svg>
                  )}
                </Button>

                <ButtonLogin />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Popup */}
      <div
        className={`lg:hidden ${
          isSearchOpen ? 'fixed inset-0 z-50' : 'hidden'
        }`}>
        <div className='fixed inset-0 bg-background/80 backdrop-blur-sm' />
        <div className='fixed inset-0 z-50 overflow-y-auto bg-background'>
          <div className='p-4'>
            <div className='flex items-center justify-between mb-4'>
              <Logo priority={true} />
              <Button
                variant='ghost'
                size='icon'
                onClick={() => setIsSearchOpen(false)}>
                <span className='sr-only'>Close search</span>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={1.5}
                  stroke='currentColor'
                  className='w-6 h-6'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </Button>
            </div>
            <AssetSearch ref={searchRef} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
