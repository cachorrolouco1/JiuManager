import React from 'react';
import { Academy, Athlete } from '../../types';
import { Building2, Users, Star, MapPin, CheckCircle } from 'lucide-react';

interface AcademiesViewProps {
  academies: Academy[];
  athlete: Athlete | null;
  onUpdateProfile: (data: any) => Promise<void>;
}

export const AcademiesView: React.FC<AcademiesViewProps> = ({ academies, athlete, onUpdateProfile }) => {
  const handleJoinAcademy = async (academyId: string) => {
    await onUpdateProfile({ academyId });
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-950 via-purple-950/80 to-zinc-950 border border-purple-900/50 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-purple-400" />
            Academias & Equipes de BJJ
          </h1>
          <p className="text-xs text-purple-300 mt-1">
            Matricule-se em grandes bandeiras do Jiu-Jitsu virtual.
          </p>
        </div>
      </div>

      {/* Academy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {academies.map((acad) => {
          const isCurrentAcademy = athlete?.academyId === acad.id;

          return (
            <div
              key={acad.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between gap-5 shadow-xl"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300 bg-purple-950/80 px-2.5 py-1 rounded-md border border-purple-800 font-mono">
                    {acad.city}, {acad.country}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-amber-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{acad.reputation} Rep</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-extrabold text-white text-base">{acad.name}</h3>
                  <p className="text-xs text-purple-300 mt-1">
                    Professor: <strong className="text-zinc-200">{acad.professorName}</strong>
                  </p>
                </div>

                <p className="text-xs text-zinc-400 leading-snug">{acad.description}</p>

                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-xs flex justify-between items-center">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-purple-400" />
                    Alunos Matriculados
                  </span>
                  <span className="font-bold text-white font-mono">{acad.studentCount} Atletas</span>
                </div>
              </div>

              {/* Action Button */}
              {isCurrentAcademy ? (
                <div className="w-full bg-purple-950/80 border border-purple-800 text-purple-300 text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  <span>Sua Academia Atual</span>
                </div>
              ) : (
                <button
                  onClick={() => handleJoinAcademy(acad.id)}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold py-3 rounded-xl text-xs transition"
                >
                  Transferir Matrícula
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
