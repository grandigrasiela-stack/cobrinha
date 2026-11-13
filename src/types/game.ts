/**
 * Definição dos tipos principais do jogo Serpentis.
 */

// Estados possíveis da máquina de estados do jogo
export type GameStatus = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

// Direções válidas de movimento na grade
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

// Coordenada cartesiana (x = coluna, y = linha) na grade do tabuleiro
export interface Point {
  x: number;
  y: number;
}

// Configuração de cada nível do jogo
export interface LevelConfig {
  level: number;
  name: string;
  description: string;
  /** Pontuação mínima necessária para alcançar este nível */
  minScore: number;
  /** Pontuação necessária para avançar ao próximo nível (null no nível máximo) */
  nextTargetScore: number | null;
  /** Intervalo em milissegundos entre cada passo da cobra (menor = mais rápido) */
  tickMs: number;
  /** Pontos ganhos por cada alimento coletado neste nível */
  pointsPerFood: number;
  /** Lista de obstáculos fixos adicionados ao tabuleiro neste nível */
  obstacles: Point[];
}

// Registro individual salvo no ranking (localStorage)
export interface RankingEntry {
  id: string;
  playerName: string;
  score: number;
  level: number;
  createdAt: string;
}
