import React from 'react';
import { Athlete, UserAccount } from '../types';
import { BeltBadge } from './BeltBadge';
import { Zap, Coins, ShieldCheck, Cpu, History, Crown } from 'lucide-react';

interface NavbarProps {
  athlete: Athlete | null;
  user: UserAccount | null;
  currentTab?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  setActiveTab?: (tab: any) => void;
  onOpenOfflineModal?: () => void;
  isOnline?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  athlete,
  user,
  currentTab,
  activeTab,
  onTabChange,
  setActiveTab,
  onOpenOfflineModal = () => {},
}) => {
  const active = currentTab || activeTab || 'dashboard';
  const handleTabChange = (tab: string) => {
    if (onTabChange) onTabChange(tab);
    else if (setActiveTab) setActiveTab(tab);
  };

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 text-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & JiuSpeak Tag */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleTabChange('dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-zinc-900 p-0.5 shadow-lg shadow-purple-900/20 flex items-center justify-center">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
              <span className="font-extrabold text-lg text-purple-400 tracking-tighter">JM</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-wide bg-gradient-to-r from-white via-zinc-200 to-purple-400 bg-clip-text text-transparent">
                JiuManager
              </span>
              <span className="hidden sm:inline-block text-[10px] bg-purple-950/80 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800/50 font-mono">
                JiuSpeak BJJ
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 hidden md:block">Simulador de Carreira BJJ</span>
          </div>
        </div>

        {/* Top Center: Athlete Quick Status */}
        {athlete && (
          <div className="hidden md:flex items-center gap-4 bg-zinc-900/80 border border-zinc-800 rounded-full px-4 py-1.5">
            <div className="flex items-center gap-2">
              <img
                src={athlete.avatar}
                alt={athlete.name}
                className="w-7 h-7 rounded-full object-cover ring-2 ring-purple-500/50"
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-zinc-200">{athlete.name}</span>
                <span className="text-[10px] text-zinc-400">{athlete.academyName}</span>
              </div>
            </div>

            <div className="h-4 w-[1px] bg-zinc-800" />

            <BeltBadge belt={athlete.belt} degrees={athlete.degrees} size="sm" />

            <div className="h-4 w-[1px] bg-zinc-800" />

            {/* Energy Bar */}
            <div className="flex items-center gap-1.5" title="Energia / Estamina do Atleta">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
              <div className="w-16 h-2 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${athlete.energy}%` }}
                />
              </div>
              <span className="text-[11px] font-mono font-bold text-zinc-300">{athlete.energy}%</span>
            </div>
          </div>
        )}

        {/* Right Controls: Offline Summary, JT Wallet, & God Mode Admin */}
        <div className="flex items-center gap-2">
          {/* Offline Summary Trigger */}
          <button
            onClick={onOpenOfflineModal}
            className="flex items-center gap-1.5 text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-700 transition"
            title="Ver o que aconteceu enquanto esteve offline"
          >
            <History className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Offline Digest</span>
          </button>

          {/* JT Balance Badge */}
          {user && (
            <button
              onClick={() => handleTabChange('jt_wallet')}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-950/60 to-zinc-900 hover:border-amber-500/50 text-amber-300 px-3 py-1.5 rounded-lg border border-amber-800/40 text-xs font-bold transition shadow-xs"
            >
              <Coins className="w-4 h-4 text-amber-400" />
              <span>{user.jtBalance.toLocaleString()} JT</span>
            </button>
          )}

          {/* Admin God Mode Toggle */}
          <button
            onClick={() => handleTabChange('admin')}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-semibold transition ${
              active === 'admin'
                ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-900/30'
                : 'bg-purple-950/50 hover:bg-purple-900/60 text-purple-300 border-purple-800/60'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Modo Deus</span>
          </button>
        </div>
      </div>
    </header>
  );
};
