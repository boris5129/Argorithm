import { GoogleGenerativeAI } from '@google/generative-ai';
import { getPresetMeta } from '@/lib/cache';
import { THEME_PRESETS } from '@/lib/seed-videos';
import { parseEnv } from '@/lib/env';
import type { SeedVideoItem, ThemeId, ThemePresetMeta } from '@/types/theme';

export interface CuratedKeywordResult {
  themeId: ThemeId;
  keywords: string[];
  source: 'gemini-flash' | 'static-fallback';
}

export interface GeneratedPersonaResult {
  persona: ThemePresetMeta;
  videos: SeedVideoItem[];
  source: 'gemini-flash' | 'semantic-fallback';
}

const CUSTOM_THUMBNAILS = [
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=640&q=80',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=640&q=80',
  'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=640&q=80',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=640&q=80',
  'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=640&q=80',
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=640&q=80',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=640&q=80',
  'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=640&q=80',
];

/**
 * Uses Gemini 1.5 Flash to generate fresh, ultra-clean Korean YouTube search keywords
 * for warming the cache pool. Falls back to static verified keywords if GEMINI_API_KEY is absent.
 */
export async function curateCleanKeywordsWithGemini(
  themeId: ThemeId
): Promise<CuratedKeywordResult> {
  const env = parseEnv();
  const preset = getPresetMeta(themeId) ?? THEME_PRESETS.puppy;

  if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY.startsWith('your-')) {
    return {
      themeId,
      keywords: preset.defaultSearchKeywords,
      source: 'static-fallback',
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = [
      `당신은 유튜브 추천 알고리즘 정화 전문가입니다.`,
      `테마: "${preset.name}" (${preset.tagline})`,
      `자극적이거나 논란의 여지가 전혀 없는 무해하고 훈훈한 한국어 유튜브 검색 키워드 5개를 JSON 배열(["키워드1", "키워드2", ...]) 형식으로만 반환하세요.`,
    ].join('\n');

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      throw new Error('Invalid JSON array from Gemini');
    }

    const parsed = JSON.parse(jsonMatch[0]) as unknown;
    if (
      Array.isArray(parsed) &&
      parsed.every((item) => typeof item === 'string' && item.trim().length > 0)
    ) {
      return {
        themeId,
        keywords: parsed.slice(0, 5),
        source: 'gemini-flash',
      };
    }

    throw new Error('Empty keyword list');
  } catch {
    return {
      themeId,
      keywords: preset.defaultSearchKeywords,
      source: 'static-fallback',
    };
  }
}

/**
 * Generates synthesized cache entries from curated keywords when warming the cache pool.
 */
export function buildCuratedPoolEntries(
  themeId: ThemeId,
  keywords: string[]
): SeedVideoItem[] {
  return keywords.map((keyword, idx) => ({
    videoId: `curated_${themeId}_${Date.now().toString(36)}_${idx}`,
    title: `[청정 큐레이션] ${keyword} 4K 하이라이트 모음 #${idx + 1}`,
    channelTitle: 'AlgoWash AI Curator',
    keyword,
    thumbnailUrl: CUSTOM_THUMBNAILS[idx % CUSTOM_THUMBNAILS.length],
    duration: '14:20',
    viewCountText: `조회수 ${(idx + 2) * 18}만회 · 2일 전`,
  }));
}

/**
 * Builds a complete custom persona (metadata + 8 verified clean video pool items)
 * from a natural-language user prompt (e.g., "명절 친척 모임용: 재테크, 부동산, 트로트, 골프").
 */
