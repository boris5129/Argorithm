import {
  evictVideoFromPool,
  getPresetMeta,
  getQuotaStatus,
  markTransactionRolledBack,
  recordQuotaUsage,
  recordWashTransaction,
  sampleThemeVideos,
} from '@/lib/cache';
import { THEME_PRESETS } from '@/lib/seed-videos';
import {
  INTENSITY_VIDEO_COUNT,
  type SeedVideoItem,
  type ThemeId,
  type WashIntensity,
  type WashTransaction,
} from '@/types/theme';

const RATE_QUOTA_UNIT = 50;
const SINGLE_CALL_TIMEOUT_MS = 1_500;

export interface InjectedVideoDetail {
  videoId: string;
  title: string;
  channelTitle: string;
  keyword: string;
  thumbnailUrl?: string;
  duration?: string;
  viewCountText?: string;
  action: 'rate_like' | 'zero_quota_deeplink';
  status: 'fulfilled' | 'rejected' | 'fallback';
  reason?: string;
}

export interface BatchWashResult {
  success: boolean;
  transactionId: string;
  themeId: ThemeId;
  themeName: string;
  themeEmoji: string;
  intensity: WashIntensity;
  fallbackMode: boolean;
  injectedCount: number;
  quotaUsedUnits: number;
  elapsedMs: number;
  deepLink: string;
  searchDeepLink: string;
  details: InjectedVideoDetail[];
}

export interface BatchWashOptions {
  themeId: ThemeId;
  intensity: WashIntensity;
  accessToken?: string;
  demoMode?: boolean;
  fetchImpl?: typeof fetch;
}

export interface BatchRollbackResult {
  success: boolean;
  transactionId: string;
  restoredCount: number;
  quotaUsedUnits: number;
  elapsedMs: number;
  rolledBackVideoIds: string[];
}

/**
 * Calls YouTube Data API v3 `videos.rate(id, rating=like|none)` with a strict 1,500ms timeout guard.
 * Cost: 50 quota units per call. Never calls `search.list` (100 units).
 */
