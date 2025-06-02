/** @format */

'use client';
import { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import moment from 'moment';
// import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';
import { DatePicker } from './ui/date-range-picker';

const ChartComponent = ({
  chartData,
  selectedTimespan,
  page = 'stock',
  title = 'Value',
  TopTitle = '',
  stocksList = [],
  seletedStockTicker = '',
  setSeletedStockTicker,
  setStartDate,
  startDate,
  endDate,
  setEndDate,
  setDateRangeByPeriod,
}) => {
  const chartContainerRef = useRef();
  const [isLogScale, setIsLogScale] = useState(false);
  const [downloadChartData, setDownloadChartData] = useState([]);
  const [retitle, setReTitle] = useState(title);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  // Chart configuration
  const getChartConfig = (isDarkMode) => ({
    width: chartContainerRef.current?.clientWidth || 0,
    height: 550,
    layout: {
      background: { type: 'solid', color: 'transparent' },
      textColor: isDarkMode ? '#4B5563' : '#4B5563',
    },
    grid: {
      vertLines: {
        color: isDarkMode ? '#374151' : '#374151',
        style: 1,
        visible: true,
      },
      horzLines: {
        color: isDarkMode ? '#374151' : '#374151',
        style: 1,
        visible: true,
      },
    },
    rightPriceScale: {
      borderColor: isDarkMode ? '#4B5563' : '#4B5563',
      borderVisible: true,
      scaleMargins: {
        top: 0.1,
        bottom: 0.1,
      },
    },
    timeScale: {
      borderColor: isDarkMode ? '#4B5563' : '#4B5563',
      borderVisible: true,
      timeVisible: true,
      secondsVisible: false,
      rightOffset: 12,
      barSpacing: 6,
      fixLeftEdge: true,
      fixRightEdge: true,
      tickMarkFormatter: (time) => {
        return selectedTimespan === 'day'
          ? moment.utc(time).format('dd-MM-yyyy')
          : moment.utc(time).format('dd-MM-yyyy hh:mm');
      },
    },
  });

  // Series configuration
  const getSeriesConfig = () => ({
    color: '#10B981',
    lineWidth: 2,
    priceFormat: {
      type: 'custom',
      precision: 2,
      minMove: 0.00001,
      formatter: (price) => price.toFixed(5),
    },
  });

  // Area series configuration
  const getAreaSeriesConfig = () => ({
    lineColor: '#10B981',
    topColor: '#10B981',
    bottomColor: 'rgba(16, 185, 129, 0.1)',
    lineWidth: 2,
    priceFormat: {
      type: 'custom',
      precision: 2,
      minMove: 0.00001,
      formatter: (price) => price.toFixed(5),
    },
  });

  // Data conversion logic
  const convertChartData = (data) => {
    if (!data || data.length === 0) return [];

    return data
      .map((item) => {
        const time =
          selectedTimespan === 'day'
            ? moment(item?.t || item?.stock?.t).format('dd-MM-yyyy')
            : Math.floor((item?.t || item?.stock?.t) / 1000);

        let value;
        if (page === 'stock') {
          value = item?.stock?.o / item?.currency?.o;
        } else if (page === 'currency') {
          value = item?.o > 1 ? 1 / item?.o : item?.o;
        } else if (page === 'commodity') {
          value = item?.stock?.o / item?.currency?.o;
        }

        return { time, value };
      })
      .filter((item) => item.value !== undefined && !isNaN(item.value));
  };

  // Chart initialization and update
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clean up previous chart instance
    if (chartRef.current) {
      chartRef.current.remove();
    }

    // Initialize chart
    const isDarkMode = document.documentElement.classList.contains('dark');
    const chart = createChart(
      chartContainerRef.current,
      getChartConfig(isDarkMode)
    );
    chartRef.current = chart;

    // Create and configure series
    const lineSeries = chart.addLineSeries(getSeriesConfig());
    const areaSeries = chart.addAreaSeries(getAreaSeriesConfig());
    seriesRef.current = { lineSeries, areaSeries };

    // Convert and set data
    const convertedData = convertChartData(chartData);
    lineSeries.setData(convertedData);
    areaSeries.setData(convertedData);
    setDownloadChartData(convertedData);

    // Fit content and handle scale
    chart.timeScale().fitContent();
    chart.priceScale('right').applyOptions({
      mode: isLogScale ? 1 : 0,
    });

    // Handle container resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (chartRef.current && entry.target === chartContainerRef.current) {
          const newWidth = entry.contentRect.width;
          chartRef.current.applyOptions({
            width: newWidth,
            timeScale: {
              rightOffset: 12,
              barSpacing: 6,
              fixLeftEdge: true,
              fixRightEdge: true,
            },
          });
          chartRef.current.timeScale().fitContent();
        }
      }
    });

    // Start observing the container
    resizeObserver.observe(chartContainerRef.current);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      seriesRef.current = null;
    };
  }, [chartData, selectedTimespan, page, isLogScale]);

  // Download data handler
  const downloadData = () => {
    const headersTitle = ['Date', 'Value'];
    const csvRows = [headersTitle.join(',')];

    downloadChartData.forEach((item) => {
      const row = [item.time, item.value];
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${retitle}_chartData.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  console.log({ TopTitle, retitle }, 'TopTitle + retitle');

  return (
    <div className='flex flex-col gap-2 overflow-hidden'>
      <div className='flex gap-4 mb-5 justify-between lg:flex-row flex-col items-start md:items-center'>
        <div className=' font-medium text-lg text-left sm:text-xl w-full'>
          {TopTitle + retitle}
        </div>

        <div className='flex gap-4 items-start sm:items-center sm:flex-row flex-col flex-1 justify-end'>
          <div className='flex items-center gap-2'>
            <span>From:</span>
            <DatePicker
              date={startDate ? new Date(startDate) : undefined}
              onDateChange={(date) => {
                setStartDate(date ? format(date, 'dd-MM-yyyy') : '');
              }}
              className='w-40'
            />
            <span>To:</span>
            <DatePicker
              date={endDate ? new Date(endDate) : undefined}
              onDateChange={(date) => {
                setEndDate(date ? format(date, 'dd-MM-yyyy') : '');
              }}
              className='w-40'
            />
          </div>
          <div className='flex gap-4 items-center'>
            <label className='flex items-center gap-2'>
              <input
                type='checkbox'
                checked={isLogScale}
                onChange={(e) => setIsLogScale(e.target.checked)}
              />
              Logarithmic
            </label>
            <button
              className='bg-muted hover:bg-muted/80 text-muted-foreground font-medium py-1 px-2 rounded inline-flex items-center h-10 transition-colors'
              onClick={downloadData}>
              <svg
                className='fill-current w-4 h-4 mr-2'
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 20 20'>
                <path d='M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z' />
              </svg>
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>

      <div
        ref={chartContainerRef}
        className='w-full h-[550px]'
        style={{ width: 'calc(100% - 2rem)' }}
      />
      <div className='flex mt-2 items-center justify-center'>
        <div
          className='flex gap-3 md:gap-6 w-full rounded-md transition duration-150 ease-in-out'
          role='group'>
          <button
            type='button'
            className='inline-block rounded-s bg-muted px-2 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-muted-foreground transition duration-150 ease-in-out hover:bg-muted/80 focus:bg-muted/80 focus:outline-none focus:ring-0 active:bg-muted/80 rounded-md'
            onClick={() => setDateRangeByPeriod('1D')}>
            1D
          </button>
          <button
            type='button'
            className='inline-block bg-muted px-2 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-muted-foreground transition duration-150 ease-in-out hover:bg-muted/80 focus:bg-muted/80 focus:outline-none focus:ring-0 active:bg-muted/80 rounded-md'
            onClick={() => setDateRangeByPeriod('5D')}>
            5D
          </button>
          <button
            type='button'
            className='inline-block bg-muted px-2 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-muted-foreground transition duration-150 ease-in-out hover:bg-muted/80 focus:bg-muted/80 focus:outline-none focus:ring-0 active:bg-muted/80 rounded-md'
            onClick={() => setDateRangeByPeriod('1M')}>
            1M
          </button>
          <button
            type='button'
            className='inline-block bg-muted px-2 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-muted-foreground transition duration-150 ease-in-out hover:bg-muted/80 focus:bg-muted/80 focus:outline-none focus:ring-0 active:bg-muted/80 rounded-md'
            onClick={() => setDateRangeByPeriod('6M')}>
            6M
          </button>
          <button
            type='button'
            className='inline-block bg-muted px-2 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-muted-foreground transition duration-150 ease-in-out hover:bg-muted/80 focus:bg-muted/80 focus:outline-none focus:ring-0 active:bg-muted/80 rounded-md'
            onClick={() => setDateRangeByPeriod('YTD')}>
            YTD
          </button>
          <button
            type='button'
            className='inline-block bg-muted px-2 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-muted-foreground transition duration-150 ease-in-out hover:bg-muted/80 focus:bg-muted/80 focus:outline-none focus:ring-0 active:bg-muted/80 rounded-md'
            onClick={() => setDateRangeByPeriod('1Y')}>
            1Y
          </button>
          <button
            type='button'
            className='inline-block bg-muted px-2 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-muted-foreground transition duration-150 ease-in-out hover:bg-muted/80 focus:bg-muted/80 focus:outline-none focus:ring-0 active:bg-muted/80 rounded-md'
            onClick={() => setDateRangeByPeriod('5Y')}>
            5Y
          </button>
          <button
            type='button'
            className='inline-block bg-muted px-2 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-muted-foreground transition duration-150 ease-in-out hover:bg-muted/80 focus:bg-muted/80 focus:outline-none focus:ring-0 active:bg-muted/80 rounded-md'
            onClick={() => setDateRangeByPeriod('MAX')}>
            MAX
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChartComponent;
