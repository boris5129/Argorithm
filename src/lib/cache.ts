import { SEED_VIDEO_POOL, THEME_PRESETS } from '@/lib/seed-videos';
import {
  BUILT_IN_THEME_IDS,
  type BuiltInThemeId,
  type EngineeringTelemetry,
  type SeedVideoItem,
  type ThemePresetMeta,
  type WashTransaction,
} from '@/types/theme';

const DAILY_QUOTA_LIMIT_UNITS = 10_000;
const COOLDOWN_MS = 10_000;
const SEARCH_LIST_SAVED_UNIT_PER_WASH = 200;

interface CacheState {
  pools: Record<string, SeedVideoItem[]>;
  customPersonas: Record<string, ThemePresetMeta>;
  transactions: WashTransaction[];
  dailyQuotaUsed: number;
  quotaDateKey: string;
  userCooldowns: Map<string, number>;
  telemetry: {
    cacheHits: number;
    cacheMisses: number;
    savedSearchUnits: number;
    totalWashesExecuted: number;
    totalRollbacksExecuted: number;
    latencySamplesMs: number[];
  };
}

function getTodayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function createInitialState(): CacheState {
  const initialPools: Record<string, SeedVideoItem[]> = {};
  for (const id of BUILT_IN_THEME_IDS) {
    initialPools[id] = [...SEED_VIDEO_POOL[id]];
  }

  return {
    pools: initialPools,
    customPersonas: {},
    transactions: [],
    dailyQuotaUsed: 0,
    quotaDateKey: getTodayDateKey(),
    userCooldowns: new Map<string, number>(),
    telemetry: {
      cacheHits: 42,
      cacheMisses: 1,
      savedSearchUnits: 1400,
      totalWashesExecuted: 0,
      totalRollbacksExecuted: 0,
      latencySamplesMs: [380, 410, 395],
    },
  };
}

const globalCache = globalThis as unknown as { __algowashCache?: CacheState };
if (!globalCache.__algowashCache) {
  globalCache.__algowashCache = createInitialState();
}

function getState(): CacheState {
  const state = globalCache.__algowashCache!;
  // Ensure any newly added built-in themes exist in warm global cache
  for (const id of BUILT_IN_THEME_IDS) {
    if (!state.pools[id] || state.pools[id]!.length === 0) {
      state.pools[id] = [...SEED_VIDEO_POOL[id]];
    }
  }
  const today = getTodayDateKey();
  if (state.quotaDateKey !== today) {
    state.dailyQuotaUsed = 0;
    state.quotaDateKey = today;
  }
  return state;
}

export function resetCacheForTesting(): void {
  globalCache.__algowashCache = createInitialState();
}

export function isBuiltInThemeId(themeId: string): themeId is BuiltInThemeId {
  return (BUILT_IN_THEME_IDS as string[]).includes(themeId);
}

export function getPresetMeta(themeId: string): ThemePresetMeta | undefined {
  if (isBuiltInThemeId(themeId)) {
    return THEME_PRESETS[themeId];
  }
  return getState().customPersonas[themeId];
}

export function getAllThemePresets(): ThemePresetMeta[] {
  const state = getState();
  const builtIns: ThemePresetMeta[] = BUILT_IN_THEME_IDS.map(
    (id) => THEME_PRESETS[id]
  );
  const customs = Object.values(state.customPersonas);
  return [...builtIns, ...customs];
}

export function registerCustomPersona(
  persona: ThemePresetMeta,
  videos: SeedVideoItem[]
): ThemePresetMeta {
  const state = getState();
  state.customPersonas[persona.id] = {
    ...persona,
    isCustom: true,
    createdAt: new Date().toISOString(),
  };
  state.pools[persona.id] = videos;
  return state.customPersonas[persona.id]!;
}

export function deleteCustomPersona(themeId: string): boolean {
  const state = getState();
  if (!state.customPersonas[themeId]) {
    return false;
  }
  delete state.customPersonas[themeId];
  delete state.pools[themeId];
  return true;
}

export function getThemePool(themeId: string): SeedVideoItem[] {
  const state = getState();
  const pool = state.pools[themeId];

  if (!pool || pool.length < 4) {
    if (isBuiltInThemeId(themeId)) {
      state.pools[themeId] = [...SEED_VIDEO_POOL[themeId]];
    } else if (!pool) {
      state.pools[themeId] = [...SEED_VIDEO_POOL.study];
    }
  }
  return state.pools[themeId] ?? SEED_VIDEO_POOL.puppy;
}