export async function rateYouTubeVideo(
  videoId: string,
  rating: 'like' | 'none',
  accessToken: string,
  fetchImpl: typeof fetch = fetch
): Promise<{ ok: boolean; status: number; reason?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SINGLE_CALL_TIMEOUT_MS);

  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/videos/rate');
    url.searchParams.set('id', videoId);
    url.searchParams.set('rating', rating);

    const response = await fetchImpl(url.toString(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (response.status === 204 || response.ok) {
      return { ok: true, status: 204 };
    }

    let reason = `HTTP_${response.status}`;
    try {
      const errBody = (await response.json()) as {
        error?: { errors?: Array<{ reason?: string }> };
      };
      reason = errBody.error?.errors?.[0]?.reason ?? reason;
    } catch {
      // Ignore JSON parse errors on empty error bodies
    }

    return { ok: false, status: response.status, reason };
  } catch (err) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    return {
      ok: false,
      status: isAbort ? 408 : 500,
      reason: isAbort ? 'timeout' : 'networkError',
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function rateYouTubeVideoLike(
  videoId: string,
  accessToken: string,
  fetchImpl: typeof fetch = fetch
): Promise<{ ok: boolean; status: number; reason?: string }> {
  return rateYouTubeVideo(videoId, 'like', accessToken, fetchImpl);
}

/**
 * Executes concurrent non-blocking signal injection via Promise.allSettled.
 * Automatically activates Zero-Quota Fallback mode if quota is exhausted or 403 quotaExceeded occurs.
 * Saves a WashTransaction snapshot for one-click Rollback (Time-Machine).
 */
export async function executeBatchWash({
  themeId,
  intensity,
  accessToken,
  demoMode = false,
  fetchImpl = fetch,
}: BatchWashOptions): Promise<BatchWashResult> {
  const startMs = Date.now();
  const count = INTENSITY_VIDEO_COUNT[intensity];
  const sampledVideos: SeedVideoItem[] = sampleThemeVideos(themeId, count);
  const preset = getPresetMeta(themeId) ?? THEME_PRESETS.puppy;
  const primaryKeyword = encodeURIComponent(
    preset.defaultSearchKeywords[0] ?? preset.name
  );
  const searchDeepLink = `https://m.youtube.com/results?search_query=${primaryKeyword}`;
  const transactionId = `tx_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

  const quotaStatus = getQuotaStatus();

  // Circuit Breaker 1: Pre-check local quota counter or explicit demo/fallback mode
  if (quotaStatus.isExhausted || demoMode || !accessToken) {
    const details: InjectedVideoDetail[] = sampledVideos.map((v) => ({
      videoId: v.videoId,
      title: v.title,
      channelTitle: v.channelTitle,
      keyword: v.keyword,
      thumbnailUrl: v.thumbnailUrl,
      duration: v.duration,
      viewCountText: v.viewCountText,
      action: demoMode ? 'rate_like' : 'zero_quota_deeplink',
      status: demoMode ? 'fulfilled' : 'fallback',
    }));

    const elapsedMs = Math.max(12, Date.now() - startMs);
    const txSnapshot: WashTransaction = {
      id: transactionId,
      timestamp: new Date().toISOString(),
      themeId,
      themeName: preset.name,
      themeEmoji: preset.emoji,
      intensity,
      videoIds: sampledVideos.map((v) => v.videoId),
      videos: sampledVideos,
      quotaUsedUnits: 0,
      elapsedMs,
      rolledBack: false,
    };
    recordWashTransaction(txSnapshot);

    return {
      success: true,
      transactionId,
      themeId,
      themeName: preset.name,
      themeEmoji: preset.emoji,
      intensity,
      fallbackMode: !demoMode,
      injectedCount: sampledVideos.length,
      quotaUsedUnits: 0,
      elapsedMs,
      deepLink: 'https://m.youtube.com',
      searchDeepLink,
      details,
    };
  }

  // Concurrent Fan-out via Promise.allSettled (< 450ms target latency)
  const settledResults = await Promise.allSettled(
    sampledVideos.map((video) =>
      rateYouTubeVideo(video.videoId, 'like', accessToken, fetchImpl)
    )
  );

  let fulfilledCount = 0;
  let quotaExceededDetected = false;
  const details: InjectedVideoDetail[] = [];

  settledResults.forEach((result, idx) => {
    const video = sampledVideos[idx]!;
    if (result.status === 'fulfilled' && result.value.ok) {
      fulfilledCount++;
      details.push({
        videoId: video.videoId,
        title: video.title,
        channelTitle: video.channelTitle,
        keyword: video.keyword,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        viewCountText: video.viewCountText,
        action: 'rate_like',
        status: 'fulfilled',
      });
      return;
    }

    const reason =
      result.status === 'fulfilled' ? result.value.reason : 'unexpectedRejection';
    const status = result.status === 'fulfilled' ? result.value.status : 500;

    if (status === 404 || reason === 'videoNotFound') {
      evictVideoFromPool(themeId, video.videoId);
    }

    if (status === 403 && reason === 'quotaExceeded') {
      quotaExceededDetected = true;
    }

    details.push({
      videoId: video.videoId,
      title: video.title,
      channelTitle: video.channelTitle,
      keyword: video.keyword,
      thumbnailUrl: video.thumbnailUrl,
      duration: video.duration,
      viewCountText: video.viewCountText,
      action: 'rate_like',
      status: 'rejected',
      reason,
    });
  });

  const elapsedMs = Math.max(15, Date.now() - startMs);

  // Circuit Breaker 2: If YouTube API returned 403 quotaExceeded, mark daily quota as exhausted and return Zero-Quota Fallback
  if (quotaExceededDetected) {
    recordQuotaUsage(10_000);
    return {
      success: true,
      transactionId,
      themeId,
      themeName: preset.name,
      themeEmoji: preset.emoji,
      intensity,
      fallbackMode: true,
      injectedCount: sampledVideos.length,
      quotaUsedUnits: 0,
      elapsedMs,
      deepLink: 'https://m.youtube.com',
      searchDeepLink,
      details: sampledVideos.map((v) => ({
        videoId: v.videoId,
        title: v.title,
        channelTitle: v.channelTitle,
        keyword: v.keyword,
        thumbnailUrl: v.thumbnailUrl,
        duration: v.duration,
        viewCountText: v.viewCountText,
        action: 'zero_quota_deeplink',
        status: 'fallback',
        reason: 'quotaExceeded',
      })),
    };
  }

  const quotaUsedUnits = fulfilledCount * RATE_QUOTA_UNIT;
  recordQuotaUsage(quotaUsedUnits);

  recordWashTransaction({
    id: transactionId,
    timestamp: new Date().toISOString(),
    themeId,
    themeName: preset.name,
    themeEmoji: preset.emoji,
    intensity,
    videoIds: sampledVideos.map((v) => v.videoId),
    videos: sampledVideos,
    quotaUsedUnits,
    elapsedMs,
    rolledBack: false,
  });

  return {
    success: fulfilledCount > 0,
    transactionId,
    themeId,
    themeName: preset.name,
    themeEmoji: preset.emoji,
    intensity,
    fallbackMode: false,
    injectedCount: fulfilledCount,
    quotaUsedUnits,
    elapsedMs,
    deepLink: 'https://m.youtube.com',
    searchDeepLink,
    details,
  };
}

/**
 * One-Click Rollback Engine (`rating='none'`).
 * Concurrently removes injected 'like' signals from all videos in a transaction snapshot.
 */
export async function executeBatchRollback(options: {
  transactionId: string;
  videoIds: string[];
  accessToken?: string;
  demoMode?: boolean;
  fetchImpl?: typeof fetch;
}): Promise<BatchRollbackResult> {
  const startMs = Date.now();
  const {
    transactionId,
    videoIds,
    accessToken,
    demoMode = false,
    fetchImpl = fetch,
  } = options;

  if (demoMode || !accessToken) {
    markTransactionRolledBack(transactionId);
    return {
      success: true,
      transactionId,
      restoredCount: videoIds.length,
      quotaUsedUnits: 0,
      elapsedMs: Math.max(10, Date.now() - startMs),
      rolledBackVideoIds: videoIds,
    };
  }

  const settled = await Promise.allSettled(
    videoIds.map((vid) =>
      rateYouTubeVideo(vid, 'none', accessToken, fetchImpl)
    )
  );

  const rolledBackVideoIds: string[] = [];
  settled.forEach((res, idx) => {
    if (res.status === 'fulfilled' && res.value.ok) {
      rolledBackVideoIds.push(videoIds[idx]!);
    }
  });

  const quotaUsedUnits = rolledBackVideoIds.length * RATE_QUOTA_UNIT;
  recordQuotaUsage(quotaUsedUnits);
  markTransactionRolledBack(transactionId);

  return {
    success: rolledBackVideoIds.length > 0,
    transactionId,
    restoredCount: rolledBackVideoIds.length,
    quotaUsedUnits,
    elapsedMs: Math.max(12, Date.now() - startMs),
    rolledBackVideoIds,
  };
}
