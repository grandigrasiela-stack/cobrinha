import React, { useEffect, useRef } from 'react';
import { Play, RotateCcw, Trophy, User } from 'lucide-react';
import { CREATOR_NAME, GRID_SIZE } from '../config/gameConfig';
import { Direction, GameStatus, LevelConfig, Point } from '../types/game';

interface SnakeCanvasProps {
  snake: Point[];
  food: Point;
  obstacles: Point[];
  direction: Direction;
  status: GameStatus;
  score: number;
  bestScore: number;
  isNewRecord: boolean;
  currentLevel: LevelConfig;
  levelUpBanner: LevelConfig | null;
  playerName: string;
  nameError: string;
  onPlayerNameChange: (name: string) => void;
  onStartGame: () => void;
  onResumeGame: () => void;
  onRestartGame: () => void;
  onBackToMenu: () => void;
  onDirectionChange: (dir: Direction) => void;
}

/**
 * Componente responsável pela renderização do tabuleiro em Canvas HTML5 de alta nitidez,
 * detecção de gestos de deslize (swipe) em telas de toque e telas de início/pausa/fim.
 */
export const SnakeCanvas: React.FC<SnakeCanvasProps> = ({
  snake,
  food,
  obstacles,
  direction,
  status,
  score,
  bestScore,
  isNewRecord,
  currentLevel,
  levelUpBanner,
  playerName,
  nameError,
  onPlayerNameChange,
  onStartGame,
  onResumeGame,
  onRestartGame,
  onBackToMenu,
  onDirectionChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Desenha o estado atual do tabuleiro no Canvas sempre que há atualização
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ajuste para telas Retina / HiDPI mantendo coordenadas lógicas consistentes
    const logicalSize = 520;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== logicalSize * dpr || canvas.height !== logicalSize * dpr) {
      canvas.width = logicalSize * dpr;
      canvas.height = logicalSize * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    const cellSize = logicalSize / GRID_SIZE;

    // 1. Fundo principal da arena
    ctx.fillStyle = '#0B1221';
    ctx.fillRect(0, 0, logicalSize, logicalSize);

    // 2. Grade sutil para leitura espacial precisa
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.065)';
    ctx.lineWidth = 1;
    for (let i = 1; i < GRID_SIZE; i++) {
      const pos = Math.round(i * cellSize) + 0.5;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, logicalSize);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(logicalSize, pos);
      ctx.stroke();
    }

    // 3. Obstáculos do nível atual com relevo discreto
    obstacles.forEach((obs) => {
      const x = obs.x * cellSize + 2;
      const y = obs.y * cellSize + 2;
      const size = cellSize - 4;

      ctx.fillStyle = '#334155';
      drawRoundedRect(ctx, x, y, size, size, 5);
      ctx.fill();

      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, x + 0.5, y + 0.5, size - 1, size - 1, 5);
      ctx.stroke();

      // Detalhe interno sutil para diferenciar claramente obstáculo de comida
      ctx.fillStyle = '#475569';
      drawRoundedRect(ctx, x + 4, y + 4, size - 8, size - 8, 2);
      ctx.fill();
    });

    // 4. Alimento (maçã coral de alto contraste)
    {
      const cx = food.x * cellSize + cellSize / 2;
      const cy = food.y * cellSize + cellSize / 2;
      const radius = cellSize * 0.34;

      // Halo discreto ao redor do alvo
      ctx.fillStyle = 'rgba(244, 63, 94, 0.16)';
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Corpo do alimento
      ctx.fillStyle = '#F43F5E';
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Brilho e pequena folha para identificação imediata
      ctx.fillStyle = '#FDA4AF';
      ctx.beginPath();
      ctx.arc(cx - radius * 0.3, cy - radius * 0.3, radius * 0.25, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#34D399';
      ctx.beginPath();
      ctx.ellipse(cx + 2, cy - radius - 1, 3.5, 2, -0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Segmentos da cobra (da cauda para a cabeça)
    for (let i = snake.length - 1; i >= 0; i--) {
      const segment = snake[i];
      const isHead = i === 0;
      const pad = isHead ? 1.5 : 2.5;
      const x = segment.x * cellSize + pad;
      const y = segment.y * cellSize + pad;
      const size = cellSize - pad * 2;

      // Degradê suave de esmeralda da cabeça até a cauda
      if (isHead) {
        ctx.fillStyle = '#34D399';
      } else {
        const ratio = i / Math.max(snake.length - 1, 1);
        ctx.fillStyle = ratio < 0.5 ? '#10B981' : '#059669';
      }

      drawRoundedRect(ctx, x, y, size, size, isHead ? 7 : 5);
      ctx.fill();

      // Olhos direcionais na cabeça para indicar claramente o sentido do movimento
      if (isHead) {
        ctx.fillStyle = '#06281E';
        const eyeRadius = 2.2;
        let eye1 = { x: x + size * 0.7, y: y + size * 0.3 };
        let eye2 = { x: x + size * 0.7, y: y + size * 0.7 };

        if (direction === 'LEFT') {
          eye1 = { x: x + size * 0.3, y: y + size * 0.3 };
          eye2 = { x: x + size * 0.3, y: y + size * 0.7 };
        } else if (direction === 'UP') {
          eye1 = { x: x + size * 0.3, y: y + size * 0.3 };
          eye2 = { x: x + size * 0.7, y: y + size * 0.3 };
        } else if (direction === 'DOWN') {
          eye1 = { x: x + size * 0.3, y: y + size * 0.7 };
          eye2 = { x: x + size * 0.7, y: y + size * 0.7 };
        }

        ctx.beginPath();
        ctx.arc(eye1.x, eye1.y, eyeRadius, 0, Math.PI * 2);
        ctx.arc(eye2.x, eye2.y, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }, [snake, food, obstacles, direction]);

  // Manipuladores de gesto de deslize (swipe) para dispositivos touch
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (status !== 'PLAYING' || e.touches.length === 0) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (status !== 'PLAYING' || !touchStartRef.current || e.changedTouches.length === 0) {
      return;
    }

    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    // Limiar mínimo em pixels para evitar toques acidentais
    const threshold = 24;
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      onDirectionChange(dx > 0 ? 'RIGHT' : 'LEFT');
    } else {
      onDirectionChange(dy > 0 ? 'DOWN' : 'UP');
    }
  };

  const handleSubmitName = (e: React.FormEvent) => {
    e.preventDefault();
    onStartGame();
  };

  return (
    <div
      className={`relative w-full aspect-square max-w-[560px] mx-auto rounded-xl overflow-hidden border transition-colors duration-200 touch-none select-none bg-[#0B1221] ${
        levelUpBanner
          ? 'border-amber-400/70 shadow-[0_0_0_1px_rgba(251,191,36,0.25)]'
          : 'border-slate-800'
      }`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Elemento Canvas onde a partida é desenhada */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        aria-label="Tabuleiro do jogo Serpentis"
      />

      {/* Aviso não bloqueante exibido ao avançar de nível */}
      {levelUpBanner && status === 'PLAYING' && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-slate-900/95 border border-amber-400/50 text-amber-300 text-xs sm:text-sm font-medium shadow-lg whitespace-nowrap"
        >
          Nível {levelUpBanner.level} desbloqueado: {levelUpBanner.name}
        </div>
      )}

      {/* Tela Inicial: inserção obrigatória do nome do jogador antes de iniciar */}
      {status === 'TITLE_MENU' && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-5 sm:p-8">
          <form
            onSubmit={handleSubmitName}
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5 shadow-xl"
          >
            <div className="space-y-1.5">
              <h2 className="font-display text-2xl font-semibold text-white tracking-tight">
                Pronto para jogar
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Informe seu nome para registrar suas pontuações no ranking local e avançar pelos 6 níveis.
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="player-name-input"
                className="flex items-center gap-2 text-sm font-medium text-slate-200"
              >
                <User className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <span>Nome do jogador</span>
              </label>
              <input
                id="player-name-input"
                type="text"
                maxLength={24}
                value={playerName}
                onChange={(e) => onPlayerNameChange(e.target.value)}
                placeholder="Ex.: Ana Silva"
                autoComplete="nickname"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              {nameError && (
                <p role="alert" className="text-xs text-rose-400 font-medium">
                  {nameError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-current" aria-hidden="true" />
              <span>Iniciar Partida</span>
            </button>

            <p className="text-xs text-slate-500 text-center">
              Criado por <span className="text-slate-300 font-medium">{CREATOR_NAME}</span>
            </p>
          </form>
        </div>
      )}

      {/* Tela de Pausa */}
      {status === 'PAUSED' && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-xl p-6 text-center space-y-5 shadow-xl">
            <div className="space-y-1">
              <h2 className="font-display text-2xl font-semibold text-white">
                Jogo Pausado
              </h2>
              <p className="text-sm text-slate-400">
                Nível {currentLevel.level} · {score} pontos
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onResumeGame}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap"
              >
                <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                <span>Continuar</span>
              </button>
              <button
                type="button"
                onClick={onRestartGame}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium text-sm transition-colors cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>Reiniciar Partida</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tela de Fim de Jogo com resumo e registro no ranking */}
      {status === 'GAME_OVER' && (
        <div className="absolute inset-0 bg-slate-950/88 backdrop-blur-sm flex items-center justify-center p-5 sm:p-8">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5 shadow-xl">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-2xl font-semibold text-white">
                  Fim de Jogo
                </h2>
                {isNewRecord && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300">
                    <Trophy className="w-4 h-4" aria-hidden="true" />
                    <span>Novo Recorde</span>
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400">
                Pontuação salva no ranking para <span className="text-slate-200 font-medium">{playerName}</span>.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 py-3.5 border-y border-slate-800 text-center">
              <div>
                <div className="text-xs text-slate-400">Pontuação</div>
                <div className="font-mono-tabular text-xl font-semibold text-emerald-400 mt-0.5">
                  {score}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Nível</div>
                <div className="font-mono-tabular text-xl font-semibold text-slate-100 mt-0.5">
                  {currentLevel.level}/6
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Recorde</div>
                <div className="font-mono-tabular text-xl font-semibold text-amber-300 mt-0.5">
                  {bestScore}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={onRestartGame}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>Jogar Novamente</span>
              </button>
              <button
                type="button"
                onClick={onBackToMenu}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Trocar Jogador</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Desenha um retângulo com cantos arredondados no contexto 2D do Canvas.
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}
