import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { checkAndSetUserCooldown } from '@/lib/cache';
import { parseEnv } from '@/lib/env';
import { executeBatchWash } from '@/lib/youtube';
import type { ExtendedJWT } from '@/lib/auth';
import { WashRequestSchema } from '@/types/theme';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const parsed = WashRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'INVALID_PAYLOAD',
          message: '올바른 세탁 테마(puppy, baby, study)와 강도를 선택해주세요.',
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { themeId, intensity, demoMode } = parsed.data;
    const env = parseEnv();

    // Retrieve encrypted server-side JWT token if present
    let jwtToken: ExtendedJWT | null = null;
    try {
      jwtToken = (await getToken({
        req: request,
        secret: env.NEXTAUTH_SECRET,
      })) as ExtendedJWT | null;
    } catch {
      jwtToken = null;
    }

    if (jwtToken?.error === 'RefreshAccessTokenError') {
      return NextResponse.json(
        {
          error: 'REAUTH_REQUIRED',
          message: 'Google 인증 세션이 만료되었습니다. 다시 연결해주세요.',
        },
        { status: 401 }
      );
    }

    const userKey =
      jwtToken?.sub ??
      request.headers.get('x-forwarded-for') ??
      'anonymous-mobile-user';

    const cooldown = checkAndSetUserCooldown(userKey);
    if (!cooldown.allowed) {
      return NextResponse.json(
        {
          error: 'COOLDOWN_ACTIVE',
          message: `연속 클릭 방지 중입니다. ${Math.ceil(cooldown.retryAfterMs / 1000)}초 후 다시 시도하세요.`,
          retryAfterMs: cooldown.retryAfterMs,
        },
        { status: 429 }
      );
    }

    const result = await executeBatchWash({
      themeId,
      intensity,
      accessToken: jwtToken?.accessToken,
      demoMode: demoMode || !jwtToken?.accessToken,
    });

    return NextResponse.json(result, {
      status: result.fallbackMode ? 206 : 200,
    });
  } catch {
    return NextResponse.json(
      {
        error: 'INTERNAL_WASH_ERROR',
        message: '긴급 세탁 처리 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
