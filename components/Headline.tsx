/** @format */

'use client';

import Typewriter from 'typewriter-effect';
import Image from 'next/image';
import herob from '@/app/icons/hero-b.png';
import herow from '@/app/icons/hero-w.png';
import { AssetSearch } from './asset-search-home';
import AssetCard from './AssetCard';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

const Headline = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent flash of wrong theme
  if (!mounted) {
    return null;
  }

  return (
    <div className='relative md:h-screen flex flex-col md:flex-row gap-6 md:gap-2 w-full justify-between md:items-start my-20 md:mt-16 md:my-0  mx-auto p-6 md:overflow-hidden'>
      <div className='flex flex-col items-center md:items-start gap-4 md:w-1/2 relative md:mt-28 z-10 md:pl-20'>
        {/* <button className='relative flex w-fit items-center px-2.5 py-0.5 font-semibold border text-xs sdm:text-base rounded-lg'>
          LIVE
          <span className='absolute -top-1 -right-1 flex h-3 w-3'>
            <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75'></span>
            <span className='relative inline-flex h-3 w-3 rounded-full bg-red-500'></span>
          </span>
        </button> */}
        <div className='flex flex-row justify-center md:flex-col gap-1 md:gap-4'>
          <h1 className='font-extrabold text-2xl sdm:text-3xl lg:text-6xl'>
            <Typewriter
              options={{
                strings: [
                  'Stocks vs',
                  'Currencies vs',
                  'Commodities vs',
                  'Indices vs',
                  'Real Estate vs',
                  'Bonds vs',
                ],
                autoStart: true,
                loop: true,
              }}
            />
          </h1>
          <div className='font-extrabold text-2xl sdm:text-3xl lg:text-6xl'>
            Bitcoin
          </div>
        </div>
        <div className='text-center ml-2 md:text-left'>
          Track asset prices in real-time against Bitcoin (BTC)
        </div>
        <AssetSearch />
        {/* <div className='text-center ml-2 text-xs text-gray-400'>
          200 traders searched over 2499 times today!
        </div> */}
        <div className='grid grid-cols-3 gap-3 mt-6 w-fit lg:w-[380px]'>
          {[
            { name: 'Apple', symbol: 'AAPL', category: 'stock' },
            { name: 'Gold', symbol: 'GLD', category: 'commodity' },
            { name: 'S&P500', symbol: 'SPY', category: 'indices' },
          ].map((asset) => (
            <AssetCard
              key={asset.symbol}
              name={asset.name}
              symbol={asset.symbol}
              category={asset.category}
            />
          ))}
        </div>
      </div>

      <div className='hidden md:block absolute right-0 top-80 -translate-y-1/2 w-1/2  overflow-hidden'>
        <Image
          src={resolvedTheme === 'dark' ? herob : herow}
          alt='Product Demo'
          className='hidden md:block h-[650px] w-auto object-cover object-left'
          priority={true}
          width={2000}
          height={2000}
        />
      </div>
    </div>
  );
};

export default Headline;