export async function generateCustomPersonaWithGemini(input: {
  prompt: string;
  name?: string;
  emoji?: string;
}): Promise<GeneratedPersonaResult> {
  const env = parseEnv();
  const id = `custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const rawPrompt = input.prompt.trim();

  // Semantic inference for instant high-quality persona synthesis
  const isFinance = /재테크|주식|부동산|경제|명절|친척|골프/.test(rawPrompt);
  const isCooking = /요리|레시피|베이킹|집밥|가정적|살림/.test(rawPrompt);
  const isWorkout = /운동|헬스|러닝|다이어트|홈트|요가/.test(rawPrompt);

  let inferredEmoji = input.emoji || '✨';
  let inferredName = input.name || rawPrompt.slice(0, 18);
  let accentColor = 'from-violet-500 to-indigo-600';
  let keywords: string[] = [
    `${rawPrompt} 브이로그`,
    `${rawPrompt} 기초 가이드`,
    `${rawPrompt} 추천 플레이리스트`,
    `${rawPrompt} 다큐멘터리`,
    `${rawPrompt} 4K 힐링`,
  ];

  if (isFinance) {
    inferredEmoji = input.emoji || '📈';
    inferredName = input.name || '명절/어른 안심 (경제·교양)';
    accentColor = 'from-sky-500 to-blue-600';
    keywords = [
      '2026 거시경제 전망 세미나',
      '초보자를 위한 안전자산 포트폴리오',
      '주말 아침 클래식 & 신문 브리핑',
      '시니어 골프 스윙 정석 레슨',
      '한국인이 좋아하는 명곡 콘서트 모음',
    ];
  } else if (isCooking) {
    inferredEmoji = input.emoji || '🍳';
    inferredName = input.name || '다정한 요리/홈카페 모드';
    accentColor = 'from-orange-500 to-amber-600';
    keywords = [
      '주말 브런치 홈카페 레시피 브이로그',
      '정갈한 한식 집밥 일주일 식단',
      '노오븐 수제 디저트 베이킹 ASMR',
      '자취생 10분 건강 도시락 만들기',
      '따뜻한 수프와 파스타 요리 일상',
    ];
  } else if (isWorkout) {
    inferredEmoji = input.emoji || '🏃';
    inferredName = input.name || '바른생활 러닝/홈트 모드';
    accentColor = 'from-cyan-500 to-emerald-600';
    keywords = [
      '한강 새벽 러닝 10km 브이로그',
      '전신 코어 스트레칭 & 모닝 요가 30분',
      '클린 식단 & 바디프로필 준비 루틴',
      '러닝할 때 듣는 청량한 플레이리스트',
      '정형외과 전문의 거북목 교정 스트레칭',
    ];
  }

  let source: 'gemini-flash' | 'semantic-fallback' = 'semantic-fallback';

  if (env.GEMINI_API_KEY && !env.GEMINI_API_KEY.startsWith('your-')) {
    try {
      const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const geminiPrompt = [
        `사용자가 유튜브 알고리즘을 위장/정화하고 싶어 하는 상황: "${rawPrompt}"`,
        `이 상황에 가장 잘 어울리는 무해하고 교양 있는 한국어 유튜브 영상 검색 키워드 5개를 JSON 배열(["키워드1", ...])로만 출력하세요.`,
      ].join('\n');
      const res = await model.generateContent(geminiPrompt);
      const match = res.response.text().match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]) as unknown;
        if (Array.isArray(parsed) && parsed.length >= 3) {
          keywords = parsed.map((k) => String(k)).slice(0, 5);
          source = 'gemini-flash';
        }
      }
    } catch {
      // Fallback to semantic keywords seamlessly
    }
  }

  const persona: ThemePresetMeta = {
    id,
    name: inferredName,
    emoji: inferredEmoji,
    tagline: `"${rawPrompt}" 맞춤형 AI 큐레이션 청정 피드`,
    accentColor,
    badgeText: 'AI 커스텀 페르소나 · 즉시 세탁 가능',
    defaultSearchKeywords: keywords,
    isCustom: true,
    createdAt: new Date().toISOString(),
  };

  const videos: SeedVideoItem[] = [
    ...keywords,
    `${keywords[0]} 심화편`,
    `${keywords[1]} 모음집`,
    `${keywords[2]} 라이브`,
  ]
    .slice(0, 8)
    .map((kw, idx) => ({
      videoId: `${id}_vid_${idx + 1}`,
      title: `[4K] ${kw} | 알고리즘 정화 추천 영상 #${idx + 1}`,
      channelTitle: `${inferredName.slice(0, 8)} 공식채널`,
      keyword: kw,
      thumbnailUrl: CUSTOM_THUMBNAILS[idx % CUSTOM_THUMBNAILS.length],
      duration: `${10 + idx * 3}:25`,
      viewCountText: `조회수 ${(idx + 3) * 14}만회 · ${idx + 1}일 전`,
    }));

  return {
    persona,
    videos,
    source,
  };
}
