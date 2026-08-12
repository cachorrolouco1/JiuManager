import React, { useState, useEffect } from 'react';
import { Athlete, Academy, TrainingFocus } from '../../types';
import { BeltBadge } from '../BeltBadge';
import { User, Dumbbell, Zap, Award, Edit3, Save, Shield } from 'lucide-react';

interface AthleteProfileViewProps {
  athlete: Athlete | null;
  academies: Academy[];
  onUpdateProfile: (data: any) => Promise<void>;
  onSetTrainingFocus?: (focus: TrainingFocus) => Promise<void>;
  user?: any;
}

export const AthleteProfileView: React.FC<AthleteProfileViewProps> = ({
  athlete,
  academies,
  onUpdateProfile,
  onSetTrainingFocus,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(athlete?.name || '');
  const [nickname, setNickname] = useState(athlete?.nickname || '');
  const [style, setStyle] = useState(athlete?.style || 'Equilibrado');
  const [weightCategory, setWeightCategory] = useState(athlete?.category || 'Médio');
  const [academyId, setAcademyId] = useState(athlete?.academyId || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (athlete) {
      setName(athlete.name);
      setNickname(athlete.nickname);
      setStyle(athlete.style);
      setWeightCategory(athlete.category);
      setAcademyId(athlete.academyId);
    }
  }, [athlete]);

  if (!athlete) return <div className="p-8 text-zinc-400">Carregando dados...</div>;

  const trainingOptions: { id: TrainingFocus; label: string; desc: string }[] = [
    { id: 'guarda', label: 'Guarda', desc: 'Aumenta atributo de Guarda e Raspagem' },
    { id: 'passagem', label: 'Passagem de Guarda', desc: 'Aumenta técnica de Passagem e Pressão' },
    { id: 'finalizacao', label: 'Finalização', desc: 'Melhora precisão nos golpes de submissão' },
    { id: 'quedas', label: 'Quedas & Takedowns', desc: 'Especialização em Baianas e Ippon Seoi' },
    { id: 'defesa', label: 'Defesa & Saídas', desc: 'Melhora escapadas de posições críticas' },
    { id: 'cardio', label: 'Cardio & Resistência', desc: 'Reduz perda de energia nas lutas' },
    { id: 'forca', label: 'Força & Explosão', desc: 'Aumenta potência nas arrancadas e pegadas' },
    { id: 'estrategia', label: 'Estratégia & Mental', desc: 'Melhora tomada de decisão em lutas duras' },
    { id: 'descanso', label: 'Descanso Ativo', desc: 'Restaura 100% da Energia e reduz Fadiga' },
  ];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onUpdateProfile({ name, nickname, style, weightCategory, academyId });
    setLoading(false);
    setIsEditing(false);
  };

  const handleSelectTraining = async (focus: TrainingFocus) => {
    setLoading(true);
    if (onSetTrainingFocus) {
      await onSetTrainingFocus(focus);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header Profile Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-5">
          <img
            src={athlete.avatar}
            alt={athlete.name}
            className="w-20 h-20 rounded-2xl object-cover ring-4 ring-purple-500/30"
          />
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-black text-white">{athlete.name}</h1>
              <BeltBadge belt={athlete.belt} degrees={athlete.degrees} size="md" />
            </div>
            <p className="text-xs text-purple-300">
              "{athlete.nickname}" • Estilo <strong className="text-white">{athlete.style}</strong>
            </p>
            <span className="text-xs text-zinc-400">
              {athlete.academyName} • {athlete.category} ({athlete.weightKg} kg)
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold px-4 py-2.5 rounded-xl border border-zinc-700 transition"
        >
          <Edit3 className="w-4 h-4 text-purple-400" />
          <span>{isEditing ? 'Cancelar Edição' : 'Editar Dados'}</span>
        </button>
      </div>

      {/* Edit Profile Form */}
      {isEditing && (
        <form onSubmit={handleSaveProfile} className="bg-zinc-900 border border-purple-900/50 rounded-2xl p-6 flex flex-col gap-4 animate-fade-in">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-purple-400" />
            Editar Dados do Atleta
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-zinc-400 mb-1">Nome Completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Apelido de Tatame</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Estilo de Luta</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="Passador">Passador</option>
                <option value="Guardião">Guardião</option>
                <option value="Finalizador">Finalizador</option>
                <option value="Wrestler">Wrestler</option>
                <option value="Pressionador">Pressionador</option>
                <option value="Equilibrado">Equilibrado</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Categoria de Peso</label>
              <select
                value={weightCategory}
                onChange={(e) => setWeightCategory(e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="Galo">Galo (Até 57.5 kg)</option>
                <option value="Pluma">Pluma (Até 64 kg)</option>
                <option value="Pena">Pena (Até 70 kg)</option>
                <option value="Leve">Leve (Até 76 kg)</option>
                <option value="Médio">Médio (Até 82.3 kg)</option>
                <option value="Meio-Pesado">Meio-Pesado (Até 88.3 kg)</option>
                <option value="Pesado">Pesado (Até 94.3 kg)</option>
                <option value="Super-Pesado">Super-Pesado (Até 100.5 kg)</option>
                <option value="Pesadíssimo">Pesadíssimo</option>
                <option value="Absoluto">Absoluto</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Academia</label>
              <select
                value={academyId}
                onChange={(e) => setAcademyId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              >
                {academies.map((acad) => (
                  <option key={acad.id} value={acad.id}>
                    {acad.name} ({acad.city})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-2 rounded-lg text-xs transition"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>
      )}

      {/* 2 Column Layout: 15 Attributes Grid & Training Focus Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 15 Attributes */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              15 Atributos Técnicos e Físicos
            </h2>
            <span className="text-xs font-mono text-purple-400">Total Nível {athlete.level}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(athlete.attributes).map(([attr, value]) => {
              const label = attr.charAt(0).toUpperCase() + attr.slice(1);
              return (
                <div key={attr} className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-zinc-300">{label}</span>
                    <span className="font-mono text-purple-300 font-bold">{value} / 100</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-300"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Training Center */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-purple-400" />
              Centro de Treinamento
            </h2>
            <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              {athlete.energy}% Energia
            </span>
          </div>

          <p className="text-xs text-zinc-400">
            Escolha o foco do seu treino para evoluir atributos. Treinar consome energia e gera fadiga acumulada.
          </p>

          <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1">
            {trainingOptions.map((opt) => {
              const isSelected = athlete.currentTrainingFocus === opt.id;
              return (
                <button
                  key={opt.id}
                  disabled={loading}
                  onClick={() => handleSelectTraining(opt.id)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col gap-0.5 ${
                    isSelected
                      ? 'bg-purple-950/80 border-purple-500 text-white shadow-md shadow-purple-950/50'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{opt.label}</span>
                    {isSelected && (
                      <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded font-mono uppercase">
                        FOCO ATUAL
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-400">{opt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
