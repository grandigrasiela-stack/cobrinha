import React from 'react';
import { LEVELS } from '../config/gameConfig';
import { LevelConfig } from '../types/game';

interface LevelsPanelProps {
  currentLevel: LevelConfig;
  score: number;
}

/**
 * Painel que exibe todos os 6 níveis do jogo, suas metas de pontuação,
 * velocidade relativa e quantidade de obstáculos.
 */
export const LevelsPanel: React.FC<LevelsPanelProps> = ({ currentLevel, score }) => {
  const baseTick = LEVELS[0].tickMs;

  return (
    <section
      id="niveis"
      className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display text-lg font-semibold text-white">
          Níveis de Dificuldade
        </h2>
        <span className="font-mono-tabular text-xs text-slate-400 whitespace-nowrap">
          Atual: {currentLevel.level} de {LEVELS.length}
        </span>
      </div>

      <div className="divide-y divide-slate-800/80">
        {LEVELS.map((lvl) => {
          const isCurrent = lvl.level === currentLevel.level;
          const isUnlocked = score >= lvl.minScore;
          const speedMultiplier = (baseTick / lvl.tickMs).toFixed(1);

          return (
            <div
              key={lvl.level}
              className={`py-3 first:pt-1 last:pb-1 flex items-start justify-between gap-3 transition-colors ${
                isCurrent ? 'text-white' : isUnlocked ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="font-mono-tabular text-xs text-slate-400">
                    0{lvl.level}.
                  </span>
                  <span className="truncate">{lvl.name}</span>
                  {isCurrent && (
                    <span className="text-xs font-semibold text-emerald-400 whitespace-nowrap">
                      · Em curso
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {lvl.obstacles.length} obstáculos · {speedMultiplier}x velocidade · +{lvl.pointsPerFood} pts/maçã
                </p>
              </div>

              <div className="font-mono-tabular text-xs font-medium shrink-0 pt-0.5 text-right">
                {lvl.minScore === 0 ? 'Início' : `${lvl.minScore} pts`}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
