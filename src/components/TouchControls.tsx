import React from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Pause, Play } from 'lucide-react';
import { Direction, GameStatus } from '../types/game';

interface TouchControlsProps {
  status: GameStatus;
  onDirectionChange: (dir: Direction) => void;
  onTogglePause: () => void;
}

/**
 * Controles direcionais na tela (D-pad) com alvos táteis grandes (>= 48px)
 * para uso confortável em celulares, tablets ou cliques rápidos.
 */
export const TouchControls: React.FC<TouchControlsProps> = ({
  status,
  onDirectionChange,
  onTogglePause,
}) => {
  const disabled = status !== 'PLAYING';

  const btnBase =
    'w-12 h-12 sm:w-14 sm:h-14 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 active:scale-95 active:bg-emerald-500/20 active:border-emerald-500/60 text-slate-100 flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none select-none';

  return (
    <div className="flex flex-col items-center gap-2 pt-2">
      <div className="grid grid-cols-3 gap-2">
        <div />
        <button
          type="button"
          disabled={disabled}
          onClick={() => onDirectionChange('UP')}
          aria-label="Mover para cima"
          className={btnBase}
        >
          <ArrowUp className="w-5 h-5" aria-hidden="true" />
        </button>
        <div />

        <button
          type="button"
          disabled={disabled}
          onClick={() => onDirectionChange('LEFT')}
          aria-label="Mover para a esquerda"
          className={btnBase}
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        </button>

        <button
          type="button"
          disabled={status !== 'PLAYING' && status !== 'PAUSED'}
          onClick={onTogglePause}
          aria-label={status === 'PAUSED' ? 'Continuar partida' : 'Pausar partida'}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-slate-200 flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none select-none"
        >
          {status === 'PAUSED' ? (
            <Play className="w-5 h-5 text-emerald-400 fill-current" aria-hidden="true" />
          ) : (
            <Pause className="w-5 h-5" aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onDirectionChange('RIGHT')}
          aria-label="Mover para a direita"
          className={btnBase}
        >
          <ArrowRight className="w-5 h-5" aria-hidden="true" />
        </button>

        <div />
        <button
          type="button"
          disabled={disabled}
          onClick={() => onDirectionChange('DOWN')}
          aria-label="Mover para baixo"
          className={btnBase}
        >
          <ArrowDown className="w-5 h-5" aria-hidden="true" />
        </button>
        <div />
      </div>

      <p className="text-xs text-slate-400 text-center">
        Use os botões acima, deslize na arena ou pressione Setas / WASD.
      </p>
    </div>
  );
};
