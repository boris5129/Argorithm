import { z } from 'zod';

export const BuiltInThemeIdSchema = z.enum([
  'puppy',
  'cat',
  'baby',
  'lecture',
  'classical',
  'study',
  'cooking',
  'docu',
]);
export type BuiltInThemeId = z.infer<typeof BuiltInThemeIdSchema>;

export const BUILT_IN_THEME_IDS: BuiltInThemeId[] = [
  'puppy',
  'cat',
  'baby',
  'lecture',
  'classical',
  'study',
  'cooking',
  'docu',
];

export type ThemeCategory = 'animal' | 'academic' | 'culture';

export const ThemeIdSchema = z
  .string()
  .min(2)
  .max(64)
  .refine(
    (val) =>
      (BUILT_IN_THEME_IDS as string[]).includes(val) ||
      val.startsWith('custom_'),
    { message: '유효하지 않은 테마 ID입니다.' }
  );

export type ThemeId = string;

export const WashIntensitySchema = z.enum(['light', 'normal', 'max']);
export type WashIntensity = z.infer<typeof WashIntensitySchema>;

export const WashRequestSchema = z.object({
  themeId: ThemeIdSchema,
  intensity: WashIntensitySchema.default('normal'),
  demoMode: z.boolean().optional().default(false),
});

export type WashRequest = z.infer<typeof WashRequestSchema>;

export const RollbackRequestSchema = z.object({
  transactionId: z.string().min(1),
  videoIds: z.array(z.string().min(1)).min(1).max(20),
  demoMode: z.boolean().optional().default(false),
});

export type RollbackRequest = z.infer<typeof RollbackRequestSchema>;

export const CreatePersonaRequestSchema = z.object({
  prompt: z.string().min(2, '상황이나 키워드를 2자 이상 입력해주세요.').max(120),
  name: z.string().max(40).optional(),
  emoji: z.string().max(8).optional(),
});

export type CreatePersonaRequest = z.infer<typeof CreatePersonaRequestSchema>;

export interface SeedVideoItem {
  videoId: string;
  title: string;
  channelTitle: string;
  keyword: string;
  thumbnailUrl?: string;
  duration?: string;
  viewCountText?: string;
}

export interface ThemePresetMeta {
  id: string;
  name: string;
  emoji: string;
  category?: ThemeCategory;
  tagline: string;
  accentColor: string;
  badgeText: string;
  defaultSearchKeywords: string[];
  isCustom?: boolean;
  createdAt?: string;
}

export interface WashTransaction {
  id: string;
  timestamp: string;
  themeId: string;
  themeName: string;
  themeEmoji: string;
  intensity: WashIntensity;
  videoIds: string[];
  videos: SeedVideoItem[];
  quotaUsedUnits: number;
  elapsedMs: number;
  rolledBack: boolean;
  rolledBackAt?: string;
}

export interface EngineeringTelemetry {
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;
  savedSearchUnits: number;
  totalWashesExecuted: number;
  totalRollbacksExecuted: number;
  avgBatchLatencyMs: number;
}

export const INTENSITY_VIDEO_COUNT: Record<WashIntensity, number> = {
  light: 4,
  normal: 6,
  max: 8,
};
