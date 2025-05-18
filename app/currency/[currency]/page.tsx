/** @format */

import { Metadata } from 'next';
import CurrencyPageClient from './client.page';

interface CurrencyPageProps {
  params: {
    currency: string;
  };
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: CurrencyPageProps): Promise<Metadata> {
  const currencySymbol = params.currency.split('-')[0].toUpperCase();

  // Define currencyList array to get currency name
  const currencyList = [
    { symbol: 'BTCUSD', name: 'US Dollar' },
    { symbol: 'BTCAUD', name: 'Australian Dollar' },
    { symbol: 'BTCEUR', name: 'Euro' },
    { symbol: 'BTCGBP', name: 'British Pound' },
    { symbol: 'BTCJPY', name: 'Japanese Yen' },
    { symbol: 'ETHBTC', name: 'Ethereum' },
    { symbol: 'LTCBTC', name: 'Litecoin' },
    { symbol: 'XRPBTC', name: 'XRP' },
  ];

  const currencyInfo = currencyList.find(
    (curr) => curr.symbol === currencySymbol
  );
  const currencyName = currencyInfo ? currencyInfo.name : 'Unknown Currency';

  return {
    title: `${currencyName} vs Bitcoin | ${currencySymbol} vs BTC Price Comparison — BasedinBitcoin`,
    description: `Compare ${currencyName} price with Bitcoin (BTC). View real-time price charts, historical data, and market analysis for ${currencySymbol} vs BTC.`,
    keywords: `${currencySymbol}, Bitcoin, BTC, cryptocurrency, forex, market analysis, price comparison, trading chart`,
    openGraph: {
      title: `${currencyName} vs Bitcoin | ${currencySymbol} vs BTC Price Comparison — BasedinBitcoin`,
      description: `Compare ${currencyName} price with Bitcoin (BTC). View real-time price charts and market analysis.`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${currencyName} vs Bitcoin | ${currencySymbol} vs BTC Price Comparison — BasedinBitcoin`,
      description: `Compare ${currencyName} price with Bitcoin (BTC). View real-time price charts and market analysis.`,
    },
  };
}

export default function CurrencyPage({ params }: CurrencyPageProps) {
  return <CurrencyPageClient currency={params.currency} />;
}
