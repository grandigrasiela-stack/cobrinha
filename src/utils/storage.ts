import { STORAGE_KEYS } from '../config/gameConfig';
import { RankingEntry } from '../types/game';

const MAX_RANKING_ENTRIES = 15;

/**
 * Carrega o ranking salvo no localStorage ordenado da maior para a menor pontuação.
 */
export function loadRanking(): RankingEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.RANKING);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item): item is RankingEntry =>
          typeof item === 'object' &&
          item !== null &&
          typeof item.id === 'string' &&
          typeof item.playerName === 'string' &&
          typeof item.score === 'number' &&
          typeof item.level === 'number' &&
          typeof item.createdAt === 'string'
      )
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.level !== a.level) return b.level - a.level;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  } catch {
    return [];
  }
}

/**
 * Salva uma nova pontuação no ranking e mantém a lista ordenada no localStorage.
 */
export function saveScoreToRanking(
  playerName: string,
  score: number,
  level: number
): { entries: RankingEntry[]; savedEntry: RankingEntry } {
  const cleanName = playerName.trim().slice(0, 24) || 'Jogador';
  const newEntry: RankingEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    playerName: cleanName,
    score,
    level,
    createdAt: new Date().toISOString(),
  };

  const existing = loadRanking();
  const updated = [...existing, newEntry]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.level !== a.level) return b.level - a.level;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, MAX_RANKING_ENTRIES);

  try {
    window.localStorage.setItem(STORAGE_KEYS.RANKING, JSON.stringify(updated));
  } catch {
    // Ignora falhas de cota em navegação privada restrita
  }

  return { entries: updated, savedEntry: newEntry };
}

/**
 * Limpa todo o histórico de pontuações salvo no localStorage.
 */
export function clearRankingStorage(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEYS.RANKING);
  } catch {
    // Ignora erros de armazenamento
  }
}

/**
 * Carrega o último nome de jogador utilizado.
 */
export function loadSavedPlayerName(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEYS.PLAYER_NAME) ?? '';
  } catch {
    return '';
  }
}

/**
 * Persiste o nome do jogador para facilitar partidas futuras.
 */
export function savePlayerName(name: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, name);
  } catch {
    // Ignora erros de armazenamento
  }
}

/**
 * Carrega a preferência de áudio silenciado.
 */
export function loadMutedPreference(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEYS.MUTED) === 'true';
  } catch {
    return false;
  }
}

/**
 * Salva a preferência de áudio silenciado.
 */
export function saveMutedPreference(muted: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEYS.MUTED, String(muted));
  } catch {
    // Ignora erros de armazenamento
  }
}
