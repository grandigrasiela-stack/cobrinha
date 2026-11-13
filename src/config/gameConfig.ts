import { Direction, LevelConfig, Point } from '../types/game';

/**
 * Nome do criador exibido no rodapé e na tela inicial.
 * IMPORTANTE: Substitua "[Seu Nome]" pelo seu nome real antes de publicar.
 */
export const CREATOR_NAME = '[Seu Nome]';

// Dimensões da grade do tabuleiro (20x20 células)
export const GRID_SIZE = 20;

// Posição e direção iniciais da cobra no início da partida
export const INITIAL_SNAKE: Point[] = [
  { x: 6, y: 10 },
  { x: 5, y: 10 },
  { x: 4, y: 10 },
];

export const INITIAL_DIRECTION: Direction = 'RIGHT';

// Chaves usadas no localStorage para persistência local sem servidor
export const STORAGE_KEYS = {
  RANKING: 'serpentis_ranking_v1',
  PLAYER_NAME: 'serpentis_player_name_v1',
  MUTED: 'serpentis_muted_v1',
} as const;

/**
 * Definição dos 6 níveis progressivos do jogo.
 * A dificuldade aumenta por meio de:
 * 1. Redução do tempo de atualização (maior velocidade da cobra)
 * 2. Introdução gradual de obstáculos estratégicos no tabuleiro
 * 3. Metas maiores de pontuação para alcançar o nível seguinte
 */
export const LEVELS: LevelConfig[] = [
  {
    level: 1,
    name: 'Campo Aberto',
    description: 'Velocidade confortável e arena livre para aquecer os reflexos.',
    minScore: 0,
    nextTargetScore: 50,
    tickMs: 155,
    pointsPerFood: 10,
    obstacles: [],
  },
  {
    level: 2,
    name: 'Pilares Centrais',
    description: 'Ritmo acelerado com quatro blocos de pedra próximos ao centro.',
    minScore: 50,
    nextTargetScore: 120,
    tickMs: 132,
    pointsPerFood: 15,
    obstacles: [
      { x: 5, y: 5 },
      { x: 14, y: 5 },
      { x: 5, y: 14 },
      { x: 14, y: 14 },
    ],
  },
  {
    level: 3,
    name: 'Corredor Estreito',
    description: 'Velocidade intermediária com barreiras paralelas que exigem curvas precisas.',
    minScore: 120,
    nextTargetScore: 220,
    tickMs: 112,
    pointsPerFood: 20,
    obstacles: [
      { x: 5, y: 5 },
      { x: 14, y: 5 },
      { x: 5, y: 14 },
      { x: 14, y: 14 },
      { x: 9, y: 4 },
      { x: 10, y: 4 },
      { x: 9, y: 15 },
      { x: 10, y: 15 },
    ],
  },
  {
    level: 4,
    name: 'Cruz Tática',
    description: 'Deslocamento rápido e passagens estreitas dividindo os quadrantes.',
    minScore: 220,
    nextTargetScore: 350,
    tickMs: 95,
    pointsPerFood: 25,
    obstacles: [
      { x: 5, y: 5 },
      { x: 14, y: 5 },
      { x: 5, y: 14 },
      { x: 14, y: 14 },
      { x: 9, y: 4 },
      { x: 10, y: 4 },
      { x: 9, y: 15 },
      { x: 10, y: 15 },
      { x: 3, y: 9 },
      { x: 3, y: 10 },
      { x: 16, y: 9 },
      { x: 16, y: 10 },
    ],
  },
  {
    level: 5,
    name: 'Labirinto Ágil',
    description: 'Alta velocidade com barreiras adicionais nas diagonais e laterais.',
    minScore: 350,
    nextTargetScore: 520,
    tickMs: 80,
    pointsPerFood: 30,
    obstacles: [
      { x: 5, y: 5 },
      { x: 14, y: 5 },
      { x: 5, y: 14 },
      { x: 14, y: 14 },
      { x: 9, y: 4 },
      { x: 10, y: 4 },
      { x: 9, y: 15 },
      { x: 10, y: 15 },
      { x: 3, y: 9 },
      { x: 3, y: 10 },
      { x: 16, y: 9 },
      { x: 16, y: 10 },
      { x: 8, y: 8 },
      { x: 11, y: 8 },
      { x: 8, y: 11 },
      { x: 11, y: 11 },
    ],
  },
  {
    level: 6,
    name: 'Mestre da Arena',
    description: 'Desafio máximo: reflexos extremos e arena densamente ocupada.',
    minScore: 520,
    nextTargetScore: null,
    tickMs: 68,
    pointsPerFood: 40,
    obstacles: [
      { x: 5, y: 5 },
      { x: 14, y: 5 },
      { x: 5, y: 14 },
      { x: 14, y: 14 },
      { x: 9, y: 4 },
      { x: 10, y: 4 },
      { x: 9, y: 15 },
      { x: 10, y: 15 },
      { x: 3, y: 9 },
      { x: 3, y: 10 },
      { x: 16, y: 9 },
      { x: 16, y: 10 },
      { x: 8, y: 8 },
      { x: 11, y: 8 },
      { x: 8, y: 11 },
      { x: 11, y: 11 },
      { x: 2, y: 2 },
      { x: 17, y: 2 },
      { x: 2, y: 17 },
      { x: 17, y: 17 },
    ],
  },
];

/**
 * Retorna a configuração correspondente a uma pontuação atual.
 */
export function getLevelForScore(score: number): LevelConfig {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (score >= lvl.minScore) {
      current = lvl;
    }
  }
  return current;
}
