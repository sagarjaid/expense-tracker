/** @format */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// Asset data
const stocksList = [
  { name: 'Apple Inc', symbol: 'AAPL' },
  { name: 'Tesla Inc', symbol: 'TSLA' },
  { name: 'Microsoft Inc', symbol: 'MSFT' },
  { name: 'Nvidia Inc', symbol: 'NVDA' },
  { name: 'Amazon Inc', symbol: 'AMZN' },
  { name: 'Alphabet Inc', symbol: 'GOOGL' },
  { name: 'Meta Inc', symbol: 'META' },
  { name: 'Berkshire Hathaway Inc', symbol: 'BRK.B' },
  { name: 'ExxonMobil Inc', symbol: 'XOM' },
  { name: 'BP Inc', symbol: 'BP' },
  { name: 'Marathon Digital Inc', symbol: 'MARA' },
  { name: 'Microstrategy Inc', symbol: 'MSTR' },
  { name: 'JPMorgan Chase Inc', symbol: 'JPM' },
  { name: 'Goldman Sachs Inc', symbol: 'GS' },
  { name: 'Mastercard Inc', symbol: 'MA' },
  { name: 'Visa Inc', symbol: 'V' },
  { name: 'Disney Inc', symbol: 'DIS' },
  { name: 'LVMH Inc', symbol: 'NKE' },
  { name: 'Pepsi', symbol: 'PEP' },
  { name: 'Coca Cola', symbol: 'KO' },
  { name: 'CSL Inc', symbol: 'CSL' },
  { name: 'Taiwan Semiconductor Manufacturing', symbol: 'TSM' },
  { name: 'General Electric', symbol: 'GE' },
  { name: 'General Motors', symbol: 'GM' },
  { name: 'Ford Motor', symbol: 'F' },
];

const commodityList = [
  { name: 'Gold', symbol: 'GLD' },
  { name: 'Silver', symbol: 'SLV' },
  { name: 'Copper', symbol: 'CPER' },
  { name: 'Platinum', symbol: 'PPLT' },
  { name: 'Wti Crude Oil', symbol: 'USO' },
  { name: 'Sugar', symbol: 'CANE' },
  { name: 'Corn', symbol: 'CORN' },
  { name: 'Coffee', symbol: 'COFE' },
  { name: 'Natural Gas', symbol: 'UNG' },
  { name: 'Wheat', symbol: 'WEAT' },
];

const currencyList = [
  { symbol: 'USD', name: 'US Dollar' },
  { symbol: 'AUD', name: 'Australian Dollar' },
  { symbol: 'EUR', name: 'Euro' },
  { symbol: 'GBP', name: 'British Pound' },
  { symbol: 'JPY', name: 'Japanese Yen' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'LTC', name: 'Litecoin' },
  { symbol: 'XRP', name: 'XRP' },
];

const estateList = [
  { name: 'SPDR Dow Jones Global Real Estate ETF', symbol: 'RWO' },
  { name: 'Invesco NASDAQ ETF', symbol: 'IYR' },
  { name: 'iShares U.S. Real Estate ETF', symbol: 'IYY' },
  { name: 'iShares Global REIT ETF', symbol: 'REET' },
];

const indexList = [
  { name: 'S&P500 ETF', symbol: 'SPY' },
  { name: 'Invesco NASDAQ ETF', symbol: 'QQQ' },
  { name: 'iShares Dow Jones ETF', symbol: 'IYY' },
  { name: 'iShares Bitcoin Trust', symbol: 'IBIT' },
  { name: 'Fidelity Wise Origin Bitcoin Trust', symbol: 'FBTC' },
  { name: 'Grayscale Bitcoin Trust', symbol: 'GBTC' },
];

const bondsList = [
  { name: 'iShares U.S. Treasury Bond ETF', symbol: 'GOVT' },
  { name: 'iShares Core U.S. Aggregate Bond ETF', symbol: 'AGG' },
  { name: 'iShares iBoxx $ Investment Grade Corporate Bond', symbol: 'LQD' },
  { name: 'iShares MBS ETF', symbol: 'MBB' },
];

type Asset = {
  name: string;
  symbol: string;
};

type AssetCategory = {
  name: string;
  assets: Asset[];
};

const categories: AssetCategory[] = [
  {
    name: 'All',
    assets: [
      ...stocksList,
      ...commodityList,
      ...currencyList,
      ...estateList,
      ...indexList,
      ...bondsList,
    ],
  },
  { name: 'Stocks', assets: stocksList },
  { name: 'Commodities', assets: commodityList },
  { name: 'Currencies', assets: currencyList },
  { name: 'Real Estate', assets: estateList },
  { name: 'Indices', assets: indexList },
  { name: 'Bonds', assets: bondsList },
];

