import React, { useState } from 'react';
import { JTTransaction, UserAccount } from '../../types';
import { Wallet, Coins, ArrowUpRight, ShieldCheck, History, Send } from 'lucide-react';

interface JTWalletViewProps {
  user: UserAccount | null;
  transactions: JTTransaction[];
  onTransferJT: (toUserId: string, amountJT: number, reason: string) => Promise<void>;
}

export const JTWalletView: React.FC<JTWalletViewProps> = ({ user, transactions, onTransferJT }) => {
  const [toUserId, setToUserId] = useState('');
  const [amountJT, setAmountJT] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!user) return <div className="p-8 text-zinc-400">Carregando carteira...</div>;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toUserId || !amountJT) return;
    setLoading(true);
    setMsg(null);
    try {
      await onTransferJT(toUserId, Number(amountJT), reason);
      setMsg('Transferência de JT enviada com sucesso!');
      setToUserId('');
      setAmountJT('');
      setReason('');
    } catch (err: any) {
      setMsg(`Erro: ${err.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header Balance Banner */}
      <div className="bg-gradient-to-r from-zinc-950 via-amber-950/60 to-zinc-950 border border-amber-800/50 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/30">
            <Coins className="w-10 h-10 text-amber-400" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-300/80 uppercase tracking-wider">
              Saldo Oficial de JiuSpeak Token (JT)
            </span>
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-0.5 font-mono">
              {user.jtBalance.toLocaleString()} <span className="text-amber-400 text-2xl">JT</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Carteira auditada e integrada ao ecossistema JiuSpeak.
            </p>
          </div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-xl flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-white block">Regra de Segurança da Economia</span>
            <span className="text-zinc-400">Entidades IA não possuem carteiras reais e não recebem JT.</span>
          </div>
        </div>
      </div>

      {/* 2 Columns: Transfer Form & Transaction Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Transfer Form */}
        <form onSubmit={handleSend} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4 shadow-xl">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Send className="w-4 h-4 text-amber-400" />
            Transferência de JT (P2P Seguro)
          </h2>

          {msg && (
            <div className="p-3 bg-purple-950/80 border border-purple-800 rounded-xl text-xs text-purple-200">
              {msg}
            </div>
          )}

          <div>
            <label className="block text-xs text-zinc-400 mb-1">ID do Usuário Destinatário</label>
            <input
              type="text"
              placeholder="Ex: usr_default"
              value={toUserId}
              onChange={(e) => setToUserId(e.target.value)}
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Valor em JT</label>
            <input
              type="number"
              min="1"
              max={user.jtBalance}
              placeholder="Quantidade de tokens"
              value={amountJT}
              onChange={(e) => setAmountJT(e.target.value)}
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Motivo / Descrição</label>
            <input
              type="text"
              placeholder="Ex: Aposta em torneio amador"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold py-3 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>{loading ? 'Processando na Blockchain...' : 'Enviar Transferência JT'}</span>
          </button>
        </form>

        {/* Right 2 Cols: Immutable Transaction Ledger */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4 shadow-xl">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-purple-400" />
            Histórico de Transações & Auditoria
          </h2>

          <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
            {transactions.map((tx) => (
              <div key={tx.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-xs flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-zinc-200">{tx.reason}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Hash: {tx.txHash} • {new Date(tx.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className={`font-mono font-extrabold text-sm ${tx.amountJT > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tx.amountJT > 0 ? '+' : ''}{tx.amountJT} JT
                  </span>
                  <span className="block text-[10px] text-zinc-400 font-mono">
                    Saldo Final: {tx.newBalanceJT} JT
                  </span>
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <p className="text-xs text-zinc-500 italic p-4 text-center">Nenhuma transação registrada.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
