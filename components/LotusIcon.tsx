
import React from 'react';

export const LotusIcon: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
  <svg 
    viewBox="0 0 100 100" 
    className={className} 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M50 20C50 20 40 40 20 45C40 45 50 65 50 65C50 65 60 45 80 45C60 40 50 20 50 20Z" 
      className="fill-amber-600 opacity-20"
    />
    <path 
      d="M50 30C50 30 45 45 35 48C45 48 50 58 50 58C50 58 55 48 65 48C55 45 50 30 50 30Z" 
      className="fill-amber-600"
    />
    <path 
      d="M30 60C30 60 45 65 50 85C55 65 70 60 70 60C70 60 55 55 50 35C45 55 30 60 30 60Z" 
      className="fill-amber-700"
    />
  </svg>
);
