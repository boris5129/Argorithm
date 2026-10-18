import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';
import { getQuotaStatus, getThemePool, resetCacheForTesting } from '@/lib/cache';
import { executeBatchWash } from '@/lib/youtube';
import { POST } from '@/app/api/wash/route';

describe('Phase 4: YouTube Async Batch Signal Injection & Fallback Harness', () => {
  beforeEach(() => {
    resetCacheForTesting();
  });

  it('executes concurrent videos.rate(like) fan-out and records exact quota (6 * 50 = 300 units)', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    });

    const result = await executeBatchWash({
      themeId: 'puppy',
      intensity: 'normal',
      accessToken: 'valid-oauth-token',
      fetchImpl: mockFetch as unknown as typeof fetch,
    });

    expect(result.success).toBe(true);
    expect(result.fallbackMode).toBe(false);
    expect(result.injectedCount).toBe(6);
    expect(result.quotaUsedUnits).toBe(300);
    expect(mockFetch).toHaveBeenCalledTimes(6);
    expect(getQuotaStatus().usedUnits).toBe(300);
  });

  it('evicts 404 videoNotFound items while still succeeding for remaining videos in Promise.allSettled', async () => {
    let callIdx = 0;
    const mockFetch = vi.fn().mockImplementation(async () => {
      callIdx++;
      if (callIdx === 1) {
        return {
          ok: false,
          status: 404,
          json: async () => ({
            error: { errors: [{ reason: 'videoNotFound' }] },
          }),
        };
      }
      return { ok: true, status: 204 };
    });

    const initialPoolSize = getThemePool('baby').length;
    const result = await executeBatchWash({
      themeId: 'baby',
      intensity: 'light', // 4 videos
      accessToken: 'valid-oauth-token',
      fetchImpl: mockFetch as unknown as typeof fetch,
    });

    expect(result.success).toBe(true);
    expect(result.injectedCount).toBe(3);
    expect(result.quotaUsedUnits).toBe(150);
    expect(getThemePool('baby').length).toBe(initialPoolSize - 1);
  });

  it('triggers Circuit Breaker & Zero-Quota Fallback mode on 403 quotaExceeded', async () => {
    const quotaExceededFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        error: { errors: [{ reason: 'quotaExceeded' }] },
      }),
    });

    const result = await executeBatchWash({
      themeId: 'study',
      intensity: 'normal',
      accessToken: 'valid-oauth-token',
      fetchImpl: quotaExceededFetch as unknown as typeof fetch,
    });

    expect(result.success).toBe(true);
    expect(result.fallbackMode).toBe(true);
    expect(result.quotaUsedUnits).toBe(0);
    expect(getQuotaStatus().isExhausted).toBe(true);
  });

  it('POST /api/wash validates payload, enforces 10s cooldown, and returns wash result', async () => {
    const badReq = new Request('http://localhost:3000/api/wash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ themeId: 'invalid_theme' }),
    }) as unknown as NextRequest;

    const badRes = await POST(badReq);
    expect(badRes.status).toBe(400);

    const validReq1 = new Request('http://localhost:3000/api/wash', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
      },
      body: JSON.stringify({ themeId: 'puppy', intensity: 'normal', demoMode: true }),
    }) as unknown as NextRequest;

    const validRes1 = await POST(validReq1);
    expect(validRes1.status).toBe(200);
    const body1 = await validRes1.json();
    expect(body1.injectedCount).toBe(6);

    // Immediate second click from same user should hit 429 cooldown guard
    const validReq2 = new Request('http://localhost:3000/api/wash', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
      },
      body: JSON.stringify({ themeId: 'puppy', intensity: 'normal', demoMode: true }),
    }) as unknown as NextRequest;

    const cooldownRes = await POST(validReq2);
    expect(cooldownRes.status).toBe(429);
  });
});