export function AssetSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const popupRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle outside click to close popup
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter assets based on search term and active category
  useEffect(() => {
    const category = categories.find((cat) => cat.name === activeCategory);
    if (!category) return;

    const filtered = category.assets.filter(
      (asset) =>
        asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredAssets(filtered);
  }, [searchTerm, activeCategory]);

  // Handle asset click - open in new tab
  const handleAssetClick = (symbol: string) => {
    // Determine the route based on the asset category
    let route = '';
    if (currencyList.some((c) => c.symbol === symbol)) {
      route = `/currency/${symbol.toLowerCase()}`;
    } else if (stocksList.some((s) => s.symbol === symbol)) {
      route = `/stock/${symbol.toLowerCase()}-vs-btc`;
    } else if (commodityList.some((c) => c.symbol === symbol)) {
      route = `/commodity/${symbol.toLowerCase()}-vs-btc`;
    } else if (estateList.some((e) => e.symbol === symbol)) {
      route = `/real-estate/${symbol.toLowerCase()}-vs-btc`;
    } else if (indexList.some((i) => i.symbol === symbol)) {
      route = `/indices/${symbol.toLowerCase()}-vs-btc`;
    } else if (bondsList.some((b) => b.symbol === symbol)) {
      route = `/bond/${symbol.toLowerCase()}-vs-btc`;
    }

    if (route) {
      window.open(route, '_blank');
      setIsOpen(false);
    }
  };

  // Focus input when popup opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className='relative w-full max-w-xl -ml-2'>
      {/* Search Input */}

      <div className='relative'>
        <div className='relative group'>
          <div className='absolute -inset-[2px] bg-gradient-to-r from-green-600 via-blue-600 to-yellow-600 rounded-full blur-sm opacity-100 group-focus-within:opacity-0 transition-all duration-300 animate-gradient'></div>
          <Input
            ref={inputRef}
            type='text'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={() => setIsOpen(true)}
            placeholder='Search symbols or companies...'
            className={cn(
              'relative pr-10 h-14 pl-4 py-2 bg-background text-base border-0 rounded-lg focus:outline-none focus:ring-0 focus:border',
              isOpen ? 'rounded-b-none' : 'rounded-full'
            )}
          />
        </div>
        <Search className='absolute right-6 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
        {searchTerm && (
          <Button
            variant='ghost'
            size='icon'
            className='absolute right-12 top-1/2 transform -translate-y-1/2 h-6 w-6 text-muted-foreground'
            onClick={() => setSearchTerm('')}>
            <X className='h-3 w-3' />
          </Button>
        )}
      </div>

      <style jsx>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>

      {/* Search Popup */}
      {isOpen && (
        <div
          ref={popupRef}
          className='absolute top-14 left-0 w-full bg-background border border-t-0 rounded-lg  rounded-t-none shadow-lg z-10  h-[290px] max-h-[80vh] overflow-hidden flex flex-col'>
          <Tabs
            defaultValue='All'
            value={activeCategory}
            onValueChange={setActiveCategory}
            className='w-full'>
            <div className='border-b hover:overflow-x-auto'>
              <TabsList className='bg-transparent h-auto p-0'>
                {categories.map((category) => (
                  <TabsTrigger
                    key={category.name}
                    value={category.name}
                    className={cn(
                      'px-4 py-1.5 my-2 rounded-full data-[state=active]:bg-muted data-[state=active]:text-foreground',
                      category.name === 'All' && 'm-1'
                    )}>
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className='overflow-y-auto z-50 max-h-[50vh]'>
              {categories.map((category) => (
                <TabsContent
                  key={category.name}
                  value={category.name}
                  className='m-0 p-0'>
                  {filteredAssets.length > 0 ? (
                    <ul className='divide-y'>
                      {filteredAssets.map((asset) => (
                        <li
                          key={`${category.name}-${asset.symbol}`}
                          className='hover:bg-muted/50 cursor-pointer'
                          onClick={() => handleAssetClick(asset.symbol)}>
                          <div className='flex items-center p-3'>
                            <div className='flex-1'>
                              <div className='flex items-center gap-2'>
                                <div className='h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center text-primary'>
                                  {asset.symbol.charAt(0)}
                                </div>
                                <div>
                                  <div className='font-medium'>
                                    {asset.symbol}
                                  </div>
                                  <div className='text-sm text-muted-foreground'>
                                    {asset.name}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className='text-sm text-muted-foreground'>
                              {category.name === 'All'
                                ? currencyList.some(
                                    (c) => c.symbol === asset.symbol
                                  )
                                  ? 'Crypto'
                                  : stocksList.some(
                                      (s) => s.symbol === asset.symbol
                                    )
                                  ? 'Stock'
                                  : commodityList.some(
                                      (c) => c.symbol === asset.symbol
                                    )
                                  ? 'Commodity'
                                  : estateList.some(
                                      (e) => e.symbol === asset.symbol
                                    )
                                  ? 'Real Estate'
                                  : indexList.some(
                                      (i) => i.symbol === asset.symbol
                                    )
                                  ? 'Index'
                                  : 'Bond'
                                : category.name.slice(0, -1)}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className='p-8 text-center text-muted-foreground'>
                      No results found. Try a different search term.
                    </div>
                  )}
                </TabsContent>
              ))}
            </div>
          </Tabs>

          <div className='p-3 text-center text-sm text-muted-foreground border-t'>
            Simply start typing while on the chart to pull up this search box
          </div>
        </div>
      )}
    </div>
  );
}
