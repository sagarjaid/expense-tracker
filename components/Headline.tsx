/** @format */

'use client';

import Typewriter from 'typewriter-effect';
import Image from 'next/image';
import hero from '@/app/hero.png';
import { AssetSearch } from './asset-search-home';
import AssetCard from './AssetCard';

const Headline = () => {
  return (
    <div className='relative md:h-screen flex flex-col md:flex-row gap-6 md:gap-2 w-full justify-between md:items-start my-20 md:mt-8 md:my-0  mx-auto p-6 overflow-hidden'>
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
        <div className='relative w-full'>
          <div className='flex flex-col transform translate-x-[14%]'>
            <div className='bg-gray-100 rounded-l-2xl rounded-bl-none p-2 flex items-center gap-2 border border-gray-200'>
              <div className='flex gap-1.5'>
                <div className='w-3 h-3 rounded-full bg-red-500'></div>
                <div className='w-3 h-3 rounded-full bg-yellow-500'></div>
                <div className='w-3 h-3 rounded-full bg-green-500'></div>
              </div>
              <div className='flex-1 bg-white rounded-md h-6 flex items-center px-3 text-sm text-gray-500'>
                basedinbitcoin.com
              </div>
            </div>
            <div className='relative -ml-[-0.1px] box-border'>
              <Image
                src={hero}
                alt='Product Demo'
                className='h-[500px] w-auto object-cover object-left rounded-tl-none rounded-l-2xl shadow-xl border border-gray-500 border-1.5 border-t-0 border-r-0 box-border'
                priority={true}
                width={2000}
                height={2000}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Headline;
