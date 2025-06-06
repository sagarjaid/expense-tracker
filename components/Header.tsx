/** @format */

'use client';

import Logo from './Logo';
import ButtonAccount from './ButtonAccount';
import ThemeToggleButton from './ThemeToggleButton';
import { Button } from './ui/button';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  return (
    <header className='w-full z-50 bg-background py-2 pt-4 text-foreground'>
      <div className='max-w-2xl mx-auto flex flex-row items-center justify-between gap-2 relative'>
        <Logo />
        {/* Desktop menu */}
        <div className='hidden sm:flex flex-row items-center gap-2 w-full sm:w-auto'>
          <Link
            href='/todo'
            className='w-fit'>
            <Button
              variant='outline'
              className='w-fit sm:w-auto'>
              Tasks
            </Button>
          </Link>
          <ButtonAccount />
          <ThemeToggleButton />
        </div>
        {/* Mobile hamburger */}
        <div className='flex sm:hidden items-center ml-auto'>
          <div className='flex items-center gap-2'>
            <ThemeToggleButton />

            <span onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? (
                <div>
                  <X className='w-8 h-8' />
                </div>
              ) : (
                <Menu
                  className='w-8 h-8'
                  strokeWidth={1.5}
                />
              )}
            </span>
          </div>
          {menuOpen && (
            <div
              ref={menuRef}
              className='absolute top-14 right-2 border border-border rounded-lg shadow-lg flex flex-col gap-2 p-4 z-50 min-w-[150px] bg-background text-foreground'>
              <Link
                href='/'
                className='cursor-pointer ml-1'>
                Home
              </Link>
              <Link
                href='/todo'
                onClick={() => setMenuOpen(false)}
                className='cursor-pointer ml-1'>
                Tasks
              </Link>
              <ButtonAccount />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
