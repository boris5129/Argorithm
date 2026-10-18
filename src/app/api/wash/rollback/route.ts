import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { parseEnv } from '@/lib/env';
import { executeBatchRollback } from '@/lib/youtube';
import type { ExtendedJWT } from '@/lib/auth';
import { RollbackRequestSchema } from '@/types/theme';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const parsed = RollbackRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'INVALID_ROLLBACK_PAYLOAD',
          message: '복구할 트랜잭션 ID와 영상 ID 리스트가 필요합니다.',
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { transactionId, videoIds, demoMode } = parsed.data;
    const env = parseEnv();

    let jwtToken: ExtendedJWT | null = null;
    try {
      jwtToken = (await getToken({
        req: request,
        secret: env.NEXTAUTH_SECRET,
      })) as ExtendedJWT | null;
    } catch {
      jwtToken = null;
    }

    const result = await executeBatchRollback({
      transactionId,
      videoIds,
      accessToken: jwtToken?.accessToken,
      demoMode: demoMode || !jwtToken?.accessToken,
    });

    return NextResponse.json(result, { status: 200 });
  } catch {
    return NextResponse.json(
      {
        error: 'ROLLBACK_FAILED',
        message: '알고리즘 원상복구 처리 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
