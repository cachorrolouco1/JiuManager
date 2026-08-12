import React from 'react';
import {
  LayoutDashboard,
  User,
  Swords,
  Trophy,
  Building2,
  BarChart3,
  Wallet,
  ShieldAlert,
  Bot,
  Flame,
} from 'lucide-react';

interface SidebarProps {
  currentTab?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  setActiveTab?: (tab: any) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
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

  const navItems = [
    { id: 'dashboard', alias: 'inicio', label: 'Início', icon: LayoutDashboard },
    { id: 'profile', alias: 'atleta', label: 'Carreira & Treino', icon: User },
    { id: 'arena', alias: 'arena', label: 'Arena de Luta', icon: Swords, highlight: true },
    { id: 'tournaments', alias: 'eventos', label: 'Torneios & Opens', icon: Trophy },
    { id: 'academies', alias: 'academias', label: 'Academias', icon: Building2 },
    { id: 'rankings', alias: 'rankings', label: 'Rankings BJJ', icon: BarChart3 },
    { id: 'jt_wallet', alias: 'jt', label: 'Carteira JT', icon: Wallet },
    { id: 'admin', alias: 'admin', label: 'Painel Admin God', icon: ShieldAlert, danger: true },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-zinc-950 border-r border-zinc-800 p-4 gap-6 shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Quick Navigation Header */}
      <div className="px-2">
        <h2 className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase">Menu Principal</h2>
      </div>

      <nav className="flex flex-col gap-1.5 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id || active === item.alias;

          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? item.danger
                    ? 'bg-red-950/80 text-red-200 border border-red-800/80 shadow-sm'
                    : 'bg-purple-600 text-white border border-purple-500 shadow-md shadow-purple-950/50'
                  : item.highlight
                  ? 'bg-zinc-900/90 text-purple-300 hover:bg-zinc-800 border border-purple-900/40'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.danger ? 'text-red-400' : 'text-purple-400'}`} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.highlight && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Lutas ao vivo disponiveis" />
              )}
            </button>
          );
        })}
      </nav>

      {/* World Engine Live Indicator Widget */}
      <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-purple-400" />
            <span>Mundo Ativo 24/7</span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            ONLINE
          </span>
        </div>
        <p className="text-[11px] text-zinc-400 leading-snug">
          Bots treinando e lutando em tempo real. Toda simulação é auditada.
        </p>
      </div>
    </aside>
  );
};
