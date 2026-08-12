import React from 'react';
import { BeltRank } from '../types';

interface BeltBadgeProps {
  belt: BeltRank;
  degrees?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const BeltBadge: React.FC<BeltBadgeProps> = ({ belt, degrees = 0, size = 'md' }) => {
  const getBeltBg = () => {
    switch (belt) {
      case 'BRANCA':
        return 'bg-slate-100 text-slate-900 border-slate-300';
      case 'AZUL':
        return 'bg-blue-600 text-white border-blue-400';
      case 'ROXA':
        return 'bg-purple-700 text-white border-purple-500';
      case 'MARROM':
        return 'bg-amber-900 text-amber-100 border-amber-700';
      case 'PRETA':
        return 'bg-zinc-950 text-white border-zinc-700';
      default:
        return 'bg-slate-200 text-slate-900';
    }
  };

  const heights = {
    sm: 'h-5 text-xs px-2',
    md: 'h-7 text-xs px-3',
    lg: 'h-9 text-sm px-4',
  };

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-md font-bold tracking-wider uppercase border shadow-sm ${getBeltBg()} ${heights[size]}`}
    >
      <span>Faixa {belt}</span>
      {/* Black or Red Sleeve for BJJ Degrees */}
      <div className="flex items-center gap-0.5 bg-red-600 px-1 py-0.5 rounded-xs border border-red-800">
        {Array.from({ length: degrees }).map((_, i) => (
          <div key={i} className="w-1 h-3 bg-white shadow-xs" title={`Degree ${i + 1}`} />
        ))}
        {degrees === 0 && <span className="text-[9px] text-white/80 font-mono">0G</span>}
      </div>
    </div>
  );
};
