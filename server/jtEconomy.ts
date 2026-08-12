/**
 * JiuManager - Secure JT Economy Server Engine
 * Master Specification Sections 18, 19, 20, 28, 53
 */

import { getDB, saveDatabase } from './db';
import { JTTransaction, UserAccount } from '../src/types';

export function getJTBalance(userId: string): number {
  const db = getDB();
  const user = db.users.find((u) => u.id === userId);
  return user ? user.jtBalance : 0;
}

export function transferJT(
  fromUserId: string,
  toUserId: string,
  amountJT: number,
  reason: string
): { success: boolean; message: string; transaction?: JTTransaction } {
  if (amountJT <= 0) {
    return { success: false, message: 'O valor da transferência de JT deve ser maior que zero.' };
  }

  const db = getDB();
  const sender = db.users.find((u) => u.id === fromUserId);
  const recipient = db.users.find((u) => u.id === toUserId);

  if (!sender) return { success: false, message: 'Usuário remetente não encontrado.' };
  if (!recipient) return { success: false, message: 'Usuário destinatário não encontrado.' };

  // Rule 19: Bots CANNOT hold or transfer JT!
  const recipientAthlete = db.athletes.find((a) => a.userId === recipient.id);
  if (recipientAthlete?.isBot) {
    return { success: false, message: 'REGRA ABSOLUTA: Entidades IA/Bots não podem possuir ou receber JT.' };
  }

  if (sender.jtBalance < amountJT) {
    return { success: false, message: 'Saldo de JT insuficiente para esta transação.' };
  }

  const prevSenderBalance = sender.jtBalance;
  const prevRecipientBalance = recipient.jtBalance;

  sender.jtBalance -= amountJT;
  recipient.jtBalance += amountJT;

  const tx: JTTransaction = {
    id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    userId: sender.id,
    type: 'p2p_transfer',
    amountJT,
    previousBalanceJT: prevSenderBalance,
    newBalanceJT: sender.jtBalance,
    reason: `Transferência para ${recipient.username}: ${reason}`,
    timestamp: Date.now(),
    txHash: '0x' + Math.random().toString(16).substring(2, 14) + Math.random().toString(16).substring(2, 14),
  };

  db.jtTransactions.unshift(tx);
  saveDatabase();

  return { success: true, message: 'Transferência de JT realizada com sucesso!', transaction: tx };
}

export function adminModifyJT(
  adminId: string,
  targetUserId: string,
  amountJT: number, // positive or negative
  reason: string,
  ipSession: string = '127.0.0.1'
): { success: boolean; message: string; transaction?: JTTransaction } {
  const db = getDB();
  const admin = db.users.find((u) => u.id === adminId);
  const targetUser = db.users.find((u) => u.id === targetUserId);

  if (!admin || (admin.role !== 'SUPER_ADMIN' && admin.role !== 'ADMIN')) {
    return { success: false, message: 'Acesso negado. Apenas administradores autorizados podem ajustar JT.' };
  }

  if (!targetUser) {
    return { success: false, message: 'Usuário alvo não encontrado.' };
  }

  const prevBalance = targetUser.jtBalance;
  const newBalance = Math.max(0, prevBalance + amountJT);
  targetUser.jtBalance = newBalance;

  const tx: JTTransaction = {
    id: 'tx_admin_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    userId: targetUser.id,
    adminId: admin.id,
    type: 'admin_adjustment',
    amountJT,
    previousBalanceJT: prevBalance,
    newBalanceJT: newBalance,
    reason: `Ajuste Administrativo por ${admin.username}: ${reason}`,
    timestamp: Date.now(),
    txHash: '0x_admin_' + Math.random().toString(16).substring(2, 14),
  };

  db.jtTransactions.unshift(tx);

  // Audit log entry
  db.adminAuditLogs.unshift({
    id: 'audit_' + Date.now(),
    adminId: admin.id,
    adminRole: admin.role,
    action: 'AJUSTE_MANUAL_JT',
    targetId: targetUser.id,
    previousValue: `${prevBalance} JT`,
    newValue: `${newBalance} JT`,
    reason,
    timestamp: Date.now(),
    ipSession,
  });

  saveDatabase();

  return { success: true, message: `Saldo ajustado com sucesso para ${targetUser.username}.`, transaction: tx };
}
