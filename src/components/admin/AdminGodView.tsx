import React, { useState } from 'react';
import { AdminAuditLog, Athlete, SimulationEngineStatus, UserAccount } from '../../types';
import {
  ShieldAlert,
  Bot,
  Activity,
  Cpu,
  Play,
  Pause,
  FastForward,
  PlusCircle,
  Coins,
  History,
  CheckCircle,
  AlertTriangle,
  Server,
  Zap,
} from 'lucide-react';

interface AdminGodViewProps {
  adminStats: any;
  user: UserAccount | null;
  bots: Athlete[];
  auditLogs: AdminAuditLog[];
  onAdminCreateBots: (count: number, belt: Athlete['belt'], category: Athlete['category'], reason: string) => Promise<void>;
  onAdminSetBotStatus: (botId: string, newStatus: Athlete['status'], reason: string) => Promise<void>;
  onAdminModifyJT: (targetUserId: string, amountJT: number, reason: string) => Promise<void>;
  onAdminControlSimulation: (command: 'START' | 'STOP' | 'PAUSE' | 'FAST_FORWARD', speed?: SimulationEngineStatus['speed'], fastForwardDays?: number) => Promise<void>;
}

export const AdminGodView: React.FC<AdminGodViewProps> = ({
  adminStats,
  user,
  bots,
  auditLogs,
  onAdminCreateBots,
  onAdminSetBotStatus,
  onAdminModifyJT,
  onAdminControlSimulation,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'bots' | 'jt' | 'simulation' | 'audit'>('overview');

  // Bot creation state
  const [botCount, setBotCount] = useState(5);
  const [botBelt, setBotBelt] = useState<Athlete['belt']>('AZUL');
  const [botCategory, setBotCategory] = useState<Athlete['category']>('Médio');

  // JT Modify state
  const [jtTargetUser, setJtTargetUser] = useState('usr_default');
  const [jtAmount, setJtAmount] = useState(500);
  const [jtReason, setJtReason] = useState('Recompensa de Testes Admin');

  // Fast forward state
  const [ffDays, setFfDays] = useState(7);

  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const handleCreateBots = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onAdminCreateBots(Number(botCount), botBelt, botCategory, 'Criação Manual em Lote');
      setActionMsg(`Sucesso: ${botCount} bots procedurais gerados!`);
    } catch (err: any) {
      setActionMsg(`Erro: ${err.message}`);
    }
    setLoading(false);
  };

  const handleModifyJT = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onAdminModifyJT(jtTargetUser, Number(jtAmount), jtReason);
      setActionMsg(`Sucesso: Saldo de ${jtTargetUser} ajustado em ${jtAmount} JT com log de auditoria!`);
    } catch (err: any) {
      setActionMsg(`Erro: ${err.message}`);
    }
    setLoading(false);
  };

  const handleSimulationCommand = async (cmd: 'START' | 'STOP' | 'PAUSE' | 'FAST_FORWARD') => {
    setLoading(true);
    try {
      await onAdminControlSimulation(cmd, 'NORMAL', cmd === 'FAST_FORWARD' ? Number(ffDays) : undefined);
      setActionMsg(`Comando de simulação ${cmd} executado!`);
    } catch (err: any) {
      setActionMsg(`Erro: ${err.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950 via-zinc-950 to-purple-950 border border-red-800/60 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-900/40 rounded-xl border border-red-700/50">
            <ShieldAlert className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">JIUMANAGER ADMIN — MODO DEUS</h1>
              <span className="text-[10px] bg-red-950 text-red-300 px-2 py-0.5 rounded border border-red-800 font-mono font-bold">
                AUDITADO & SEGURO
              </span>
            </div>
            <p className="text-xs text-red-300/80 mt-0.5">
              Controle absoluto do universo de simulação, economia e população de bots.
            </p>
          </div>
        </div>

        {/* Action Message Banner */}
        {actionMsg && (
          <div className="bg-zinc-900 border border-purple-800 text-purple-200 text-xs px-4 py-2 rounded-xl font-mono">
            {actionMsg}
          </div>
        )}
      </div>

      {/* Admin Nav Sub-tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'overview' ? 'bg-red-900 text-white border border-red-700' : 'bg-zinc-900 text-zinc-400 hover:text-white'
          }`}
        >
          <Server className="w-4 h-4 text-red-400" />
          <span>System Health & Visão Geral</span>
        </button>

        <button
          onClick={() => setActiveTab('bots')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'bots' ? 'bg-red-900 text-white border border-red-700' : 'bg-zinc-900 text-zinc-400 hover:text-white'
          }`}
        >
          <Bot className="w-4 h-4 text-purple-400" />
          <span>Bot Control Center ({bots.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('simulation')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'simulation' ? 'bg-red-900 text-white border border-red-700' : 'bg-zinc-900 text-zinc-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4 text-amber-400" />
          <span>Motor de Simulação & Tempo</span>
        </button>

        <button
          onClick={() => setActiveTab('jt')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'jt' ? 'bg-red-900 text-white border border-red-700' : 'bg-zinc-900 text-zinc-400 hover:text-white'
          }`}
        >
          <Coins className="w-4 h-4 text-amber-400" />
          <span>Controle de JT</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'audit' ? 'bg-red-900 text-white border border-red-700' : 'bg-zinc-900 text-zinc-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4 text-emerald-400" />
          <span>Audit Logs ({auditLogs.length})</span>
        </button>
      </div>

      {/* Tab 1: System Health & Overview */}
      {activeTab === 'overview' && adminStats && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 flex flex-col justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase">Status da API</span>
              <span className="text-xl font-black text-emerald-400 font-mono mt-2">
                {adminStats.systemHealth.apiStatus}
              </span>
            </div>

            <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 flex flex-col justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase">Banco de Dados</span>
              <span className="text-xl font-black text-purple-400 font-mono mt-2">
                {adminStats.systemHealth.dbStatus}
              </span>
            </div>

            <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 flex flex-col justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase">Motor 24/7 World Engine</span>
              <span className="text-xl font-black text-amber-400 font-mono mt-2">
                {adminStats.simulationStatus.status.toUpperCase()}
              </span>
            </div>

            <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 flex flex-col justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase">JT Circulante Total</span>
              <span className="text-xl font-black text-white font-mono mt-2">
                {adminStats.totalJTCirculating.toLocaleString()} JT
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Bot Control Center & Creator */}
      {activeTab === 'bots' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form to generate procedural bots */}
          <form onSubmit={handleCreateBots} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4 shadow-xl">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-purple-400" />
              Gerador Procedural de Bots IA
            </h2>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Quantidade de Bots</label>
              <input
                type="number"
                min="1"
                max="50"
                value={botCount}
                onChange={(e) => setBotCount(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Faixa Inicial</label>
              <select
                value={botBelt}
                onChange={(e) => setBotBelt(e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="BRANCA">Faixa Branca</option>
                <option value="AZUL">Faixa Azul</option>
                <option value="ROXA">Faixa Roxa</option>
                <option value="MARROM">Faixa Marrom</option>
                <option value="PRETA">Faixa Preta</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Categoria de Peso</label>
              <select
                value={botCategory}
                onChange={(e) => setBotCategory(e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="Pluma">Pluma</option>
                <option value="Leve">Leve</option>
                <option value="Médio">Médio</option>
                <option value="Pesado">Pesado</option>
                <option value="Absoluto">Absoluto</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl text-xs transition"
            >
              Criar N Bots com IA
            </button>
          </form>

          {/* List of active bots with Pause/Resume triggers */}
          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4 shadow-xl">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
              Gerenciamento de Entidades IA Existentes
            </h2>

            <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1">
              {bots.map((bot) => (
                <div key={bot.id} className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-xs flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img src={bot.avatar} alt={bot.name} className="w-8 h-8 rounded-lg object-cover" />
                    <div>
                      <span className="font-bold text-white block">{bot.name}</span>
                      <span className="text-[10px] text-zinc-400">{bot.belt} • {bot.category} • {bot.academyName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                      bot.status === 'active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'
                    }`}>
                      {bot.status.toUpperCase()}
                    </span>

                    {bot.status === 'active' ? (
                      <button
                        onClick={() => onAdminSetBotStatus(bot.id, 'paused', 'Pausa solicitada pelo Admin')}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold px-2.5 py-1 rounded transition"
                      >
                        Pausar
                      </button>
                    ) : (
                      <button
                        onClick={() => onAdminSetBotStatus(bot.id, 'active', 'Reativação pelo Admin')}
                        className="bg-emerald-900 hover:bg-emerald-800 text-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded transition"
                      >
                        Reativar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Simulation Engine & Fast Forward */}
      {activeTab === 'simulation' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-6 shadow-xl">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            Controle da Velocidade e Avanço Temporal da Simulação
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => handleSimulationCommand('START')}
              className="p-4 bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-800 text-emerald-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <Play className="w-4 h-4" />
              <span>Iniciar World Engine</span>
            </button>

            <button
              onClick={() => handleSimulationCommand('PAUSE')}
              className="p-4 bg-amber-950/80 hover:bg-amber-900/80 border border-amber-800 text-amber-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <Pause className="w-4 h-4" />
              <span>Pausar Simulação Global</span>
            </button>

            <button
              onClick={() => handleSimulationCommand('STOP')}
              className="p-4 bg-red-950/80 hover:bg-red-900/80 border border-red-800 text-red-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Interromper Motor</span>
            </button>
          </div>

          <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 flex flex-col gap-3">
            <h3 className="text-xs font-bold text-zinc-300 uppercase">Simular Avanço Temporal (Fast Forward)</h3>
            <p className="text-xs text-zinc-400">
              Avança o tempo do universo simular de BJJ em lote para testar evolução de ranking e torneios.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={ffDays}
                onChange={(e) => setFfDays(Number(e.target.value))}
                min="1"
                max="30"
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white w-32 font-mono"
              />
              <span className="text-xs text-zinc-400 font-mono">Dias de Simulação</span>
              <button
                onClick={() => handleSimulationCommand('FAST_FORWARD')}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-5 py-2 rounded-lg transition flex items-center gap-1.5"
              >
                <FastForward className="w-4 h-4" />
                <span>Executar Avanço Temporal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: JT Modify */}
      {activeTab === 'jt' && (
        <form onSubmit={handleModifyJT} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4 max-w-lg shadow-xl">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            Modificação Manual Auditada de Saldo JT
          </h2>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">ID do Usuário Alvo</label>
            <input
              type="text"
              value={jtTargetUser}
              onChange={(e) => setJtTargetUser(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Valor de Ajuste (+ ou -)</label>
            <input
              type="number"
              value={jtAmount}
              onChange={(e) => setJtAmount(Number(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Motivo Justificado da Alteração</label>
            <input
              type="text"
              value={jtReason}
              onChange={(e) => setJtReason(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold py-3 rounded-xl text-xs transition"
          >
            Aplicar Ajuste Auditado
          </button>
        </form>
      )}

      {/* Tab 5: Immutable Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4 shadow-xl">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            Registro Inviolável de Auditoria Administrativa (Audit Log)
          </h2>

          <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1">
            {auditLogs.map((log) => (
              <div key={log.id} className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-xs flex items-start justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white font-mono">{log.action}</span>
                    <span className="text-[10px] bg-red-950 text-red-300 px-1.5 py-0.2 rounded border border-red-800 font-mono">
                      {log.adminRole}
                    </span>
                  </div>
                  <span className="text-zinc-400">Alvo: {log.targetId} • Motivo: {log.reason}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Anterior: {log.previousValue} → Novo: {log.newValue}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
            {auditLogs.length === 0 && (
              <p className="text-xs text-zinc-500 italic p-4 text-center">Nenhum log gravado ainda.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
