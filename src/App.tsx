import React, { useEffect, useState } from 'react';
import {
  Athlete,
  UserAccount,
  CombatMatch,
  Academy,
  Tournament,
  JTTransaction,
  AdminAuditLog,
  WorldEvent,
} from './types';
import { api } from './lib/api';

// Components
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { OfflineModal } from './components/OfflineModal';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { AthleteProfileView } from './components/athlete/AthleteProfileView';
import { ArenaView } from './components/arena/ArenaView';
import { TournamentsView } from './components/tournaments/TournamentsView';
import { RankingsView } from './components/rankings/RankingsView';
import { AcademiesView } from './components/academies/AcademiesView';
import { JTWalletView } from './components/jt/JTWalletView';
import { AdminGodView } from './components/admin/AdminGodView';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'profile' | 'arena' | 'tournaments' | 'rankings' | 'academies' | 'jt_wallet' | 'admin'
  >('dashboard');

  // Core App State
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [user, setUser] = useState<UserAccount | null>(null);
  const [combats, setCombats] = useState<CombatMatch[]>([]);
  const [rankings, setRankings] = useState<{
    global: Athlete[];
    realOnly: Athlete[];
    botsOnly: Athlete[];
  } | null>(null);
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [jtTransactions, setJtTransactions] = useState<JTTransaction[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [bots, setBots] = useState<Athlete[]>([]);
  const [worldEvents, setWorldEvents] = useState<WorldEvent[]>([]);

  // Network & Service Worker State
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [offlineDigest, setOfflineDigest] = useState<{
    offlineEvents: Array<{ type: string; details: string; timestamp: number }>;
    pendingTasksCompleted: number;
  } | null>(null);

  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);

  // Register PWA Service Worker & Online Listeners
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('Service Worker Registrado no JiuManager:', reg.scope))
        .catch((err) => console.warn('Service Worker erro:', err));
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch all initial data
  const loadAppData = async () => {
    try {
      const [
        athleteData,
        userData,
        combatsData,
        rankingsData,
        academiesData,
        tournamentsData,
        jtTxData,
        digestData,
        worldEventsData,
      ] = await Promise.all([
        api.getAthleteProfile(),
        api.getUserAccount(),
        api.getCombats(),
        api.getRankings(),
        api.getAcademies(),
        api.getTournaments(),
        api.getJTTransactions(),
        api.getOfflineDigest(),
        api.getWorldEvents(),
      ]);

      setAthlete(athleteData);
      setUser(userData);
      setCombats(combatsData);
      setRankings(rankingsData);
      setAcademies(academiesData);
      setTournaments(tournamentsData);
      setJtTransactions(jtTxData);
      if (Array.isArray(worldEventsData)) {
        setWorldEvents(worldEventsData);
      }

      if (digestData && digestData.offlineEvents && digestData.offlineEvents.length > 0) {
        setOfflineDigest(digestData);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do JiuManager:', err);
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    loadAppData();
  }, []);

  // Fetch Admin Data if tab is selected
  useEffect(() => {
    if (activeTab === 'admin') {
      Promise.all([api.getAdminStats(), api.getAuditLogs(), api.getBots()])
        .then(([stats, logs, botsData]) => {
          setAdminStats(stats);
          setAuditLogs(logs);
          setBots(botsData);
        })
        .catch((err) => console.error('Erro ao buscar dados admin:', err));
    }
  }, [activeTab]);

  // Handlers
  const handleTrain = async (trainingType: any) => {
    const updatedAthlete = await api.trainAthlete(trainingType);
    setAthlete(updatedAthlete);
    const updatedUser = await api.getUserAccount();
    setUser(updatedUser);
  };

  const handleProposeChallenge = async (challengedAthleteId: string, isTournament: boolean) => {
    await api.proposeChallenge(challengedAthleteId, isTournament);
    const updatedCombats = await api.getCombats();
    setCombats(updatedCombats);
  };

  const handleAcceptChallenge = async (combatId: string) => {
    await api.acceptChallenge(combatId);
    const updatedCombats = await api.getCombats();
    setCombats(updatedCombats);
  };

  const handleSimulateCombat = async (combatId: string) => {
    const res = await api.simulateCombat(combatId);
    const [updatedCombats, updatedAthlete, updatedUser, updatedRankings] = await Promise.all([
      api.getCombats(),
      api.getAthleteProfile(),
      api.getUserAccount(),
      api.getRankings(),
    ]);
    setCombats(updatedCombats);
    setAthlete(updatedAthlete);
    setUser(updatedUser);
    setRankings(updatedRankings);
    return res;
  };

  const handleRegisterTournament = async (tournamentId: string) => {
    await api.registerTournament(tournamentId);
    const [updatedTournaments, updatedUser] = await Promise.all([
      api.getTournaments(),
      api.getUserAccount(),
    ]);
    setTournaments(updatedTournaments);
    setUser(updatedUser);
  };

  const handleUpdateProfile = async (data: Partial<Athlete>) => {
    const updatedAthlete = await api.updateAthleteProfile(data);
    setAthlete(updatedAthlete);
  };

  const handleTransferJT = async (toUserId: string, amountJT: number, reason: string) => {
    await api.transferJT(toUserId, amountJT, reason);
    const [updatedUser, updatedTx] = await Promise.all([
      api.getUserAccount(),
      api.getJTTransactions(),
    ]);
    setUser(updatedUser);
    setJtTransactions(updatedTx);
  };

  const handleAdminCreateBots = async (
    count: number,
    belt: Athlete['belt'],
    category: Athlete['category'],
    reason: string
  ) => {
    await api.adminCreateBots(count, belt, category, reason);
    const [stats, logs, botsData] = await Promise.all([
      api.getAdminStats(),
      api.getAuditLogs(),
      api.getBots(),
    ]);
    setAdminStats(stats);
    setAuditLogs(logs);
    setBots(botsData);
  };

  const handleAdminSetBotStatus = async (
    botId: string,
    newStatus: Athlete['status'],
    reason: string
  ) => {
    await api.adminSetBotStatus(botId, newStatus, reason);
    const [logs, botsData] = await Promise.all([api.getAuditLogs(), api.getBots()]);
    setAuditLogs(logs);
    setBots(botsData);
  };

  const handleAdminModifyJT = async (targetUserId: string, amountJT: number, reason: string) => {
    await api.adminModifyJT(targetUserId, amountJT, reason);
    const [updatedUser, logs, stats] = await Promise.all([
      api.getUserAccount(),
      api.getAuditLogs(),
      api.getAdminStats(),
    ]);
    setUser(updatedUser);
    setAuditLogs(logs);
    setAdminStats(stats);
  };

  const handleAdminControlSimulation = async (
    command: 'START' | 'STOP' | 'PAUSE' | 'FAST_FORWARD',
    speed?: any,
    fastForwardDays?: number
  ) => {
    await api.adminControlSimulation(command, speed, fastForwardDays);
    const [stats, logs] = await Promise.all([api.getAdminStats(), api.getAuditLogs()]);
    setAdminStats(stats);
    setAuditLogs(logs);
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 gap-4 font-sans">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        <h1 className="text-xl font-black tracking-wider uppercase text-purple-300">
          Iniciando Unidade JiuManager...
        </h1>
        <p className="text-xs text-zinc-500 font-mono">
          Carregando simulador 24/7, economia JT e rede de entidades IA...
        </p>
      </div>
    );
  }

  const handleTabChange = (tab: string) => {
    const map: Record<string, typeof activeTab> = {
      inicio: 'dashboard',
      dashboard: 'dashboard',
      atleta: 'profile',
      profile: 'profile',
      arena: 'arena',
      eventos: 'tournaments',
      tournaments: 'tournaments',
      rankings: 'rankings',
      academias: 'academies',
      academies: 'academies',
      jt: 'jt_wallet',
      jt_wallet: 'jt_wallet',
      admin: 'admin',
    };
    setActiveTab(map[tab] || 'dashboard');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Offline Digest Modal Popup */}
      {offlineDigest && (
        <OfflineModal digest={offlineDigest} onClose={() => setOfflineDigest(null)} />
      )}

      {/* Top Navigation */}
      <Navbar
        user={user}
        athlete={athlete}
        currentTab={activeTab}
        onTabChange={handleTabChange}
        onOpenOfflineModal={() => setOfflineDigest(offlineDigest || {
          absentTimeSeconds: 3600,
          fightsOccurred: 0,
          tournamentsFinished: 0,
          rivalUpdates: [],
          rankChangeMessage: 'Atleta ativo e pronto para o próximo treino',
          trainingProgressMessage: 'Energia 100% restaurada',
          recentEvents: worldEvents || [],
        })}
        isOnline={isOnline}
      />

      {/* Main Container Layout with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Left Sidebar */}
        <Sidebar currentTab={activeTab} onTabChange={handleTabChange} />

        {/* Dynamic View Canvas Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-8 bg-zinc-950">
          {activeTab === 'dashboard' && (
            <DashboardView
              athlete={athlete}
              worldEvents={worldEvents}
              onNavigate={handleTabChange}
            />
          )}

          {activeTab === 'profile' && (
            <AthleteProfileView
              athlete={athlete}
              user={user}
              academies={academies}
              onUpdateProfile={handleUpdateProfile}
              onSetTrainingFocus={handleTrain}
            />
          )}

          {activeTab === 'arena' && (
            <ArenaView
              combats={combats}
              athlete={athlete}
              bots={rankings?.botsOnly || []}
              onProposeChallenge={handleProposeChallenge}
              onAcceptChallenge={handleAcceptChallenge}
              onSimulateMatch={handleSimulateCombat}
              onSimulateCombat={handleSimulateCombat}
            />
          )}

          {activeTab === 'tournaments' && (
            <TournamentsView
              tournaments={tournaments}
              athlete={athlete}
              onRegister={handleRegisterTournament}
            />
          )}

          {activeTab === 'rankings' && <RankingsView rankings={rankings} />}

          {activeTab === 'academies' && (
            <AcademiesView
              academies={academies}
              athlete={athlete}
              onUpdateProfile={handleUpdateProfile}
            />
          )}

          {activeTab === 'jt_wallet' && (
            <JTWalletView
              user={user}
              transactions={jtTransactions}
              onTransferJT={handleTransferJT}
            />
          )}

          {activeTab === 'admin' && (
            <AdminGodView
              adminStats={adminStats}
              user={user}
              bots={bots}
              auditLogs={auditLogs}
              onAdminCreateBots={handleAdminCreateBots}
              onAdminSetBotStatus={handleAdminSetBotStatus}
              onAdminModifyJT={handleAdminModifyJT}
              onAdminControlSimulation={handleAdminControlSimulation}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Bar Navigation */}
      <MobileNav currentTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
