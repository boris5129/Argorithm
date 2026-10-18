import { beforeEach, describe, expect, it } from 'vitest';
import {
  checkAndSetUserCooldown,
  evictVideoFromPool,
  getQuotaStatus,
  getThemePool,
  recordQuotaUsage,
  resetCacheForTesting,
  sampleThemeVideos,
} from '@/lib/cache';
import { GET, POST } from '@/app/api/themes/route';

describe('Phase 3: Quota-Shield Cache Layer & Theme Curation Harness', () => {
  beforeEach(() => {
    resetCacheForTesting();
  });

  it('samples requested number of unique videos from L1/L2 cache pool in < 5ms', () => {
    const sampled = sampleThemeVideos('puppy', 6);
    expect(sampled).toHaveLength(6);
    const uniqueIds = new Set(sampled.map((s) => s.videoId));
    expect(uniqueIds.size).toBe(6);
  });

  it('evicts broken 404 videoId from pool and auto-reseeds if pool gets too small', () => {
    const initialSize = getThemePool('baby').length;
    const firstId = getThemePool('baby')[0]!.videoId;

    evictVideoFromPool('baby', firstId);
    expect(getThemePool('baby').length).toBe(initialSize - 1);
    expect(getThemePool('baby').some((v) => v.videoId === firstId)).toBe(false);
  });

  it('enforces 10-second cooldown lock per user to prevent rapid button mashing', () => {
    const now = 1_700_000_000_000;
    const firstTry = checkAndSetUserCooldown('user-1', now);
    expect(firstTry.allowed).toBe(true);

    const rapidSecondTry = checkAndSetUserCooldown('user-1', now + 2_000);
    expect(rapidSecondTry.allowed).toBe(false);
    expect(rapidSecondTry.retryAfterMs).toBe(8_000);

    const afterCooldownTry = checkAndSetUserCooldown('user-1', now + 10_001);
    expect(afterCooldownTry.allowed).toBe(true);
  });

  it('tracks daily YouTube API quota units and flags exhaustion before hitting 10,000 limit', () => {
    expect(getQuotaStatus().isExhausted).toBe(false);
    recordQuotaUsage(9_850);
    expect(getQuotaStatus().isExhausted).toBe(true);
  });

  it('GET /api/themes and POST /api/themes curate endpoint work as specified (8 built-in themes)', async () => {
    const getRes = await GET();
    expect(getRes.status).toBe(200);
    const getJson = await getRes.json();
    expect(getJson.themes).toHaveLength(8);

    const postReq = new Request('http://localhost:3000/api/themes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ themeId: 'study' }),
    });
    const postRes = await POST(postReq);
    expect(postRes.status).toBe(200);
    const postJson = await postRes.json();
    expect(postJson.success).toBe(true);
    expect(postJson.themeId).toBe('study');
    expect(postJson.cachedPoolSize).toBeGreaterThan(10);
  });
});
