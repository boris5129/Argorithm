import { NextResponse } from 'next/server';
import {
  deleteCustomPersona,
  getAllThemePresets,
  getThemePool,
  registerCustomPersona,
} from '@/lib/cache';
import { generateCustomPersonaWithGemini } from '@/lib/gemini';
import { CreatePersonaRequestSchema } from '@/types/theme';

export async function GET() {
  const presets = getAllThemePresets().map((preset) => ({
    ...preset,
    cachedPoolSize: getThemePool(preset.id).length,
    sampleVideos: getThemePool(preset.id).slice(0, 4),
  }));

  return NextResponse.json({ personas: presets }, { status: 200 });
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const parsed = CreatePersonaRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'INVALID_PERSONA_PROMPT',
          message: '상황 설명을 2자 이상 입력해주세요.',
        },
        { status: 400 }
      );
    }

    const generated = await generateCustomPersonaWithGemini(parsed.data);
    const saved = registerCustomPersona(generated.persona, generated.videos);

    return NextResponse.json(
      {
        success: true,
        source: generated.source,
        persona: {
          ...saved,
          cachedPoolSize: generated.videos.length,
          sampleVideos: generated.videos.slice(0, 4),
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      {
        error: 'PERSONA_CREATION_ERROR',
        message: 'AI 커스텀 페르소나 생성 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || !id.startsWith('custom_')) {
      return NextResponse.json(
        {
          error: 'INVALID_PERSONA_ID',
          message: '기본 프리셋은 삭제할 수 없으며 커스텀 페르소나만 삭제 가능합니다.',
        },
        { status: 400 }
      );
    }

    const deleted = deleteCustomPersona(id);
    if (!deleted) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: '해당 커스텀 페르소나를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, deletedId: id }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'DELETE_ERROR', message: '삭제 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
