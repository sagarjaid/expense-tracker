/** @format */

interface AssetItem {
  name: string;
  symbol: string;
}

export const assetData = {
  stocksList: [
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
  ] as AssetItem[],

  commodityList: [
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
  ] as AssetItem[],

  currencyList: [
    { symbol: 'USD', name: 'US Dollar' },
    { symbol: 'AUD', name: 'Australian Dollar' },
    { symbol: 'EUR', name: 'Euro' },
    { symbol: 'GBP', name: 'British Pound' },
    { symbol: 'JPY', name: 'Japanese Yen' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'LTC', name: 'Litecoin' },
    { symbol: 'XRP', name: 'XRP' },
  ] as AssetItem[],

  estateList: [
    { name: 'SPDR Dow Jones Global Real Estate ETF', symbol: 'RWO' },
    { name: 'Invesco NASDAQ ETF', symbol: 'IYR' },
    { name: 'iShares U.S. Real Estate ETF', symbol: 'IYY' },
    { name: 'iShares Global REIT ETF', symbol: 'REET' },
  ] as AssetItem[],

  indexList: [
    { name: 'S&P500 ETF', symbol: 'SPY' },
    { name: 'Invesco NASDAQ ETF', symbol: 'QQQ' },
    { name: 'iShares Dow Jones ETF', symbol: 'IYY' },
    { name: 'iShares Bitcoin Trust', symbol: 'IBIT' },
    { name: 'Fidelity Wise Origin Bitcoin Trust', symbol: 'FBTC' },
    { name: 'Grayscale Bitcoin Trust', symbol: 'GBTC' },
  ] as AssetItem[],

  bondsList: [
    { name: 'iShares U.S. Treasury Bond ETF', symbol: 'GOVT' },
    { name: 'iShares Core U.S. Aggregate Bond ETF', symbol: 'AGG' },
    { name: 'iShares iBoxx $ Investment Grade Corporate Bond', symbol: 'LQD' },
    { name: 'iShares MBS ETF', symbol: 'MBB' },
  ] as AssetItem[],
};
