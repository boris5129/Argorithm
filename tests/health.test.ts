import { describe, expect, it } from 'vitest';
import { GET } from '@/app/api/health/route';

describe('GET /api/health', () => {
  it('returns 200 OK with service status and ISO timestamp', async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('algowash-serverless');
    expect(() => new Date(body.timestamp).toISOString()).not.toThrow();
  });
});