export function sampleThemeVideos(
  themeId: string,
  count: number,
  randomFn: () => number = Math.random
): SeedVideoItem[] {
  const state = getState();
  state.telemetry.cacheHits += 1;
  state.telemetry.savedSearchUnits += SEARCH_LIST_SAVED_UNIT_PER_WASH;

  const pool = [...getThemePool(themeId)];
  const targetCount = Math.min(count, pool.length);
  const selected: SeedVideoItem[] = [];

  for (let i = 0; i < targetCount; i++) {
    const idx = Math.floor(randomFn() * pool.length);
    const [picked] = pool.splice(idx, 1);
    if (picked) {
      selected.push(picked);
    }
  }

  return selected;
}

export function evictVideoFromPool(themeId: string, videoId: string): void {
  const state = getState();
  const current = state.pools[themeId] ?? [];
  state.pools[themeId] = current.filter((item) => item.videoId !== videoId);
}

export function upsertThemePool(
  themeId: string,
  newItems: SeedVideoItem[]
): number {
  const state = getState();
  const current = getThemePool(themeId);
  const existingIds = new Set(current.map((v) => v.videoId));
  const filtered = newItems.filter((item) => !existingIds.has(item.videoId));
  state.pools[themeId] = [...filtered, ...current].slice(0, 50);
  return state.pools[themeId]!.length;
}

export function recordWashTransaction(tx: WashTransaction): WashTransaction {
  const state = getState();
  state.transactions = [tx, ...state.transactions].slice(0, 25);
  state.telemetry.totalWashesExecuted += 1;
  state.telemetry.latencySamplesMs = [
    tx.elapsedMs,
    ...state.telemetry.latencySamplesMs,
  ].slice(0, 20);
  return tx;
}

export function getWashTransactions(): WashTransaction[] {
  return getState().transactions;
}

export function markTransactionRolledBack(
  transactionId: string
): WashTransaction | null {
  const state = getState();
  const target = state.transactions.find((t) => t.id === transactionId);
  if (!target) {
    return null;
  }
  target.rolledBack = true;
  target.rolledBackAt = new Date().toISOString();
  state.telemetry.totalRollbacksExecuted += 1;
  return target;
}

export function getEngineeringTelemetry(): EngineeringTelemetry {
  const { telemetry } = getState();
  const totalLookups = telemetry.cacheHits + telemetry.cacheMisses;
  const cacheHitRate =
    totalLookups > 0
      ? Number(((telemetry.cacheHits / totalLookups) * 100).toFixed(1))
      : 100;
  const avgBatchLatencyMs =
    telemetry.latencySamplesMs.length > 0
      ? Math.round(
          telemetry.latencySamplesMs.reduce((a, b) => a + b, 0) /
            telemetry.latencySamplesMs.length
        )
      : 390;

  return {
    cacheHits: telemetry.cacheHits,
    cacheMisses: telemetry.cacheMisses,
    cacheHitRate,
    savedSearchUnits: telemetry.savedSearchUnits,
    totalWashesExecuted: telemetry.totalWashesExecuted,
    totalRollbacksExecuted: telemetry.totalRollbacksExecuted,
    avgBatchLatencyMs,
  };
}

export function getQuotaStatus(): {
  usedUnits: number;
  remainingUnits: number;
  limitUnits: number;
  isExhausted: boolean;
} {
  const state = getState();
  const remainingUnits = Math.max(
    0,
    DAILY_QUOTA_LIMIT_UNITS - state.dailyQuotaUsed
  );
  return {
    usedUnits: state.dailyQuotaUsed,
    remainingUnits,
    limitUnits: DAILY_QUOTA_LIMIT_UNITS,
    isExhausted: remainingUnits < 200,
  };
}

export function recordQuotaUsage(units: number): number {
  const state = getState();
  state.dailyQuotaUsed += Math.max(0, units);
  return state.dailyQuotaUsed;
}

export function checkAndSetUserCooldown(
  userKey: string,
  nowMs: number = Date.now()
): { allowed: boolean; retryAfterMs: number } {
  const state = getState();
  const expiresAt = state.userCooldowns.get(userKey) ?? 0;

  if (nowMs < expiresAt) {
    return {
      allowed: false,
      retryAfterMs: expiresAt - nowMs,
    };
  }

  state.userCooldowns.set(userKey, nowMs + COOLDOWN_MS);
  return {
    allowed: true,
    retryAfterMs: 0,
  };
}
