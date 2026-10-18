import { beforeEach, describe, expect, it } from 'vitest';
import type { NextRequest } from 'next/server';
import {
  getEngineeringTelemetry,
  getWashTransactions,
  resetCacheForTesting,
} from '@/lib/cache';
import { POST as washPost } from '@/app/api/wash/route';
import { POST as rollbackPost } from '@/app/api/wash/rollback/route';
import {
  DELETE as deletePersona,
  GET as getPersonas,
  POST as createPersona,
} from '@/app/api/personas/route';

describe('AlgoWash v2.0 SaaS Features: Rollback, Custom Persona CRUD & Telemetry', () => {
  beforeEach(() => {
    resetCacheForTesting();
  });

  it('records transaction snapshot on wash and rolls back (rating=none) via POST /api/wash/rollback', async () => {
    const washReq = new Request('http://localhost:3000/api/wash', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '10.0.0.1',
      },
      body: JSON.stringify({
        themeId: 'puppy',
        intensity: 'normal',
        demoMode: true,
      }),
    }) as unknown as NextRequest;

    const washRes = await washPost(washReq);
    expect(washRes.status).toBe(200);
    const washBody = await washRes.json();

    expect(washBody.transactionId).toMatch(/^tx_/);
    expect(washBody.details[0].thumbnailUrl).toContain('https://');
    expect(getWashTransactions()).toHaveLength(1);
    expect(getWashTransactions()[0]!.rolledBack).toBe(false);

    // Execute one-click rollback
    const rollbackReq = new Request('http://localhost:3000/api/wash/rollback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactionId: washBody.transactionId,
        videoIds: washBody.details.map((d: { videoId: string }) => d.videoId),
        demoMode: true,
      }),
    }) as unknown as NextRequest;

    const rollbackRes = await rollbackPost(rollbackReq);
    expect(rollbackRes.status).toBe(200);
    const rollbackBody = await rollbackRes.json();
    expect(rollbackBody.success).toBe(true);
    expect(rollbackBody.restoredCount).toBe(6);
    expect(getWashTransactions()[0]!.rolledBack).toBe(true);
  });

  it('creates, lists, washes, and deletes AI custom personas via /api/personas CRUD', async () => {
    const createReq = new Request('http://localhost:3000/api/personas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: '명절 친척 모임용: 재테크, 부동산, 골프',
        name: '명절 안심 모드',
        emoji: '📈',
      }),
    });

    const createRes = await createPersona(createReq);
    expect(createRes.status).toBe(201);
    const createBody = await createRes.json();
    const customId = createBody.persona.id as string;
    expect(customId).toMatch(/^custom_/);
    expect(createBody.persona.cachedPoolSize).toBe(8);

    // Verify custom persona appears in GET /api/personas
    const listRes = await getPersonas();
    const listBody = await listRes.json();
    expect(
      listBody.personas.some((p: { id: string }) => p.id === customId)
    ).toBe(true);

    // Delete custom persona
    const delReq = new Request(
      `http://localhost:3000/api/personas?id=${encodeURIComponent(customId)}`,
      { method: 'DELETE' }
    );
    const delRes = await deletePersona(delReq);
    expect(delRes.status).toBe(200);
  });

  it('calculates engineering observability telemetry (cache hit rate & saved search quota)', () => {
    const telemetry = getEngineeringTelemetry();
    expect(telemetry.cacheHitRate).toBeGreaterThan(90);
    expect(telemetry.savedSearchUnits).toBeGreaterThanOrEqual(1400);
  });
});
