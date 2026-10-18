import { NextResponse } from 'next/server';
import {
  getAllThemePresets,
  getEngineeringTelemetry,
  getQuotaStatus,
  getThemePool,
  getWashTransactions,
  upsertThemePool,
} from '@/lib/cache';
import { buildCuratedPoolEntries, curateCleanKeywordsWithGemini } from '@/lib/gemini';
import { ThemeIdSchema } from '@/types/theme';

export async function GET() {
  const allPresets = getAllThemePresets();
  const themes = allPresets.map((preset) => {
    const pool = getThemePool(preset.id);
    return {
      id: preset.id,
      name: preset.name,
      emoji: preset.emoji,
      category: preset.category ?? 'culture',
      tagline: preset.tagline,
      accentColor: preset.accentColor,
      badgeText: preset.badgeText,
      isCustom: Boolean(preset.isCustom),
      defaultSearchKeywords: preset.defaultSearchKeywords,
      cachedPoolSize: pool.length,
      sampleVideos: pool.slice(0, 8),
      status: pool.length >= 4 ? 'ready' : 'warming',
    };
  });

  return NextResponse.json(
    {
      themes,
      quota: getQuotaStatus(),
      telemetry: getEngineeringTelemetry(),
      transactions: getWashTransactions(),
    },
    { status: 200 }
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { themeId?: unknown };
    const parsed = ThemeIdSchema.safeParse(body.themeId);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'INVALID_THEME_ID', message: '유효하지 않은 테마 ID입니다.' },
        { status: 400 }
      );
    }

    const themeId = parsed.data;
    const curated = await curateCleanKeywordsWithGemini(themeId);
    const newEntries = buildCuratedPoolEntries(themeId, curated.keywords);
    const updatedPoolSize = upsertThemePool(themeId, newEntries);

    return NextResponse.json(
      {
        success: true,
        themeId,
        source: curated.source,
        keywords: curated.keywords,
        cachedPoolSize: updatedPoolSize,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: 'BAD_REQUEST', message: '잘못된 요청 형식입니다.' },
      { status: 400 }
    );
  }
}
