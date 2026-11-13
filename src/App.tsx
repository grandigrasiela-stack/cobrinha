import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { LevelsPanel } from './components/LevelsPanel';
import { RankingPanel } from './components/RankingPanel';
import { SnakeCanvas } from './components/SnakeCanvas';
import { TouchControls } from './components/TouchControls';
import {
  CREATOR_NAME,
  GRID_SIZE,
  INITIAL_DIRECTION,
  INITIAL_SNAKE,
  LEVELS,
  getLevelForScore,
} from './config/gameConfig';
import { Direction, GameStatus, LevelConfig, Point, RankingEntry } from './types/game';
import { soundEngine } from './utils/audio';
import {
  clearRankingStorage,
  loadMutedPreference,
  loadRanking,
  loadSavedPlayerName,
  saveMutedPreference,
  savePlayerName,
  saveScoreToRanking,
} from './utils/storage';

// Verifica se duas direções são opostas para impedir reversão imediata de 180 graus
function isOppositeDirection(a: Direction, b: Direction): boolean {
  return (
    (a === 'UP' && b === 'DOWN') ||
    (a === 'DOWN' && b === 'UP') ||
    (a === 'LEFT' && b === 'RIGHT') ||
    (a === 'RIGHT' && b === 'LEFT')
  );
}

// Verifica se duas coordenadas ocupam a mesma célula
function isSamePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

// Calcula a próxima coordenada da cabeça a partir da direção atual
function getNextHead(head: Point, dir: Direction): Point {
  switch (dir) {
    case 'UP':
      return { x: head.x, y: head.y - 1 };
    case 'DOWN':
      return { x: head.x, y: head.y + 1 };
    case 'LEFT':
      return { x: head.x - 1, y: head.y };
    case 'RIGHT':
      return { x: head.x + 1, y: head.y };
  }
}

// Gera uma posição aleatória livre para o alimento, evitando cobra e obstáculos
function spawnFood(snake: Point[], obstacles: Point[]): Point {
  const freeCells: Point[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const candidate = { x, y };
      const hitsSnake = snake.some((seg) => isSamePoint(seg, candidate));
      const hitsObstacle = obstacles.some((obs) => isSamePoint(obs, candidate));
      if (!hitsSnake && !hitsObstacle) {
        freeCells.push(candidate);
      }
    }
  }

  if (freeCells.length === 0) {
    return { x: 0, y: 0 };
  }

  const randomIndex = Math.floor(Math.random() * freeCells.length);
  return freeCells[randomIndex];
}

// Seleciona apenas obstáculos seguros que não colidem com a cobra nem surgem logo à frente da cabeça
function getSafeObstacles(
  targetObstacles: Point[],
  currentActive: Point[],
  snake: Point[],
  dir: Direction
): Point[] {
  const head = snake[0];
  const ahead1 = getNextHead(head, dir);
  const ahead2 = getNextHead(ahead1, dir);

  return targetObstacles.filter((obs) => {
    // Obstáculos já existentes na arena permanecem fixos
    if (currentActive.some((active) => isSamePoint(active, obs))) {
      return true;
    }
    const onSnake = snake.some((seg) => isSamePoint(seg, obs));
    const inFront = isSamePoint(obs, ahead1) || isSamePoint(obs, ahead2);
    return !onSnake && !inFront;
  });
}

