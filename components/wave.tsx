/** @format */

import React, { useEffect, useState } from 'react';

const Wave = ({
  className = '',
  fill = 'white',
}: {
  className?: string;
  fill?: string;
}) => {
  const [heights, setHeights] = useState([60, 80, 60]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeights([
        Math.floor(40 + Math.random() * 40),
        Math.floor(50 + Math.random() * 30),
        Math.floor(40 + Math.random() * 40),
      ]);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <svg
      width='200'
      height='120'
      viewBox='0 0 200 120'
      fill='none'
      className={className}>
      {heights.map((h, i) => (
        <rect
          key={i}
          x={60 + i * 30}
          y={(120 - h) / 2} // Center vertically
          width='20'
          height={h}
          rx='10'
          fill={fill}
        />
      ))}
    </svg>
  );
};

export default Wave;
