/** @format */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import moment from 'moment';

interface AssetCardProps {
  name: string;
  symbol: string;
  category: string;
}

interface AssetData {
  currentPrice: number;
  oneDayChange: number;
}

const AssetCard = ({ name, symbol, category }: AssetCardProps) => {
  const [assetData, setAssetData] = useState<AssetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNoData, setHasNoData] = useState(false);
  const API_URL = 'https://api.polygon.io/v2/aggs/ticker/';
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

  useEffect(() => {
    const fetchAssetData = async (daysAgo = 0): Promise<void> => {
      try {
        // Get current date and one day ago
        const currentDate = moment()
          .subtract(daysAgo, 'days')
          .format('YYYY-MM-DD');
        const oneDayAgo = moment()
          .subtract(daysAgo + 1, 'days')
          .format('YYYY-MM-DD');

        // Format symbol based on category
        const formattedSymbol =
          category === 'currency' ? `X:${symbol}` : symbol;

        // Fetch current asset price data
        const currentAssetResponse = await axios.get(
          `${API_URL}${formattedSymbol}/range/1/day/${currentDate}/${currentDate}?apiKey=${API_KEY}`
        );
        const currentAssetData = currentAssetResponse.data.results?.[0];

        // Fetch current BTC price data
        const currentBTCResponse = await axios.get(
          `${API_URL}X:BTCUSD/range/1/day/${currentDate}/${currentDate}?apiKey=${API_KEY}`
        );
        const currentBTCData = currentBTCResponse.data.results?.[0];

        // Fetch one day ago asset price data
        const oneDayAgoAssetResponse = await axios.get(
          `${API_URL}${formattedSymbol}/range/1/day/${oneDayAgo}/${oneDayAgo}?apiKey=${API_KEY}`
        );
        const oneDayAgoAssetData = oneDayAgoAssetResponse.data.results?.[0];

        // Fetch one day ago BTC price data
        const oneDayAgoBTCResponse = await axios.get(
          `${API_URL}X:BTCUSD/range/1/day/${oneDayAgo}/${oneDayAgo}?apiKey=${API_KEY}`
        );
        const oneDayAgoBTCData = oneDayAgoBTCResponse.data.results?.[0];

        if (
          currentAssetData &&
          currentBTCData &&
          oneDayAgoAssetData &&
          oneDayAgoBTCData
        ) {
          // Calculate ratio of asset to BTC
          const currentRatio = currentAssetData.c / currentBTCData.c;
          const oneDayAgoRatio = oneDayAgoAssetData.o / oneDayAgoBTCData.o;

          // Calculate percentage change
          const oneDayChange =
            ((currentRatio - oneDayAgoRatio) / oneDayAgoRatio) * 100;

          setAssetData({
            currentPrice: currentRatio,
            oneDayChange,
          });
          setIsLoading(false);
        } else {
          // If no data found, try previous day
          if (daysAgo < 5) {
            // Limit retries to 5 days
            console.log(
              `No data found for ${currentDate}, retrying previous day...`
            );
            return fetchAssetData(daysAgo + 1);
          } else {
            setHasNoData(true);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('Failed to fetch asset data:', error);
        // If error occurs, try previous day
        if (daysAgo < 5) {
          // Limit retries to 5 days
          console.log(
            `Error fetching data for ${symbol}, retrying previous day...`
          );
          return fetchAssetData(daysAgo + 1);
        } else {
          setHasNoData(true);
          setIsLoading(false);
        }
      }
    };

    fetchAssetData();
  }, [symbol, category]);

  return (
    <Link
      href={
        category === 'currency'
          ? `/${category}/${symbol.toLowerCase()}`
          : `/${category}/${symbol.toLowerCase()}-vs-btc`
      }
      className='p-3 border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:bg-muted/50 block'>
      <div className='font-semibold text-foreground text-sm'>{name}</div>
      <div className='text-[8px] mt-1 text-muted-foreground'>
        {symbol} vs BTC
      </div>

      <div className='mt-2 min-h-[40px]'>
        {isLoading ? (
          <div className='text-[10px] text-muted-foreground/70'>Loading...</div>
        ) : hasNoData ? (
          <div className='text-xs text-muted-foreground/70'>No data</div>
        ) : assetData ? (
          <>
            <div className='text-xs font-semibold'>
              {assetData.currentPrice.toFixed(5)}
            </div>
            <div
              className={`text-xs ${
                assetData.oneDayChange >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
              {assetData.oneDayChange >= 0 ? '+' : ''}
              {assetData.oneDayChange.toFixed(2)}%
            </div>
          </>
        ) : (
          <div className='text-[10px] text-muted-foreground/70'>Loading...</div>
        )}
      </div>
    </Link>
  );
};

export default AssetCard;
