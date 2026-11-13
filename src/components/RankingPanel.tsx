import React, { useState } from 'react';
import { Trash2, Trophy } from 'lucide-react';
import { RankingEntry } from '../types/game';

interface RankingPanelProps {
  entries: RankingEntry[];
  latestEntryId: string | null;
  onClearRanking: () => void;
}

/**
 * Exibe o ranking das melhores pontuações persistidas no localStorage.
 */
export const RankingPanel: React.FC<RankingPanelProps> = ({
  entries,
  latestEntryId,
  onClearRanking,
}) => {
  const [confirmingClear, setConfirmingClear] = useState(false);

  const visibleEntries = entries.slice(0, 10);

  return (
    <section
      id="ranking"
      className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" aria-hidden="true" />
          <h2 className="font-display text-lg font-semibold text-white">
            Ranking Local
          </h2>
        </div>

        {entries.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            {!confirmingClear ? (
              <button
                type="button"
                onClick={() => setConfirmingClear(true)}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Limpar</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    onClearRanking();
                    setConfirmingClear(false);
                  }}
                  className="text-rose-400 hover:text-rose-300 font-semibold cursor-pointer whitespace-nowrap"
                >
                  Confirmar
                </button>
                <span className="text-slate-600" aria-hidden="true">
                  /
                </span>
                <button
                  type="button"
                  onClick={() => setConfirmingClear(false)}
                  className="text-slate-400 hover:text-slate-200 cursor-pointer whitespace-nowrap"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {visibleEntries.length === 0 ? (
        <div className="py-8 text-center space-y-1 border-t border-slate-800/80">
          <p className="text-sm text-slate-300 font-medium">
            Nenhuma partida registrada ainda
          </p>
          <p className="text-xs text-slate-500">
            Conclua sua primeira rodada para aparecer no topo da tabela.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-400 font-medium">
                <th className="py-2 pr-2 font-medium w-8">#</th>
                <th className="py-2 px-2 font-medium">Jogador</th>
                <th className="py-2 px-2 font-medium text-right">Nível</th>
                <th className="py-2 pl-2 font-medium text-right">Pontos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-sm">
              {visibleEntries.map((entry, idx) => {
                const isLatest = entry.id === latestEntryId;
                return (
                  <tr
                    key={entry.id}
                    className={isLatest ? 'bg-emerald-500/10 text-white' : 'text-slate-200'}
                  >
                    <td className="py-2.5 pr-2 font-mono-tabular text-xs text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-2 max-w-[140px]">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="truncate font-medium">{entry.playerName}</span>
                        {isLatest && (
                          <span className="text-xs text-emerald-400 font-medium shrink-0">
                            (você)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono-tabular text-xs text-slate-400">
                      N{entry.level}
                    </td>
                    <td className="py-2.5 pl-2 text-right font-mono-tabular font-semibold text-emerald-400">
                      {entry.score}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
