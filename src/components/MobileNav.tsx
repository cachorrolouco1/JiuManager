import React from 'react';
import { LayoutDashboard, User, Swords, Trophy, ShieldCheck } from 'lucide-react';

interface MobileNavProps {
  currentTab?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  setActiveTab?: (tab: any) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  activeTab,
  onTabChange,
  setActiveTab,
}) => {
  const active = currentTab || activeTab || 'dashboard';

  const handleSelectTab = (tab: string) => {
    if (onTabChange) onTabChange(tab);
    else if (setActiveTab) setActiveTab(tab);
  };

  const tabs = [
    { id: 'dashboard', alias: 'inicio', label: 'INÍCIO', icon: LayoutDashboard },
    { id: 'profile', alias: 'atleta', label: 'ATLETA', icon: User },
    { id: 'arena', alias: 'arena', label: 'ARENA', icon: Swords },
    { id: 'tournaments', alias: 'eventos', label: 'EVENTOS', icon: Trophy },
    { id: 'admin', alias: 'admin', label: 'ADMIN', icon: ShieldCheck },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800 px-2 py-1.5 flex items-center justify-around shadow-2xl">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.id || active === tab.alias;

        return (
          <button
            key={tab.id}
            onClick={() => handleSelectTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors min-w-[64px] min-h-[44px] ${
              isActive ? 'text-purple-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-purple-400 scale-110' : 'text-zinc-500'}`} />
            <span className="text-[10px] tracking-wider mt-0.5">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
