/** @format */

'use client';
import { useEffect, useState } from 'react';
import TradingviewChart from '../../components/TradingviewChart.js';
import useTradingViewLogic from '../../utlities/tradingViewLogic';
import useDateUtils from '../../utlities/dateUtils';

const TradingViewSection = ({
  stocksList = [],
  initialStockTicker = 'AAPL',
  initialTitle = 'Apple Inc / BTC',
  page = 'stock',
  TopTitle = 'Stocks : ',
  selectedTimespan = 'day',
}) => {
  // Initialize our utility hooks
  const tradingViewLogic = useTradingViewLogic();
  const dateUtils = useDateUtils();

  // Get date ranges
  const { formatted: currentDateFormat } = dateUtils.getCurrentDate();
  const dateRanges = dateUtils.getDateRanges();

  // State variables
  const [selectedStockTicker, setSelectedStockTicker] =
    useState(initialStockTicker);
  const [selectedCurrencyTicker, setSelectedCurrencyTicker] =
    useState('BTCUSD');
  const [title, setTitle] = useState(initialTitle);
  const [startDate, setStartDate] = useState(dateRanges.oneYearAgo);
  const [endDate, setEndDate] = useState(currentDateFormat);

  // Data states
  const [stockData, setStockData] = useState([]);
  const [currencyData, setCurrencyData] = useState([]);
  const [BTCData, setBTCData] = useState([]);
  const [chartData, setChartData] = useState([]);

  // Currency list
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

  // Fetch stock and currency data
  useEffect(() => {
    const getStockData = async () => {
      const data = await tradingViewLogic.fetchStockData(
        selectedStockTicker,
        selectedTimespan,
        startDate,
        endDate
      );
      setStockData(data || []);
    };

    const getCurrencyData = async () => {
      const data = await tradingViewLogic.fetchCurrencyData(
        page === 'currency' ? selectedStockTicker : selectedCurrencyTicker,
        selectedTimespan,
        startDate,
        endDate,
        page
      );
      setCurrencyData(data || []);
    };

    const getBTCData = async () => {
      const data = await tradingViewLogic.fetchCurrencyData(
        'BTCUSD',
        selectedTimespan,
        startDate,
        endDate,
        'currency'
      );
      setBTCData(data || []);
    };

    if (page === 'stock') {
      getStockData();
    }
    getCurrencyData();
    getBTCData();
  }, [
    startDate,
    endDate,
    selectedStockTicker,
    selectedTimespan,
    selectedCurrencyTicker,
    page,
  ]);

  // Merge chart data
  useEffect(() => {
    if (page === 'currency') {
      // For currency page, we need to process the currency data differently
      if (Array.isArray(currencyData) && currencyData.length > 0) {
        const processedData = currencyData.map((item) => ({
          t: item.t,
          o: item.o > 1 ? 1 / item.o : item.o,
          h: item.h > 1 ? 1 / item.h : item.h,
          l: item.l > 1 ? 1 / item.l : item.l,
          c: item.c > 1 ? 1 / item.c : item.c,
          v: item.v,
          n: item.n,
        }));
        setChartData(processedData);
      } else {
        setChartData([]);
      }
    } else {
      const mergedData = tradingViewLogic.mergeStockAndCurrencyData(
        stockData || [],
        currencyData || [],
        selectedTimespan
      );
      setChartData([...mergedData]);
    }
  }, [stockData, currencyData, selectedTimespan, page]);

  // Set date range based on period button
  const setDateRangeByPeriod = (period) => {
    const range = dateUtils.setDateRangeByPeriod(period);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  };

  return (
    <div className='bg-background text-foreground'>
      <TradingviewChart
        chartData={chartData}
        selectedTimespan={selectedTimespan}
        title={title}
        TopTitle={TopTitle}
        stocksList={stocksList}
        seletedStockTicker={selectedStockTicker}
        setSeletedStockTicker={(e) => setSelectedStockTicker(e)}
        startDate={startDate}
        endDate={endDate}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        setDateRangeByPeriod={setDateRangeByPeriod}
        currencyList={currencyList}
        selectedCurrencyTicker={selectedCurrencyTicker}
        setSelectedCurrencyTicker={(e) => setSelectedCurrencyTicker(e)}
        page={page}
      />
    </div>
  );
};

export default TradingViewSection;
