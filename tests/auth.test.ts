import { describe, expect, it, vi } from 'vitest';
import { parseEnv, isLiveOAuthConfigured } from '@/lib/env';
import { refreshGoogleAccessToken, type ExtendedJWT } from '@/lib/auth';

describe('Phase 2: Environment & OAuth Silent Refresh Harness', () => {
  it('parses environment variables with safe development fallbacks', () => {
    const env = parseEnv({ NODE_ENV: 'test' });
    expect(env.GOOGLE_CLIENT_ID).toBe('mock-google-client-id');
    expect(isLiveOAuthConfigured({ GOOGLE_CLIENT_ID: 'mock-id' })).toBe(false);
    expect(
      isLiveOAuthConfigured({
        GOOGLE_CLIENT_ID: '12345.apps.googleusercontent.com',
        GOOGLE_CLIENT_SECRET: 'real-secret',
      })
    ).toBe(true);
  });

  it('silently refreshes expired Google OAuth access token when refresh_token is valid', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        access_token: 'new-fresh-access-token',
        expires_in: 3600,
      }),
    });

    const expiredToken: ExtendedJWT = {
      accessToken: 'old-expired-token',
      refreshToken: 'valid-refresh-token',
      accessTokenExpires: Date.now() - 10_000,
    };

    const updated = await refreshGoogleAccessToken(
      expiredToken,
      mockFetch as unknown as typeof fetch
    );

    expect(updated.accessToken).toBe('new-fresh-access-token');
    expect(updated.error).toBeUndefined();
    expect(updated.accessTokenExpires).toBeGreaterThan(Date.now());
  });

  it('returns RefreshAccessTokenError when refresh_token is missing or revoked', async () => {
    const tokenWithoutRefresh: ExtendedJWT = {
      accessToken: 'old-token',
    };

    const result1 = await refreshGoogleAccessToken(tokenWithoutRefresh);
    expect(result1.error).toBe('RefreshAccessTokenError');

    const failingFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'invalid_grant' }),
    });

    const result2 = await refreshGoogleAccessToken(
      { accessToken: 'old', refreshToken: 'revoked-token' },
      failingFetch as unknown as typeof fetch
    );
    expect(result2.error).toBe('RefreshAccessTokenError');
  });
});