export default function App() {
  // Estados principais da interface e do jogo
  const [status, setStatus] = useState<GameStatus>('TITLE_MENU');
  const [playerName, setPlayerName] = useState<string>(() => loadSavedPlayerName());
  const [nameError, setNameError] = useState<string>('');
  const [muted, setMuted] = useState<boolean>(() => {
    const initialMuted = loadMutedPreference();
    soundEngine.setMuted(initialMuted);
    return initialMuted;
  });

  // Estados da partida atual
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [obstacles, setObstacles] = useState<Point[]>(LEVELS[0].obstacles);
  const [food, setFood] = useState<Point>(() => spawnFood(INITIAL_SNAKE, LEVELS[0].obstacles));
  const [score, setScore] = useState<number>(0);
  const [levelUpBanner, setLevelUpBanner] = useState<LevelConfig | null>(null);

  // Ranking persistido no localStorage
  const [ranking, setRanking] = useState<RankingEntry[]>(() => loadRanking());
  const [latestEntryId, setLatestEntryId] = useState<string | null>(null);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);

  // Referências mutáveis para manter o loop de jogo preciso e com fila de comandos responsiva
  const directionQueueRef = useRef<Direction[]>([]);
  const currentDirectionRef = useRef<Direction>(INITIAL_DIRECTION);
  const levelUpTimerRef = useRef<number | null>(null);

  const currentLevel = useMemo(() => getLevelForScore(score), [score]);
  const bestScore = useMemo(() => {
    const topStored = ranking.length > 0 ? ranking[0].score : 0;
    return Math.max(topStored, score);
  }, [ranking, score]);

  // Calcula progresso percentual até o próximo nível para a barra de meta
  const levelProgressPercent = useMemo(() => {
    if (currentLevel.nextTargetScore === null) return 100;
    const span = currentLevel.nextTargetScore - currentLevel.minScore;
    const done = score - currentLevel.minScore;
    return Math.min(100, Math.max(0, Math.round((done / span) * 100)));
  }, [currentLevel, score]);

  // Limpa temporizador do banner de nível ao desmontar
  useEffect(() => {
    return () => {
      if (levelUpTimerRef.current !== null) {
        window.clearTimeout(levelUpTimerRef.current);
      }
    };
  }, []);

  // Reseta o tabuleiro e inicia uma nova partida
  const beginMatch = useCallback(() => {
    const trimmed = playerName.trim();
    if (!trimmed) {
      setNameError('Digite seu nome antes de iniciar a partida.');
      return;
    }

    setNameError('');
    savePlayerName(trimmed);

    const initialFood = spawnFood(INITIAL_SNAKE, LEVELS[0].obstacles);
    directionQueueRef.current = [];
    currentDirectionRef.current = INITIAL_DIRECTION;

    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setObstacles(LEVELS[0].obstacles);
    setFood(initialFood);
    setScore(0);
    setIsNewRecord(false);
    setLevelUpBanner(null);
    setStatus('PLAYING');
  }, [playerName]);

  // Encerra a partida, toca som e salva pontuação no ranking local
  const finishMatch = useCallback(
    (finalScore: number, reachedLevel: number) => {
      soundEngine.playGameOver();
      const previousBest = ranking.length > 0 ? ranking[0].score : 0;
      const { entries, savedEntry } = saveScoreToRanking(
        playerName,
        finalScore,
        reachedLevel
      );
      setRanking(entries);
      setLatestEntryId(savedEntry.id);
      setIsNewRecord(finalScore > 0 && finalScore > previousBest);
      setStatus('GAME_OVER');
    },
    [playerName, ranking]
  );

  // Enfileira mudanças de direção evitando curvas impossíveis em um mesmo tick
  const enqueueDirection = useCallback((nextDir: Direction) => {
    const queue = directionQueueRef.current;
    const lastPlanned = queue.length > 0 ? queue[queue.length - 1] : currentDirectionRef.current;

    if (nextDir === lastPlanned || isOppositeDirection(nextDir, lastPlanned)) {
      return;
    }

    if (queue.length < 2) {
      queue.push(nextDir);
    }
  }, []);

  // Alterna pausa durante a partida
  const togglePause = useCallback(() => {
    setStatus((prev) => {
      if (prev === 'PLAYING') return 'PAUSED';
      if (prev === 'PAUSED') return 'PLAYING';
      return prev;
    });
  }, []);

  // Alterna áudio silenciado
  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      saveMutedPreference(next);
      return next;
    });
  }, []);

  // Controles de teclado: Setas, WASD e Espaço/P para pausar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';

      if (isTyping) return;

      const key = e.key.toLowerCase();

      if (key === ' ' || key === 'p' || key === 'escape') {
        if (status === 'PLAYING' || status === 'PAUSED') {
          e.preventDefault();
          togglePause();
        }
        return;
      }

      if (status !== 'PLAYING') return;

      let mappedDir: Direction | null = null;
      if (key === 'arrowup' || key === 'w') mappedDir = 'UP';
      else if (key === 'arrowdown' || key === 's') mappedDir = 'DOWN';
      else if (key === 'arrowleft' || key === 'a') mappedDir = 'LEFT';
      else if (key === 'arrowright' || key === 'd') mappedDir = 'RIGHT';

      if (mappedDir) {
        e.preventDefault();
        enqueueDirection(mappedDir);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, enqueueDirection, togglePause]);

  // Loop principal da partida com velocidade dinâmica baseada no nível atual
  useEffect(() => {
    if (status !== 'PLAYING') return;

    const timer = window.setInterval(() => {
      // Consome o próximo comando da fila direcional, se houver
      const nextDir = directionQueueRef.current.shift() ?? currentDirectionRef.current;
      currentDirectionRef.current = nextDir;
      setDirection(nextDir);

      const currentHead = snake[0];
      const nextHead = getNextHead(currentHead, nextDir);

      // 1. Verifica colisão com as bordas da arena
      if (
        nextHead.x < 0 ||
        nextHead.x >= GRID_SIZE ||
        nextHead.y < 0 ||
        nextHead.y >= GRID_SIZE
      ) {
        finishMatch(score, currentLevel.level);
        return;
      }

      // 2. Verifica colisão com obstáculos ativos
      if (obstacles.some((obs) => isSamePoint(obs, nextHead))) {
        finishMatch(score, currentLevel.level);
        return;
      }

      const willEat = isSamePoint(nextHead, food);
      // Se não comer, a cauda avança e libera sua célula antes de checar autocolisão
      const bodyToCheck = willEat ? snake : snake.slice(0, -1);
      if (bodyToCheck.some((seg) => isSamePoint(seg, nextHead))) {
        finishMatch(score, currentLevel.level);
        return;
      }

      // 3. Atualiza corpo da cobra
      const nextSnake = willEat
        ? [nextHead, ...snake]
        : [nextHead, ...snake.slice(0, -1)];

      let nextScore = score;
      let nextLevel = currentLevel;
      let nextObstacles = obstacles;
      let nextFood = food;

      if (willEat) {
        nextScore = score + currentLevel.pointsPerFood;
        nextLevel = getLevelForScore(nextScore);

        if (nextLevel.level > currentLevel.level) {
          // Avançou de nível: toca acorde e exibe aviso não bloqueante
          soundEngine.playLevelUp();
          setLevelUpBanner(nextLevel);
          if (levelUpTimerRef.current !== null) {
            window.clearTimeout(levelUpTimerRef.current);
          }
          levelUpTimerRef.current = window.setTimeout(() => {
            setLevelUpBanner(null);
          }, 2400);
        } else {
          soundEngine.playEat();
        }
      }

      // Sincroniza obstáculos seguros do nível atual (novos blocos nunca surgem em cima da cobra)
      if (nextObstacles.length < nextLevel.obstacles.length) {
        nextObstacles = getSafeObstacles(
          nextLevel.obstacles,
          nextObstacles,
          nextSnake,
          nextDir
        );
      }

      // Se coletou alimento ou se um novo obstáculo ocupou a célula da comida, gera novo alvo
      const foodBlocked = nextObstacles.some((obs) => isSamePoint(obs, nextFood));
      if (willEat || foodBlocked) {
        nextFood = spawnFood(nextSnake, nextObstacles);
      }

      setSnake(nextSnake);
      if (nextScore !== score) setScore(nextScore);
      if (nextObstacles !== obstacles) setObstacles(nextObstacles);
      if (nextFood !== food) setFood(nextFood);
    }, currentLevel.tickMs);

    return () => window.clearInterval(timer);
  }, [status, snake, food, obstacles, score, currentLevel, finishMatch]);

  const handleClearRanking = () => {
    clearRankingStorage();
    setRanking([]);
    setLatestEntryId(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Barra superior limpa em 3 zonas */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-8">
          <a
            href="#arena"
            className="font-display text-xl font-bold tracking-tight text-white whitespace-nowrap shrink-0"
          >
            Serpentis
          </a>

          <nav
            aria-label="Navegação principal"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300"
          >
            <a
              href="#arena"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Arena
            </a>
            <a
              href="#niveis"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Níveis
            </a>
            <a
              href="#ranking"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Ranking
            </a>
            <a
              href="#controles"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Como Jogar
            </a>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (playerName.trim()) {
                  beginMatch();
                } else {
                  setStatus('TITLE_MENU');
                }
              }}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Nova Partida
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo principal em grade equilibrada para desktop e celular */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Coluna Principal: HUD, Tabuleiro e Controles Táteis */}
          <section id="arena" className="lg:col-span-7 space-y-5">
            {/* Cabeçalho compacto da arena + HUD de métricas */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h1 className="font-display text-xl sm:text-2xl font-semibold text-white tracking-tight">
                    Nível {currentLevel.level}: {currentLevel.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400">
                    {currentLevel.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {(status === 'PLAYING' || status === 'PAUSED') && (
                    <button
                      type="button"
                      onClick={togglePause}
                      aria-label={status === 'PAUSED' ? 'Continuar partida' : 'Pausar partida'}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {status === 'PAUSED' ? (
                        <>
                          <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" aria-hidden="true" />
                          <span>Continuar</span>
                        </>
                      ) : (
                        <>
                          <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Pausar</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={toggleMute}
                    aria-label={muted ? 'Ativar efeitos sonoros' : 'Silenciar efeitos sonoros'}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {muted ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                        <span>Mudo</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                        <span>Som</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Faixa de métricas sem caixas aninhadas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-800">
                <div>
                  <div className="text-xs text-slate-400">Jogador</div>
                  <div className="text-sm font-semibold text-slate-100 truncate mt-0.5">
                    {playerName.trim() || 'Não definido'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Pontuação</div>
                  <div className="font-mono-tabular text-lg font-semibold text-emerald-400">
                    {score}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Meta do Nível</div>
                  <div className="font-mono-tabular text-lg font-semibold text-slate-100">
                    {currentLevel.nextTargetScore !== null
                      ? `${currentLevel.nextTargetScore} pts`
                      : 'Máximo'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Recorde</div>
                  <div className="font-mono-tabular text-lg font-semibold text-amber-300">
                    {bestScore}
                  </div>
                </div>
              </div>

              {/* Barra visual de progresso até o próximo nível */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Progresso no nível</span>
                  <span className="font-mono-tabular">{levelProgressPercent}%</span>
                </div>
                <div
                  className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden"
                  role="progressbar"
                  aria-valuenow={levelProgressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Progresso para o próximo nível"
                >
                  <div
                    className="h-full bg-emerald-500 transition-all duration-200"
                    style={{ width: `${levelProgressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Tabuleiro Canvas interativo */}
            <SnakeCanvas
              snake={snake}
              food={food}
              obstacles={obstacles}
              direction={direction}
              status={status}
              score={score}
              bestScore={bestScore}
              isNewRecord={isNewRecord}
              currentLevel={currentLevel}
              levelUpBanner={levelUpBanner}
              playerName={playerName}
              nameError={nameError}
              onPlayerNameChange={(value) => {
                setPlayerName(value);
                if (nameError && value.trim()) setNameError('');
              }}
              onStartGame={beginMatch}
              onResumeGame={() => setStatus('PLAYING')}
              onRestartGame={beginMatch}
              onBackToMenu={() => setStatus('TITLE_MENU')}
              onDirectionChange={enqueueDirection}
            />

            {/* Controles direcionais para telas de toque e cliques */}
            <TouchControls
              status={status}
              onDirectionChange={enqueueDirection}
              onTogglePause={togglePause}
            />
          </section>

          {/* Coluna Lateral: Ranking, Níveis e Instruções */}
          <aside className="lg:col-span-5 space-y-6">
            <RankingPanel
              entries={ranking}
              latestEntryId={latestEntryId}
              onClearRanking={handleClearRanking}
            />

            <LevelsPanel currentLevel={currentLevel} score={score} />

            <section
              id="controles"
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3"
            >
              <h2 className="font-display text-lg font-semibold text-white">
                Como Jogar
              </h2>
              <ul className="space-y-2 text-sm text-slate-300 leading-relaxed">
                <li>
                  <strong className="text-white font-medium">Teclado:</strong> use as{' '}
                  <span className="font-mono-tabular text-emerald-400">Setas</span> ou{' '}
                  <span className="font-mono-tabular text-emerald-400">W A S D</span> para guiar a cobra e{' '}
                  <span className="font-mono-tabular text-emerald-400">Espaço</span> ou{' '}
                  <span className="font-mono-tabular text-emerald-400">P</span> para pausar.
                </li>
                <li>
                  <strong className="text-white font-medium">Celular e Tablet:</strong> deslize o dedo sobre a arena ou toque nos botões direcionais abaixo do tabuleiro.
                </li>
                <li>
                  <strong className="text-white font-medium">Regras:</strong> colete as maçãs para pontuar e avançar pelos 6 níveis. Evite bater nas paredes, nos blocos de pedra e no próprio corpo.
                </li>
              </ul>
            </section>
          </aside>
        </div>
      </main>

      {/* Rodapé com crédito visível do criador */}
      <footer className="border-t border-slate-800/80 py-5 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm text-slate-400">
          <p>
            Criado por <span className="text-slate-200 font-semibold">{CREATOR_NAME}</span>
          </p>
          <p className="text-slate-500">
            Serpentis · Ranking salvo localmente no seu navegador
          </p>
        </div>
      </footer>
    </div>
  );
}
