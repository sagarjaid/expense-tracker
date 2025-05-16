/** @format */

import config from '@/config';
import Link from 'next/link';
import React from 'react';

const NavbarMobile = () => {
  return (
    <div className='flex w-full flex-col justify-between  cursor-pointer'>
      <div className='flex flex-col gap-2.5'>
        <Link
          href='/'
          className='bg-white p-1.5 rounded-lg hover:bg-gray-100 flex gap-2'>
          <svg
            className='w-6 h-6'
            fill='none'
            strokeWidth={1.5}
            stroke='currentColor'
            viewBox='0 0 24 24'
            xmlns='http://www.w3.org/2000/svg'
            aria-hidden='true'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M5 12h14'
            />
          </svg>
          <button>All Channels</button>
        </Link>
        <Link
          href='/monetized'
          className='bg-white p-1.5 rounded-lg hover:bg-gray-100 flex gap-2'>
          <svg
            className='w-6 h-6'
            fill='none'
            strokeWidth={1.5}
            stroke='currentColor'
            viewBox='0 0 24 24'
            xmlns='http://www.w3.org/2000/svg'
            aria-hidden='true'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='m4.5 12.75 6 6 9-13.5'
            />
          </svg>
          <button>Monetized</button>
        </Link>
        <Link
          href='/not-monetized'
          className='bg-white p-1.5 rounded-lg hover:bg-gray-100 flex gap-2'>
          <svg
            className='w-6 h-6'
            fill='none'
            strokeWidth={1.5}
            stroke='currentColor'
            viewBox='0 0 24 24'
            xmlns='http://www.w3.org/2000/svg'
            aria-hidden='true'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941'
            />
          </svg>

          <button>Not yet Monetized</button>
        </Link>

        <Link
          href='/demonetized'
          className='bg-white p-1.5 rounded-lg hover:bg-gray-100 flex gap-2'>
          <svg
            className='w-6 h-6'
            fill='none'
            strokeWidth={1.5}
            stroke='currentColor'
            viewBox='0 0 24 24'
            xmlns='http://www.w3.org/2000/svg'
            aria-hidden='true'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z'
            />
          </svg>
          <button>Demonetized</button>
        </Link>
      </div>

      <div className='pt-10'>
        <div className='footer-title font-semibold text-base-content tracking-widest text-sm md:text-left mb-3'>
          LEGAL
        </div>

        <div className='flex flex-col justify-center items-start gap-2.5 text-xs'>
          <Link
            href='/tos'
            target='_blank'
            className='link link-hover'>
            Terms of services
          </Link>
          <Link
            href='/privacy-policy'
            target='_blank'
            className='link link-hover'>
            Privacy policy
          </Link>
          <Link
            href={`mailto:${config?.resend?.supportEmail}`}
            target='_blank'
            className='link link-hover'>
            Support
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NavbarMobile;
