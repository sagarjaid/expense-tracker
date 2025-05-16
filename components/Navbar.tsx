/** @format */

'use client';

import config from '@/config';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import Logo from './Logo';

const Navbar = () => {
  const pathName = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { theme } = useTheme();

  const toggleNavbar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const fillters = [
    {
      name: 'Stocks',
      svg: (
        <svg
          className='w-4 h-4'
          xmlns='http://www.w3.org/2000/svg'
          id='Layer_1'
          data-name='Layer 1'
          viewBox='0 0 24 24'
          width='512'
          height='512'>
          <path
            d='M5,8.99c-.88,0-1.76-.33-2.42-1L.29,5.71c-.39-.39-.39-1.02,0-1.41s1.02-.39,1.41,0l2.28,2.28c.56,.56,1.46,.56,2.02,0l3.56-3.56c1.34-1.34,3.51-1.34,4.85,0l1.56,1.56c.54,.54,1.48,.54,2.02,0L22.29,.29c.39-.39,1.02-.39,1.41,0s.39,1.02,0,1.41l-4.28,4.28c-1.29,1.29-3.55,1.29-4.85,0l-1.56-1.56c-.56-.56-1.46-.56-2.02,0l-3.56,3.56c-.67,.67-1.55,1-2.42,1Zm3,14.01V14c0-.55-.45-1-1-1s-1,.45-1,1v9c0,.55,.45,1,1,1s1-.45,1-1Zm-5,0V12c0-.55-.45-1-1-1s-1,.45-1,1v11c0,.55,.45,1,1,1s1-.45,1-1Zm10,0V9c0-.55-.45-1-1-1s-1,.45-1,1v14c0,.55,.45,1,1,1s1-.45,1-1Zm5,0V12c0-.55-.45-1-1-1s-1,.45-1,1v11c0,.55,.45,1,1,1s1-.45,1-1Zm5,0V8c0-.55-.45-1-1-1s-1,.45-1,1v15c0,.55,.45,1,1,1s1-.45,1-1Z'
            fill='currentColor'
          />
        </svg>
      ),
      slug: '/stock',
    },
    {
      name: 'Currencies',
      svg: (
        <svg
          className='w-4 h-4'
          xmlns='http://www.w3.org/2000/svg'
          id='Layer_1'
          data-name='Layer 1'
          viewBox='0 0 24 24'
          width='512'
          height='512'>
          <path
            d='M16.5,0c-4.206,0-7.5,1.977-7.5,4.5v2.587c-.483-.057-.985-.087-1.5-.087C3.294,7,0,8.977,0,11.5v8c0,2.523,3.294,4.5,7.5,4.5,3.407,0,6.216-1.297,7.16-3.131,.598,.087,1.214,.131,1.84,.131,4.206,0,7.5-1.977,7.5-4.5V4.5c0-2.523-3.294-4.5-7.5-4.5Zm5.5,12.5c0,1.18-2.352,2.5-5.5,2.5-.512,0-1.014-.035-1.5-.103v-1.984c.49,.057,.992,.087,1.5,.087,2.194,0,4.14-.538,5.5-1.411v.911ZM2,14.589c1.36,.873,3.306,1.411,5.5,1.411s4.14-.538,5.5-1.411v.911c0,1.18-2.352,2.5-5.5,2.5s-5.5-1.32-5.5-2.5v-.911Zm20-6.089c0,1.18-2.352,2.5-5.5,2.5-.535,0-1.06-.038-1.566-.112-.193-.887-.8-1.684-1.706-2.323,.984,.28,2.092,.435,3.272,.435,2.194,0,4.14-.538,5.5-1.411v.911Zm-5.5-6.5c3.148,0,5.5,1.32,5.5,2.5s-2.352,2.5-5.5,2.5-5.5-1.32-5.5-2.5,2.352-2.5,5.5-2.5ZM7.5,9c3.148,0,5.5,1.32,5.5,2.5s-2.352,2.5-5.5,2.5-5.5-1.32-5.5-2.5,2.352-2.5,5.5-2.5Zm0,13c-3.148,0-5.5-1.32-5.5-2.5v-.911c1.36,.873,3.306,1.411,5.5,1.411s4.14-.538,5.5-1.411v.911c0,1.18-2.352,2.5-5.5,2.5Zm9-3c-.512,0-1.014-.035-1.5-.103v-1.984c.49,.057,.992,.087,1.5,.087,2.194,0,4.14-.538,5.5-1.411v.911c0,1.18-2.352,2.5-5.5,2.5Z'
            fill='currentColor'
          />
        </svg>
      ),
      slug: '/currency',
    },
    {
      name: 'Commodities',
      svg: (
        <svg
          className='w-4 h-4'
          xmlns='http://www.w3.org/2000/svg'
          id='Layer_1'
          data-name='Layer 1'
          viewBox='0 0 24 24'>
          <path
            d='m23.74,6.24c-.391-.391-1.023-.391-1.414,0l-3.651,3.651c-.711-.377-1.515-.686-2.333-.82l7.364-7.364c.391-.391.391-1.023,0-1.414s-1.023-.391-1.414,0l-7.364,7.364c-.135-.828-.451-1.641-.833-2.358l3.645-3.645c.391-.391.391-1.023,0-1.414s-1.023-.391-1.414,0l-3.381,3.381c-.775-.809-2.223-.785-2.957.073-.69.807-1.468,2.084-1.81,3.448-.753-.252-1.658-.069-2.19.552-.69.807-1.468,2.084-1.81,3.448-.753-.252-1.658-.069-2.19.552-.917,1.072-1.988,2.974-1.988,4.806,0,1.91.967,3.535,1.646,4.44l-1.353,1.353c-.391.391-.391,1.023,0,1.414.195.195.451.293.707.293s.512-.098.707-.293l1.353-1.353c.906.679,2.53,1.646,4.44,1.646,1.832,0,3.733-1.071,4.806-1.988.441-.378.694-.929.694-1.512,0-.236-.042-.467-.121-.683,1.356-.345,2.624-1.118,3.427-1.805.441-.378.694-.929.694-1.512,0-.236-.042-.467-.121-.683,1.356-.345,2.624-1.118,3.427-1.805.441-.378.694-.929.694-1.512,0-.559-.233-1.088-.642-1.464l3.382-3.382c.391-.391.391-1.023,0-1.414Zm-12.248-1.245c.727.849,1.508,2.307,1.508,3.505,0,.894-.491,1.545-.562,1.648l-1.509,1.509c-.145-.885-.495-1.754-.914-2.506.013-.083-.015-.518-.015-.651,0-1.198.781-2.656,1.492-3.505Zm-4,4c.727.849,1.508,2.307,1.508,3.505,0,.894-.491,1.545-.562,1.648l-1.509,1.509c-.145-.885-.495-1.754-.914-2.506.013-.083-.015-.518-.015-.651,0-1.198.781-2.656,1.492-3.505Zm-4,4c.727.849,1.508,2.307,1.508,3.505,0,.894-.491,1.545-.562,1.648l-1.36,1.36c-.487-.702-1.078-1.801-1.078-3.008,0-1.198.781-2.656,1.492-3.505Zm4.008,9.005c-1.207,0-2.307-.592-3.008-1.078l1.36-1.36c.102-.071.754-.562,1.648-.562,1.198,0,2.656.781,3.505,1.492-.849.727-2.307,1.508-3.505,1.508Zm4-4c-.133,0-.57-.029-.655-.017-.751-.418-1.619-.768-2.502-.912l1.509-1.509c.102-.071.754-.562,1.648-.562,1.198,0,2.656.781,3.505,1.492-.849.727-2.307,1.508-3.505,1.508Zm4-4c-.133,0-.57-.029-.654-.016-.751-.418-1.619-.768-2.503-.913l1.509-1.509c.102-.071.754-.562,1.648-.562,1.198,0,2.656.781,3.505,1.492-.849.727-2.307,1.508-3.505,1.508Z'
            fill='currentColor'
          />
        </svg>
      ),
      slug: '/commodity',
    },
    {
      name: 'Indices',
      svg: (
        <svg
          className='w-4 h-4'
          xmlns='http://www.w3.org/2000/svg'
          id='Layer_1'
          data-name='Layer 1'
          viewBox='0 0 24 24'>
          <path
            d='m5,6c0-.553.448-1,1-1h3c.552,0,1,.447,1,1s-.448,1-1,1h-3c-.552,0-1-.447-1-1Zm6,3h-5c-.552,0-1,.447-1,1s.448,1,1,1h5c.552,0,1-.447,1-1s-.448-1-1-1Zm0,4h-5c-.552,0-1,.447-1,1s.448,1,1,1h5c.552,0,1-.447,1-1s-.448-1-1-1Zm12.939-8.343c-.144-.395-.52-.657-.939-.657h-3.001l-1.062-2.98c-.146-.391-.52-.651-.937-.651s-.792.26-.937.651l-1.062,2.98h-3.001c-.419,0-.794.262-.938.655-.145.394-.028.835.292,1.107l2.377,1.935-.941,3.016c-.127.405.015.846.354,1.101.177.133.388.2.6.2.194,0,.388-.056.556-.169l2.708-1.812,2.754,1.793c.355.231.819.213,1.156-.046.337-.259.473-.703.339-1.106l-.979-2.98,2.366-1.927c.321-.271.439-.713.295-1.108Zm-1.939,15.343v.5c0,1.93-1.57,3.5-3.5,3.5H3.499c-1.929,0-3.499-1.57-3.499-3.5V5C0,2.243,2.243,0,5,0h8c.552,0,1,.447,1,1s-.448,1-1,1H5c-1.654,0-3,1.346-3,3v15.5c0,.827.673,1.5,1.5,1.5s1.5-.673,1.5-1.5v-.5c0-1.654,1.346-3,3-3h9v-3c0-.553.448-1,1-1s1,.447,1,1v3c1.654,0,3,1.346,3,3Zm-2,0c0-.552-.449-1-1-1h-11c-.551,0-1,.448-1,1v.5c0,.536-.122,1.045-.338,1.5h11.838c.827,0,1.5-.673,1.5-1.5v-.5Z'
            fill='currentColor'
          />
        </svg>
      ),
      slug: '/indices',
    },
    {
      name: 'Real Estate',
      svg: (
        <svg
          className='w-4 h-4'
          id='Layer_1'
          viewBox='0 0 24 24'
          xmlns='http://www.w3.org/2000/svg'
          data-name='Layer 1'>
          <path
            d='m18 11.142v-2.142c0-2.206-1.794-4-4-4h-1v-4c0-.552-.448-1-1-1s-1 .448-1 1v4h-1c-2.206 0-4 1.794-4 4v2.142c-1.72.447-3 2-3 3.858v8c0 .552.448 1 1 1s1-.448 1-1v-8c0-1.103.897-2 2-2h10c1.103 0 2 .897 2 2v8c0 .552.448 1 1 1s1-.448 1-1v-8c0-1.858-1.28-3.411-3-3.858zm-10-.142v-2c0-1.103.897-2 2-2h4c1.103 0 2 .897 2 2v2zm5 6v1c0 .552-.448 1-1 1s-1-.448-1-1v-1c0-.552.448-1 1-1s1 .448 1 1zm0 5v1c0 .552-.448 1-1 1s-1-.448-1-1v-1c0-.552.448-1 1-1s1 .448 1 1zm4-5v1c0 .552-.448 1-1 1s-1-.448-1-1v-1c0-.552.448-1 1-1s1 .448 1 1zm0 5v1c0 .552-.448 1-1 1s-1-.448-1-1v-1c0-.552.448-1 1-1s1 .448 1 1zm-8-5v1c0 .552-.448 1-1 1s-1-.448-1-1v-1c0-.552.448-1 1-1s1 .448 1 1zm0 5v1c0 .552-.448 1-1 1s-1-.448-1-1v-1c0-.552.448-1 1-1s1 .448 1 1z'
            fill='currentColor'
          />
        </svg>
      ),
      slug: '/real-estate',
    },
    {
      name: 'Bonds',
      svg: (
        <svg
          className='w-4 h-4'
          xmlns='http://www.w3.org/2000/svg'
          id='Layer_1'
          data-name='Layer 1'
          viewBox='0 0 24 24'>
          <path
            d='m21.95,5.551l-3.485-3.485C17.143.743,15.385.015,13.515.015h-4.515C6.727.015,4.737,1.55,4.163,3.747c-.14.534.18,1.081.714,1.221.538.137,1.082-.181,1.22-.715.345-1.317,1.539-2.238,2.903-2.238h4.515c.165,0,.323.032.485.047v4.953c0,1.654,1.346,3,3,3h4.951c.016.162.049.322.049.485v8.515c0,1.654-1.346,3-3,3h-10c-.69,0-1.338-.228-1.875-.657-.43-.343-1.059-.276-1.406.154-.345.432-.276,1.061.155,1.406.882.707,1.992,1.097,3.125,1.097h10c2.757,0,5-2.243,5-5v-8.515c0-1.869-.728-3.627-2.05-4.949Zm-4.95,2.464c-.551,0-1-.448-1-1V2.698c.376.217.735.466,1.05.781l3.485,3.485c.311.311.559.672.776,1.05h-4.312Zm-7,7.985h8c.552,0,1,.447,1,1s-.448,1-1,1h-8c-.552,0-1-.447-1-1s.448-1,1-1Zm-3,2.847v-4.75c.907-.734,1.5-1.842,1.5-3.097,0-2.206-1.794-4-4-4S.5,8.794.5,11c0,1.255.593,2.363,1.5,3.097v4.75c0,.623.791.89,1.169.395l1.331-1.743,1.331,1.743c.378.495,1.169.228,1.169-.395Zm-2.5-9.847c1.103,0,2,.897,2,2s-.897,2-2,2-2-.897-2-2,.897-2,2-2Zm6.5,5c-.552,0-1-.447-1-1s.448-1,1-1h7c.552,0,1,.447,1,1s-.448,1-1,1h-7Z'
            fill='currentColor'
          />
        </svg>
      ),
      slug: '/bond',
    },
    {
      name: 'All Assets',
      svg: (
        <svg
          fill='none'
          className='w-4 h-4'
          strokeWidth={1.5}
          stroke='currentColor'
          viewBox='0 0 24 24'
          xmlns='http://www.w3.org/2000/svg'
          aria-hidden='true'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0 4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0-5.571 3-5.571-3'
          />
        </svg>
      ),
      slug: '/all',
    },
  ];

  const isActive = (path: string) => {
    // For exact matches
    if (pathName === path) return true;

    // For nested paths (e.g., /currency/ltcbtc-vs-btc should match /currency)
    if (path !== '/all' && pathName.startsWith(path)) return true;

    return false;
  };

  return (
    <div
      className={`hidden h-screen  lg:flex flex-col justify-between z-50 border-r border-border cursor-pointer sticky top-0 transition-all duration-300 bg-background ${
        isCollapsed ? 'w-[80px]' : 'min-w-[200px]'
      }`}>
      <button
        onClick={toggleNavbar}
        className='absolute -right-3 top-7   bg-background rounded-full p-1 border border-border shadow-sm hover:bg-muted transition-colors'>
        <svg
          className='w-4 h-4 text-foreground'
          fill='none'
          strokeWidth={1.5}
          stroke='currentColor'
          viewBox='0 0 24 24'
          xmlns='http://www.w3.org/2000/svg'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d={
              isCollapsed
                ? 'M8.25 4.5l7.5 7.5-7.5 7.5'
                : 'M15.75 19.5L8.25 12l7.5-7.5'
            }
          />
        </svg>
      </button>

      <div className='flex flex-col gap-3'>
        <div className='p-4 mt-1'>
          <Logo
            isCollapsed={isCollapsed}
            priority={true}
          />
        </div>

        <div className='flex flex-col -mt-[1.5px]'>
          {fillters.map((el, i) => {
            return (
              <div
                key={i}
                className='relative'>
                <Link
                  href={el.slug}
                  className={
                    isActive(el.slug)
                      ? `p-2 py-5 ${isCollapsed ? 'pl-2' : 'pl-4'} ${
                          isCollapsed ? 'justify-center' : ''
                        } bg-muted font-medium text-sm flex gap-2 transition-colors cursor-pointer`
                      : `p-2 py-5 ${isCollapsed ? 'pl-2' : 'pl-4'} ${
                          isCollapsed ? 'justify-center' : ''
                        } hover:bg-muted font-medium text-sm flex gap-2 transition-colors cursor-pointer`
                  }
                  onMouseEnter={() => isCollapsed && setHoveredItem(el.name)}
                  onMouseLeave={() => setHoveredItem(null)}>
                  <div className='text-foreground'>{el.svg}</div>
                  {!isCollapsed && (
                    <button className='text-foreground'>{el.name}</button>
                  )}
                </Link>
                {isCollapsed && hoveredItem === el.name && (
                  <div className='absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-background border border-border rounded-md shadow-sm text-sm whitespace-nowrap z-50'>
                    {el.name}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className={`${isCollapsed ? 'hidden' : 'block'}`}>
        <div className='footer-title font-semibold text-muted-foreground tracking-widest text-sm md:text-left mb-3 px-4'>
          LEGAL
        </div>

        <div className='flex flex-col justify-center items-start gap-2.5 mb-2 text-xs p-4'>
          <Link
            href='/tos'
            target='_blank'
            className='text-muted-foreground hover:text-foreground transition-colors'>
            Terms of services
          </Link>
          <Link
            href='/privacy-policy'
            target='_blank'
            className='text-muted-foreground hover:text-foreground transition-colors'>
            Privacy policy
          </Link>
          <Link
            href={`mailto:${config?.resend?.supportEmail}`}
            target='_blank'
            className='text-muted-foreground hover:text-foreground transition-colors'>
            Support
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
