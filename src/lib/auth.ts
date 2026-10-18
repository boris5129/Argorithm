import type { NextAuthOptions } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import GoogleProvider from 'next-auth/providers/google';
import { parseEnv } from '@/lib/env';

export interface ExtendedJWT extends JWT {
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: number;
  error?: 'RefreshAccessTokenError';
}

export interface GoogleTokenRefreshResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
}

/**
 * Refreshes an expired Google OAuth 2.0 Access Token using the stored refresh_token.
 * Pure function with injectable fetchImpl for deterministic unit testing.
 */
export async function refreshGoogleAccessToken(
  token: ExtendedJWT,
  fetchImpl: typeof fetch = fetch
): Promise<ExtendedJWT> {
  if (!token.refreshToken) {
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }

  try {
    const env = parseEnv();
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: token.refreshToken,
    });

    const response = await fetchImpl('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const refreshedTokens = (await response.json()) as GoogleTokenRefreshResponse & {
      error?: string;
    };

    if (!response.ok || !refreshedTokens.access_token) {
      throw new Error(refreshedTokens.error ?? `HTTP ${response.status}`);
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      error: undefined,
    };
  } catch {
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

const env = parseEnv();

export const authOptions: NextAuthOptions = {
  secret: env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope:
            'openid email profile https://www.googleapis.com/auth/youtube.force-ssl',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }): Promise<ExtendedJWT> {
      const extToken = token as ExtendedJWT;

      if (account) {
        return {
          ...extToken,
          accessToken: account.access_token,
          accessTokenExpires: account.expires_at
            ? account.expires_at * 1000
            : Date.now() + 3600 * 1000,
          refreshToken: account.refresh_token,
        };
      }

      // Return previous token if the access token has not expired yet (with 60s buffer)
      if (
        extToken.accessTokenExpires &&
        Date.now() < extToken.accessTokenExpires - 60_000
      ) {
        return extToken;
      }

      // Access token has expired, silently refresh it
      return refreshGoogleAccessToken(extToken);
    },
    async session({ session, token }) {
      const extToken = token as ExtendedJWT;
      return {
        ...session,
        error: extToken.error,
        hasYouTubeScope: Boolean(extToken.accessToken),
      };
    },
  },
};
