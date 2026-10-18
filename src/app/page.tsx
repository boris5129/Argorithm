'use client';

import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Baby,
  BookOpen,
  Cat,
  Check,
  ChefHat,
  Clock,
  Code2,
  Compass,
  Crown,
  Database,
  Dog,
  ExternalLink,
  EyeOff,
  History,
  Layers,
  Moon,
  Music,
  Play,
  Plus,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sun,
  Terminal,
  Trash2,
  TrendingUp,
  UserCheck,
  Zap,
} from 'lucide-react';
import { SEED_VIDEO_POOL, THEME_PRESETS } from '@/lib/seed-videos';
import {
  BUILT_IN_THEME_IDS,
  INTENSITY_VIDEO_COUNT,
  type BuiltInThemeId,
  type EngineeringTelemetry,
  type SeedVideoItem,
  type ThemePresetMeta,
  type WashIntensity,
  type WashTransaction,
} from '@/types/theme';
import type { BatchWashResult } from '@/lib/youtube';

type ActiveTab = 'console' | 'studio' | 'rollback' | 'saas' | 'stealth';
type CategoryFilter = 'all' | 'animal' | 'academic' | 'culture';
type StealthSkin = 'cs_interview' | 'weather_center';

interface RiskCategoryBar {
  label: string;
  percent: number;
  barClass: string;
  textClass: string;
}

const POLLUTED_CATEGORIES: RiskCategoryBar[] = [
  {
    label: '자극적인 쇼츠 · 가십 · 이슈 영상',
    percent: 52,
    barClass: 'bg-rose-500',
    textClass: 'text-rose-500',
  },
  {
    label: '게임 하이라이트 · 스트리머 클립',
    percent: 36,
    barClass: 'bg-amber-500',
    textClass: 'text-amber-500',
  },
  {
    label: '일상 · 교양 · 힐링 콘텐츠',
    percent: 12,
    barClass: 'bg-emerald-500',
    textClass: 'text-emerald-600',
  },
];

const CLEAN_CATEGORIES_MAP: Record<string, RiskCategoryBar[]> = {
  puppy: [
    { label: '골든리트리버 · 강아지 산책 브이로그', percent: 78, barClass: 'bg-emerald-500', textClass: 'text-emerald-600' },
    { label: '반려동물 힐링 · 수면 음악', percent: 18, barClass: 'bg-teal-400', textClass: 'text-teal-600' },
    { label: '이전 시청 기록 잔여분', percent: 4, barClass: 'bg-slate-300', textClass: 'text-slate-400' },
  ],
  cat: [
    { label: '아기 고양이 골골송 · 집사 브이로그', percent: 80, barClass: 'bg-emerald-500', textClass: 'text-emerald-600' },
    { label: '귀여운 먼치킨 · 냥이 일상 모음', percent: 16, barClass: 'bg-teal-400', textClass: 'text-teal-600' },
    { label: '이전 시청 기록 잔여분', percent: 4, barClass: 'bg-slate-300', textClass: 'text-slate-400' },
  ],
  baby: [
    { label: '귀여운 아기 웃음소리 · 육아 일상', percent: 81, barClass: 'bg-emerald-500', textClass: 'text-emerald-600' },
    { label: '따뜻한 주말 가족 브이로그', percent: 15, barClass: 'bg-teal-400', textClass: 'text-teal-600' },
    { label: '이전 시청 기록 잔여분', percent: 4, barClass: 'bg-slate-300', textClass: 'text-slate-400' },
  ],
  lecture: [
    { label: 'EBS 수능특강 · 기출문제 해설 강의', percent: 79, barClass: 'bg-emerald-500', textClass: 'text-emerald-600' },
    { label: '토익 · 한국사 · 자격증 요약 특강', percent: 17, barClass: 'bg-teal-400', textClass: 'text-teal-600' },
    { label: '이전 시청 기록 잔여분', percent: 4, barClass: 'bg-slate-300', textClass: 'text-slate-400' },
  ],
  classical: [
    { label: '쇼팽 · 드뷔시 피아노 연주곡 모음', percent: 77, barClass: 'bg-emerald-500', textClass: 'text-emerald-600' },
    { label: '모차르트 실내악 · 미술관 교양 해설', percent: 19, barClass: 'bg-teal-400', textClass: 'text-teal-600' },
    { label: '이전 시청 기록 잔여분', percent: 4, barClass: 'bg-slate-300', textClass: 'text-slate-400' },
  ],
  study: [
    { label: '4K Study With Me · 도서관 백색소음', percent: 76, barClass: 'bg-emerald-500', textClass: 'text-emerald-600' },
    { label: '개발자 갓생 루틴 · 전공 학습', percent: 20, barClass: 'bg-teal-400', textClass: 'text-teal-600' },
    { label: '이전 시청 기록 잔여분', percent: 4, barClass: 'bg-slate-300', textClass: 'text-slate-400' },
  ],
  cooking: [
    { label: '정갈한 집밥 레시피 · 1분 요리법', percent: 80, barClass: 'bg-emerald-500', textClass: 'text-emerald-600' },
    { label: '주말 브런치 홈카페 · 홈베이킹', percent: 16, barClass: 'bg-teal-400', textClass: 'text-teal-600' },
    { label: '이전 시청 기록 잔여분', percent: 4, barClass: 'bg-slate-300', textClass: 'text-slate-400' },
  ],
  docu: [
    { label: '4K 스위스 대자연 · 세계 테마 기행', percent: 78, barClass: 'bg-emerald-500', textClass: 'text-emerald-600' },
    { label: '우주 · 해양 과학 교양 다큐멘터리', percent: 18, barClass: 'bg-teal-400', textClass: 'text-teal-600' },
    { label: '이전 시청 기록 잔여분', percent: 4, barClass: 'bg-slate-300', textClass: 'text-slate-400' },
  ],
};

const INTENSITY_META: Record<
  WashIntensity,
  { label: string; count: number; desc: string; badge: string }
> = {
  light: {
    label: '가볍게 정돈',
    count: 4,
    desc: '영상 4개 · 자연스러운 피드 보정',
    badge: '가벼운 전환',
  },
  normal: {
    label: '표준 피드 세탁',
    count: 6,
    desc: '영상 6개 · 홈 화면 상단 즉시 교체',
    badge: '가장 많이 선택',
  },
  max: {
    label: '강력 완전 덮어쓰기',
    count: 8,
    desc: '영상 8개 · 기존 추천 흔적 완벽 차단',
    badge: '위기 탈출용',
  },
};

const CATEGORY_TABS: Array<{ id: CategoryFilter; label: string; count?: number }> = [
  { id: 'all', label: '전체 테마' },
  { id: 'animal', label: '동물 · 육아 힐링' },
  { id: 'academic', label: '학업 · 인강 · 열공' },
  { id: 'culture', label: '교양 · 클래식 · 요리' },
];

const QUICK_PERSONA_PROMPTS = [
  '명절 친척 모임용: 재테크, 부동산, 거시경제, 골프',
  '연인에게 요리 잘하고 다정한 사람처럼 보이기 (홈카페/집밥)',
  '새벽 한강 러닝과 모닝 요가를 즐기는 바른생활 직장인',
  '주말마다 미술관 전시회와 클래식을 찾는 지적인 취향',
];

const CS_FLASHCARDS = [
  {
    category: 'Operating System',
    q: '프로세스(Process)와 스레드(Thread)의 메모리 공유 구조 차이는?',
    a: '프로세스는 독립된 Code/Data/Heap/Stack 가상 메모리 공간을 할당받으며, 스레드는 Stack만 독립적으로 갖고 Code/Data/Heap을 공유하여 컨텍스트 스위칭 비용이 낮습니다.',
  },
  {
    category: 'Network / HTTP',
    q: 'TCP 3-Way Handshake와 4-Way Handshake의 동작 원리는?',
    a: '연결 수립 시 SYN -> SYN+ACK -> ACK 3단계를 거치며, 연결 종료 시 FIN -> ACK -> FIN -> ACK 4단계와 TIME_WAIT 상태를 통해 패킷 유실을 방지합니다.',
  },
  {
    category: 'Database Index',
    q: 'B+Tree 인덱스를 사용하는 핵심 이유와 카디널리티(Cardinality)의 관계는?',
    a: '리프 노드가 연결 리스트로 이어져 범위 탐색(Range Scan)에 유리하며, 중복도가 낮고 카디널리티가 높은 컬럼에 설정할수록 탐색 효율이 극대화됩니다.',
  },
  {
    category: 'Serverless Architecture',
    q: 'Promise.all과 Promise.allSettled의 장애 격리 차이는?',
    a: 'Promise.all은 단일 요청 실패 시 즉시 전체가 Reject되지만, Promise.allSettled는 모든 병렬 작업의 성공/실패 결과를 독립적으로 수집해 부분 실패 복원력을 보장합니다.',
  },
];

function getThemeIconComponent(themeId: string) {
  switch (themeId) {
    case 'puppy':
      return {
        Icon: Dog,
        bgLight: 'bg-amber-50 text-amber-600 border-amber-200/70',
        bgDark: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      };
    case 'cat':
      return {
        Icon: Cat,
        bgLight: 'bg-orange-50 text-orange-600 border-orange-200/70',
        bgDark: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
      };
    case 'baby':
      return {
        Icon: Baby,
        bgLight: 'bg-rose-50 text-rose-500 border-rose-200/70',
        bgDark: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      };
    case 'lecture':
      return {
        Icon: BookOpen,
        bgLight: 'bg-blue-50 text-blue-600 border-blue-200/70',
        bgDark: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      };
    case 'classical':
      return {
        Icon: Music,
        bgLight: 'bg-violet-50 text-violet-600 border-violet-200/70',
        bgDark: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
      };
    case 'study':
      return {
        Icon: Code2,
        bgLight: 'bg-emerald-50 text-emerald-600 border-emerald-200/70',
        bgDark: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      };
    case 'cooking':
      return {
        Icon: ChefHat,
        bgLight: 'bg-teal-50 text-teal-600 border-teal-200/70',
        bgDark: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
      };
    case 'docu':
      return {
        Icon: Compass,
        bgLight: 'bg-sky-50 text-sky-600 border-sky-200/70',
        bgDark: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
      };
    default:
      return {
        Icon: Sparkles,
        bgLight: 'bg-indigo-50 text-indigo-600 border-indigo-200/70',
        bgDark: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
      };
  }
}

export default function AlgoWashCleanUtilityApp() {
  // Theme Mode (Default: Bright & Clean Toss/CleanMyMac Light Mode)
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Navigation & Global Modes
  const [activeTab, setActiveTab] = useState<ActiveTab>('console');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [isStealthOverlay, setIsStealthOverlay] = useState(false);
  const [stealthSkin, setStealthSkin] = useState<StealthSkin>('cs_interview');
  const [sandboxMode, setSandboxMode] = useState(true);
  const [isProPlan, setIsProPlan] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [freeCreditsLeft, setFreeCreditsLeft] = useState(2);

  // 8 Built-in + Custom Theme Presets & Video Pools
  const [themes, setThemes] = useState<ThemePresetMeta[]>(
    BUILT_IN_THEME_IDS.map((id) => THEME_PRESETS[id])
  );
  const [customPools, setCustomPools] = useState<Record<string, SeedVideoItem[]>>({});
  const [selectedIntensity, setSelectedIntensity] =
    useState<WashIntensity>('normal');
  const [selectedThemeId, setSelectedThemeId] = useState<string>('puppy');

  // Risk & Wash Execution State
  const [isCleanState, setIsCleanState] = useState(false);
  const [cleanedThemeMeta, setCleanedThemeMeta] =
    useState<ThemePresetMeta | null>(null);
  const [isWashing, setIsWashing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [streamingIndex, setStreamingIndex] = useState(0);
  const [washResult, setWashResult] = useState<BatchWashResult | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '알고리즘 정화 엔진이 준비되었습니다.',
    '8가지 테마별 청정 영상 64개가 캐시에 대기 중입니다.',
    '현재 유튜브 홈 피드 진단 결과: 주의가 필요한 영상 비중이 88%입니다.',
  ]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cooldownSec, setCooldownSec] = useState(0);

  // Rollback & Auto-Rollback Timer State
  const [transactions, setTransactions] = useState<WashTransaction[]>([]);
  const [isRollingBackId, setIsRollingBackId] = useState<string | null>(null);
  const [autoRollbackEnabled, setAutoRollbackEnabled] = useState(false);
  const [autoRollbackRemainingSec, setAutoRollbackRemainingSec] =
    useState(3600);

  // AI Custom Persona Studio State
  const [personaPrompt, setPersonaPrompt] = useState('');
  const [personaCustomName, setPersonaCustomName] = useState('');
  const [isGeneratingPersona, setIsGeneratingPersona] = useState(false);

  // Engineering Telemetry State
  const [telemetry, setTelemetry] = useState<EngineeringTelemetry>({
    cacheHits: 42,
    cacheMisses: 1,
    cacheHitRate: 97.7,
    savedSearchUnits: 1400,
    totalWashesExecuted: 0,
    totalRollbacksExecuted: 0,
    avgBatchLatencyMs: 392,
  });

  // Hydrate initial themes, custom pools & telemetry from API
  useEffect(() => {
    async function loadInitialState() {
      try {
        const res = await fetch('/api/themes');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.themes) && data.themes.length > 0) {
            setThemes(data.themes);
            const poolMap: Record<string, SeedVideoItem[]> = {};
            for (const t of data.themes) {
              if (Array.isArray(t.sampleVideos) && t.sampleVideos.length > 0) {
                poolMap[t.id] = t.sampleVideos;
              }
            }
            setCustomPools((prev) => ({ ...prev, ...poolMap }));
          }
          if (data.telemetry) {
            setTelemetry(data.telemetry);
          }
          if (Array.isArray(data.transactions) && data.transactions.length > 0) {
            setTransactions(data.transactions);
          }
        }
      } catch {
        // Keep static initial data if offline
      }
    }
    loadInitialState();
  }, []);

  // ESC shortcut for instant Stealth Camouflage Mode
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsStealthOverlay((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Cooldown countdown
  useEffect(() => {
    if (cooldownSec <= 0) return;
    const timer = setInterval(() => {
      setCooldownSec((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSec]);

  // 1-Hour Auto-Rollback Countdown Timer
  useEffect(() => {
    if (!autoRollbackEnabled) return;
    const timer = setInterval(() => {
      setAutoRollbackRemainingSec((prev) => (prev > 0 ? prev - 1 : 3600));
    }, 1000);
    return () => clearInterval(timer);
  }, [autoRollbackEnabled]);

  function appendLog(line: string) {
    const time = new Date().toTimeString().slice(0, 8);
    setTerminalLogs((prev) => [`${time} · ${line}`, ...prev].slice(0, 18));
  }

  // Selecting/previewing a theme card updates the right-side stream & mock feed immediately
  function handleSelectThemePreview(themeId: string) {
    setSelectedThemeId(themeId);
    if (washResult && washResult.themeId !== themeId) {
      setWashResult(null);
    }
  }

  async function handleEmergencyWash(themeId: string) {
    setSelectedThemeId(themeId);
    if (isWashing || cooldownSec > 0) return;

    if (!isProPlan && freeCreditsLeft <= 0) {
      setShowProModal(true);
      appendLog('오늘 제공된 무료 정화 횟수(3회)를 모두 사용했습니다.');
      return;
    }

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([30, 20, 60]);
    }

    const targetMeta =
      themes.find((t) => t.id === themeId) ?? THEME_PRESETS.puppy;
    const count = INTENSITY_META[selectedIntensity].count;

    setIsWashing(true);
    setErrorMessage(null);
    setWashResult(null);
    setProgress(20);
    setStreamingIndex(1);

    appendLog(`'${targetMeta.name}' 테마로 영상 ${count}개 동시 반영을 시작합니다.`);

    const streamTimer = setInterval(() => {
      setStreamingIndex((prev) => (prev < count ? prev + 1 : prev));
      setProgress((prev) => (prev < 92 ? prev + 14 : prev));
    }, 65);

    try {
      const response = await fetch('/api/wash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          themeId,
          intensity: selectedIntensity,
          demoMode: sandboxMode,
        }),
      });

      const data = await response.json();

      if (!response.ok && response.status !== 206) {
        if (response.status === 429 && data.retryAfterMs) {
          setCooldownSec(Math.ceil(data.retryAfterMs / 1000));
        }
        throw new Error(data.message ?? '피드 정화 요청에 실패했습니다.');
      }

      clearInterval(streamTimer);
      const result = data as BatchWashResult;
      setStreamingIndex(result.details.length);
      setProgress(100);
      setWashResult(result);
      setIsCleanState(true);
      setCleanedThemeMeta(targetMeta);
      setCooldownSec(10);

      if (!isProPlan) {
        setFreeCreditsLeft((prev) => Math.max(0, prev - 1));
      }

      const newTx: WashTransaction = {
        id: result.transactionId,
        timestamp: new Date().toISOString(),
        themeId: result.themeId,
        themeName: result.themeName,
        themeEmoji: result.themeEmoji,
        intensity: result.intensity,
        videoIds: result.details.map((d) => d.videoId),
        videos: result.details.map((d) => ({
          videoId: d.videoId,
          title: d.title,
          channelTitle: d.channelTitle,
          keyword: d.keyword,
          thumbnailUrl: d.thumbnailUrl,
          duration: d.duration,
          viewCountText: d.viewCountText,
        })),
        quotaUsedUnits: result.quotaUsedUnits,
        elapsedMs: result.elapsedMs,
        rolledBack: false,
      };

      setTransactions((prev) => [newTx, ...prev].slice(0, 20));
      setTelemetry((prev) => ({
        ...prev,
        cacheHits: prev.cacheHits + 1,
        savedSearchUnits: prev.savedSearchUnits + 200,
        totalWashesExecuted: prev.totalWashesExecuted + 1,
      }));

      appendLog(
        `완료: ${result.elapsedMs}ms 만에 '${targetMeta.name}' 영상 ${result.injectedCount}개가 반영되었습니다.`
      );
    } catch (err) {
      clearInterval(streamTimer);
      setProgress(0);
      const msg =
        err instanceof Error ? err.message : '일시적인 오류가 발생했습니다.';
      setErrorMessage(msg);
      appendLog(`오류: ${msg}`);
    } finally {
      setIsWashing(false);
    }
  }

  async function handleRollbackTransaction(tx: WashTransaction) {
    if (tx.rolledBack || isRollingBackId) return;
    setIsRollingBackId(tx.id);
    appendLog(`'${tx.themeName}' 세탁 기록을 취소하고 이전 취향으로 되돌리는 중...`);

    try {
      const res = await fetch('/api/wash/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: tx.id,
          videoIds: tx.videoIds,
          demoMode: sandboxMode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message ?? '원상복구 요청에 실패했습니다.');
      }

      setTransactions((prev) =>
        prev.map((item) =>
          item.id === tx.id
            ? {
                ...item,
                rolledBack: true,
                rolledBackAt: new Date().toISOString(),
              }
            : item
        )
      );
      setIsCleanState(false);
      setCleanedThemeMeta(null);
      setWashResult(null);
      setTelemetry((prev) => ({
        ...prev,
        totalRollbacksExecuted: prev.totalRollbacksExecuted + 1,
      }));

      appendLog(
        `복구 완료: 방금 반영했던 영상 ${data.restoredCount}개의 좋아요 기록을 모두 지웠습니다.`
      );
    } catch (err) {
      appendLog(
        `복구 실패: ${err instanceof Error ? err.message : '다시 시도해주세요.'}`
      );
    } finally {
      setIsRollingBackId(null);
    }
  }

  async function handleCreateCustomPersona(e: React.FormEvent) {
    e.preventDefault();
    if (!personaPrompt.trim() || isGeneratingPersona) return;

    setIsGeneratingPersona(true);
    appendLog(`맞춤 테마 생성 중: "${personaPrompt}"`);

    try {
      const res = await fetch('/api/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: personaPrompt,
          name: personaCustomName.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message ?? '맞춤 테마 생성에 실패했습니다.');
      }

      const created = data.persona as ThemePresetMeta & {
        sampleVideos?: SeedVideoItem[];
      };
      setThemes((prev) => [...prev, created]);
      if (Array.isArray(created.sampleVideos)) {
        setCustomPools((prev) => ({
          ...prev,
          [created.id]: created.sampleVideos!,
        }));
      }
      setSelectedThemeId(created.id);
      setPersonaPrompt('');
      setPersonaCustomName('');
      setActiveTab('console');
      appendLog(`새 맞춤 테마 '${created.name}' 카드가 추가되었습니다.`);
    } catch (err) {
      appendLog(
        `생성 실패: ${err instanceof Error ? err.message : '오류가 발생했습니다.'}`
      );
    } finally {
      setIsGeneratingPersona(false);
    }
  }

  async function handleDeleteCustomPersona(id: string) {
    try {
      const res = await fetch(`/api/personas?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setThemes((prev) => prev.filter((t) => t.id !== id));
        if (selectedThemeId === id) {
          setSelectedThemeId('puppy');
        }
        appendLog('맞춤 테마 카드를 삭제했습니다.');
      }
    } catch {
      // Ignore delete error
    }
  }

  // Filter themes by category tab
  const filteredThemes = themes.filter((t) => {
    if (categoryFilter === 'all') return true;
    if (t.isCustom) return categoryFilter === 'culture';
    return t.category === categoryFilter;
  });

  const activeSelectedThemeMeta =
    themes.find((t) => t.id === selectedThemeId) ?? THEME_PRESETS.puppy;

  // Dynamic right-side video stream & preview synced with currently selected theme
  const previewVideos: SeedVideoItem[] =
    washResult && washResult.themeId === selectedThemeId
      ? washResult.details.map((d) => ({
          videoId: d.videoId,
          title: d.title,
          channelTitle: d.channelTitle,
          keyword: d.keyword,
          thumbnailUrl: d.thumbnailUrl,
          duration: d.duration,
          viewCountText: d.viewCountText,
        }))
      : (BUILT_IN_THEME_IDS as string[]).includes(selectedThemeId)
        ? SEED_VIDEO_POOL[selectedThemeId as BuiltInThemeId]
        : (customPools[selectedThemeId] ?? SEED_VIDEO_POOL.study);

  const currentRiskBars: RiskCategoryBar[] = isCleanState
    ? (CLEAN_CATEGORIES_MAP[cleanedThemeMeta?.id ?? 'puppy'] ?? [
        {
          label: `${cleanedThemeMeta?.name ?? '맞춤 테마'} 추천 영상`,
          percent: 82,
          barClass: 'bg-emerald-500',
          textClass: 'text-emerald-600',
        },
        {
          label: '연관 교양 · 힐링 플레이리스트',
          percent: 14,
          barClass: 'bg-teal-400',
          textClass: 'text-teal-600',
        },
        {
          label: '이전 시청 기록 잔여분',
          percent: 4,
          barClass: 'bg-slate-300',
          textClass: 'text-slate-400',
        },
      ])
    : POLLUTED_CATEGORIES;

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Theme-aware surface styling classes (Toss Clean Light by default, optional Dark)
  const pageBg = isDarkMode
    ? 'bg-zinc-950 text-zinc-100'
    : 'bg-[#F4F6F9] text-slate-900';
  const headerSurface = isDarkMode
    ? 'border-zinc-800/80 bg-zinc-950/85'
    : 'border-slate-200/80 bg-white/85';
  const cardSurface = isDarkMode
    ? 'border-zinc-800 bg-zinc-900/80 shadow-none'
    : 'border-slate-200/80 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.04)]';
  const subCardSurface = isDarkMode
    ? 'border-zinc-800 bg-zinc-950/70'
    : 'border-slate-200/70 bg-slate-50/80';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-zinc-400' : 'text-slate-500';
  const textMuted = isDarkMode ? 'text-zinc-500' : 'text-slate-400';

  // ============================================================================
  // STEALTH CAMOUFLAGE OVERLAY (0.1s Instant Disguise on ESC or Button)
  // ============================================================================
  if (isStealthOverlay) {
    return (
      <div className="min-h-dvh bg-[#F8FAFC] text-slate-900 p-4 md:p-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-bold text-white">
                {stealthSkin === 'cs_interview'
                  ? '전공 면접 요약 노트'
                  : '실시간 대기환경 정보'}
              </span>
              <h1 className="text-lg font-bold text-slate-900">
                {stealthSkin === 'cs_interview'
                  ? '컴퓨터공학 핵심 개념 및 아키텍처 정리 노트'
                  : '전국 권역별 미세먼지(PM10/PM2.5) 및 기상 관측 현황'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setStealthSkin((prev) =>
                    prev === 'cs_interview' ? 'weather_center' : 'cs_interview'
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
              >
                화면 전환 ({stealthSkin === 'cs_interview' ? '날씨 상황판' : '전공 요약 노트'})
              </button>
              <button
                type="button"
                onClick={() => setIsStealthOverlay(false)}
                className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                돌아가기 (ESC)
              </button>
            </div>
          </div>

          {stealthSkin === 'cs_interview' ? (
            <div className="grid gap-4 md:grid-cols-2">
              {CS_FLASHCARDS.map((card, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2 shadow-sm"
                >
                  <span className="text-xs font-bold text-blue-600">
                    {card.category}
                  </span>
                  <h2 className="text-sm font-bold text-slate-900">Q. {card.q}</h2>
                  <p className="text-xs leading-relaxed text-slate-600">
                    {card.a}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { city: '서울특별시 중구', temp: '18.4°C', pm10: '24 좋음', pm25: '11 좋음' },
                { city: '경기도 성남시 분당구', temp: '17.9°C', pm10: '28 좋음', pm25: '13 좋음' },
                { city: '부산광역시 해운대구', temp: '20.1°C', pm10: '19 좋음', pm25: '9 좋음' },
              ].map((w, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2 shadow-sm"
                >
                  <div className="text-xs font-medium text-slate-500">{w.city}</div>
                  <div className="text-2xl font-extrabold text-blue-600">
                    {w.temp}
                  </div>
                  <div className="text-xs font-semibold text-emerald-600">
                    미세먼지 {w.pm10} · 초미세먼지 {w.pm25}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-dvh flex flex-col pb-20 lg:pb-0 transition-colors ${pageBg}`}>
      {/* =====================================================================
          TOP HEADER (Preserves Lightning Logo + Clean Toss Utility Controls)
         ===================================================================== */}
      <header className={`sticky top-0 z-30 border-b backdrop-blur-md ${headerSurface}`}>
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-6">
          {/* Preserved Top-Left AlgoWash Lightning Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-md shadow-emerald-500/20">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-base font-extrabold tracking-tight ${textPrimary}`}>
                  AlgoWash
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600">
                  알고리즘 클리너
                </span>
                {isProPlan && (
                  <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-600">
                    Pro 멤버십
                  </span>
                )}
              </div>
              <p className={`text-[11px] hidden sm:block ${textSecondary}`}>
                원터치로 내 유튜브 추천 피드를 깨끗하고 안심되는 테마로 바꿔드려요
              </p>
            </div>
          </div>

          {/* Right Utility Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Experience Sandbox Mode Toggle */}
            <button
              type="button"
              onClick={() => setSandboxMode((prev) => !prev)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                sandboxMode
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
                  : isDarkMode
                    ? 'border-zinc-800 bg-zinc-900 text-zinc-400'
                    : 'border-slate-200 bg-slate-100 text-slate-600'
              }`}
              title="로그인 없이도 모든 세탁과 복구 기능을 즉시 체험할 수 있습니다"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              <span>체험 모드 {sandboxMode ? '켜짐' : '꺼짐'}</span>
            </button>

            {/* Daily Free Credit Pill */}
            <div
              className={`hidden md:flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs ${subCardSurface}`}
            >
              <span className={textSecondary}>오늘 무료 이용권</span>
              <span className="font-bold text-emerald-600">
                {isProPlan ? '무제한' : `${freeCreditsLeft} / 3회`}
              </span>
            </div>

            {/* Pro Upgrade Button */}
            {!isProPlan && (
              <button
                type="button"
                onClick={() => setShowProModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-95"
              >
                <Crown className="h-3.5 w-3.5 text-amber-400" />
                <span>Pro 업그레이드</span>
              </button>
            )}

            {/* Stealth Camouflage Button */}
            <button
              type="button"
              onClick={() => setIsStealthOverlay(true)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                isDarkMode
                  ? 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm'
              }`}
              title="ESC 키를 누르면 즉시 전공 요약 노트 화면으로 전환됩니다"
            >
              <EyeOff className="h-3.5 w-3.5 text-slate-500" />
              <span>화면 가리기 (ESC)</span>
            </button>

            {/* Google Account Connect */}
            <a
              href="/api/auth/signin"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-emerald-500/20 transition hover:bg-emerald-600"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>구글 계정 연결</span>
            </a>

            {/* Small Light / Dark Mode Icon Button */}
            <button
              type="button"
              onClick={() => setIsDarkMode((prev) => !prev)}
              aria-label="화면 밝기 모드 전환"
              title={isDarkMode ? '밝은 화면으로 전환' : '어두운 화면으로 전환'}
              className={`flex h-8 w-8 items-center justify-center rounded-xl border transition ${
                isDarkMode
                  ? 'border-zinc-800 bg-zinc-900 text-amber-400 hover:bg-zinc-800'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 shadow-sm'
              }`}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================================
          MAIN 3-COLUMN BENTO GRID WORKSPACE
         ===================================================================== */}
      <div className="mx-auto grid w-full max-w-[1440px] flex-1 grid-cols-1 gap-5 px-4 py-5 lg:grid-cols-12 lg:px-6">
        {/* -------------------------------------------------------------------
            COLUMN 1 (Left Sidebar - lg:col-span-2): Clean Navigation & Auto-Restore
           ------------------------------------------------------------------- */}
        <aside
          className={`hidden lg:flex lg:col-span-2 flex-col justify-between rounded-3xl border p-4 ${cardSurface}`}
        >
          <div className="space-y-6">
            <div className="space-y-1.5">
              <div className={`px-2.5 text-[11px] font-bold ${textMuted}`}>
                메뉴
              </div>
              <nav className="space-y-1">
                {[
                  { id: 'console', label: '빠른 피드 정화', icon: Zap },
                  { id: 'studio', label: '맞춤 테마 만들기', icon: Sparkles },
                  {
                    id: 'rollback',
                    label: '되돌리기 기록',
                    icon: History,
                    count: transactions.filter((t) => !t.rolledBack).length,
                  },
                  { id: 'saas', label: '이용권 · 절약 리포트', icon: TrendingUp },
                  { id: 'stealth', label: '화면 가리기 설정', icon: EyeOff },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id as ActiveTab)}
                      className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-xs font-bold transition ${
                        active
                          ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25'
                          : isDarkMode
                            ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </span>
                      {typeof item.count === 'number' && item.count > 0 && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                            active
                              ? 'bg-white/25 text-white'
                              : 'bg-emerald-500/15 text-emerald-600'
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Auto-Rollback 1h Timer Card */}
            <div className={`rounded-2xl border p-3.5 space-y-2.5 ${subCardSurface}`}>
              <div className="flex items-center justify-between">
                <span className={`flex items-center gap-1.5 text-xs font-bold ${textPrimary}`}>
                  <Clock className="h-3.5 w-3.5 text-emerald-500" />
                  1시간 뒤 자동 복구
                </span>
                <button
                  type="button"
                  onClick={() => setAutoRollbackEnabled((prev) => !prev)}
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold transition ${
                    autoRollbackEnabled
                      ? 'bg-emerald-500 text-white'
                      : isDarkMode
                        ? 'bg-zinc-800 text-zinc-400'
                        : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {autoRollbackEnabled ? '켜짐' : '꺼짐'}
                </button>
              </div>
              <p className={`text-[11px] leading-relaxed ${textSecondary}`}>
                약속이 끝난 뒤 내 원래 알고리즘 취향으로 알아서 되돌려 놓아요.
              </p>
              {autoRollbackEnabled && (
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 py-1.5 text-center font-mono text-xs font-extrabold text-emerald-600">
                  {formatTimer(autoRollbackRemainingSec)} 후 자동 복구
                </div>
              )}
            </div>
          </div>

          {/* Clean Summary Metrics */}
          <div className={`rounded-2xl border p-3.5 space-y-2 ${subCardSurface}`}>
            <div className="text-[11px] font-bold text-emerald-600">
              실시간 최적화 현황
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className={textSecondary}>캐시 빠른 매칭</span>
              <span className={`font-bold ${textPrimary}`}>
                {telemetry.cacheHitRate}%
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className={textSecondary}>아낀 일일 쿼터</span>
              <span className="font-bold text-emerald-600">
                {telemetry.savedSearchUnits.toLocaleString()}p
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className={textSecondary}>평균 반영 속도</span>
              <span className={`font-bold ${textPrimary}`}>
                {(telemetry.avgBatchLatencyMs / 1000).toFixed(2)}초
              </span>
            </div>
          </div>
        </aside>

        {/* -------------------------------------------------------------------
            COLUMN 2 (Center Workspace - lg:col-span-6): Main Utility Views
           ------------------------------------------------------------------- */}
        <main className="lg:col-span-6 flex flex-col gap-5">
          {/* =================================================================
              SECTION 1: FEED SAFETY DIAGNOSTIC CARD (Clean Toss Gauge)
             ================================================================= */}
          <section className={`rounded-3xl border p-5 ${cardSurface}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                {isCleanState ? (
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 border border-rose-200 text-rose-500">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${textSecondary}`}>
                      내 유튜브 피드 안심 진단
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        isCleanState
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : 'bg-rose-50 text-rose-600 border border-rose-200'
                      }`}
                    >
                      {isCleanState ? '안심 지수 96%' : '노출 주의 88%'}
                    </span>
                  </div>
                  <h2 className={`mt-0.5 text-base font-extrabold ${textPrimary}`}>
                    {isCleanState
                      ? `피드가 '${cleanedThemeMeta?.name}' 테마로 깨끗하게 정돈되었어요`
                      : '지금 화면을 공유하면 민망할 수 있는 영상이 88%예요'}
                  </h2>
                </div>
              </div>

              {isCleanState && (
                <button
                  type="button"
                  onClick={() => {
                    const latestActiveTx = transactions.find((t) => !t.rolledBack);
                    if (latestActiveTx) {
                      handleRollbackTransaction(latestActiveTx);
                    } else {
                      setIsCleanState(false);
                    }
                  }}
                  className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-95"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>원래 내 취향으로 되돌리기</span>
                </button>
              )}
            </div>

            {/* Clean Progress Bars */}
            <div className="mt-4 space-y-2.5">
              {currentRiskBars.map((bar, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-medium ${textSecondary}`}>{bar.label}</span>
                    <span className={`font-bold ${bar.textClass}`}>
                      {bar.percent}%
                    </span>
                  </div>
                  <div
                    className={`h-2 w-full overflow-hidden rounded-full ${
                      isDarkMode ? 'bg-zinc-800' : 'bg-slate-100'
                    }`}
                  >
                    <div
                      className={`h-full rounded-full ${bar.barClass} transition-all duration-500`}
                      style={{ width: `${bar.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* =================================================================
              VIEW 1: QUICK FEED CLEANER CONSOLE (8 Presets + Category Filter)
             ================================================================= */}
          {activeTab === 'console' && (
            <>
              {/* Wash Intensity Selector */}
              <section className={`rounded-3xl border p-4 space-y-3 ${cardSurface}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${textPrimary}`}>
                    정화 강도 선택
                  </span>
                  <span className="text-xs font-semibold text-emerald-600">
                    선택한 테마 영상을 한 번에 {INTENSITY_VIDEO_COUNT[selectedIntensity]}개씩 반영해요
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['light', 'normal', 'max'] as WashIntensity[]).map((level) => {
                    const active = selectedIntensity === level;
                    const meta = INTENSITY_META[level];
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setSelectedIntensity(level)}
                        className={`rounded-2xl border p-3 text-left transition ${
                          active
                            ? 'border-emerald-500 bg-emerald-500/10 shadow-sm'
                            : `${subCardSurface} hover:border-slate-300`
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-xs font-extrabold ${textPrimary}`}>
                            {meta.label}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              active
                                ? 'bg-emerald-500 text-white'
                                : isDarkMode
                                  ? 'bg-zinc-800 text-zinc-400'
                                  : 'bg-slate-200/80 text-slate-600'
                            }`}
                          >
                            {meta.badge}
                          </span>
                        </div>
                        <p className={`mt-1 text-[11px] ${textSecondary}`}>
                          {meta.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* 8 Theme Presets with Category Filter Tabs & 2-Column Grid */}
              <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <div>
                    <h3 className={`text-sm font-extrabold ${textPrimary}`}>
                      원터치 안심 테마 선택 ({filteredThemes.length}개)
                    </h3>
                    <p className={`text-[11px] ${textSecondary}`}>
                      카드를 누르면 우측 화면에서 예상 유튜브 피드를 미리 볼 수 있어요
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('studio')}
                    className="flex items-center gap-1 rounded-xl bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-600 transition hover:bg-emerald-500/20"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>나만의 테마 만들기</span>
                  </button>
                </div>

                {/* Category Filter Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORY_TABS.map((tab) => {
                    const active = categoryFilter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setCategoryFilter(tab.id)}
                        className={`rounded-2xl px-3.5 py-1.5 text-xs font-bold transition ${
                          active
                            ? 'bg-slate-900 text-white shadow-sm'
                            : isDarkMode
                              ? 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                              : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* 2-Column Preset Card Grid */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {filteredThemes.map((theme) => {
                    const isSelected = selectedThemeId === theme.id;
                    const isCurrentWashing =
                      isWashing && selectedThemeId === theme.id;
                    const { Icon, bgLight, bgDark } = getThemeIconComponent(
                      theme.id
                    );

                    return (
                      <div
                        key={theme.id}
                        onClick={() => handleSelectThemePreview(theme.id)}
                        className={`group relative flex cursor-pointer flex-col justify-between rounded-3xl border p-4 transition-all ${
                          isSelected
                            ? 'border-emerald-500 ring-2 ring-emerald-500/15 bg-white shadow-md'
                            : `${cardSurface} hover:border-slate-300`
                        } ${isDarkMode && isSelected ? '!bg-zinc-900' : ''}`}
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3">
                              {/* Soft Pastel Vector Icon Circle */}
                              <div
                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
                                  isDarkMode ? bgDark : bgLight
                                }`}
                              >
                                <Icon className="h-5 w-5" />
                              </div>
                              <div>
                                <h4 className={`text-sm font-extrabold ${textPrimary}`}>
                                  {theme.name}
                                </h4>
                                <span className="mt-0.5 inline-block rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                                  {theme.badgeText}
                                </span>
                              </div>
                            </div>

                            {theme.isCustom && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCustomPersona(theme.id);
                                }}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                                title="맞춤 테마 삭제"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>

                          <p className={`text-xs leading-relaxed line-clamp-2 ${textSecondary}`}>
                            {theme.tagline}
                          </p>

                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {theme.defaultSearchKeywords.slice(0, 3).map((kw, i) => (
                              <span
                                key={i}
                                className={`rounded-lg px-2 py-0.5 text-[10px] font-medium ${
                                  isDarkMode
                                    ? 'bg-zinc-800 text-zinc-300'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                #{kw}
                              </span>
                            ))}
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isWashing || cooldownSec > 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEmergencyWash(theme.id);
                          }}
                          className={`mt-4 flex w-full items-center justify-center gap-1.5 rounded-2xl py-2.5 text-xs font-extrabold transition active:scale-[0.98] disabled:opacity-50 ${
                            isSelected
                              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25 hover:bg-emerald-600'
                              : isDarkMode
                                ? 'bg-zinc-800 text-zinc-100 hover:bg-emerald-500 hover:text-white'
                                : 'bg-slate-900 text-white hover:bg-emerald-500'
                          }`}
                        >
                          <Zap className="h-3.5 w-3.5 fill-current" />
                          <span>
                            {isCurrentWashing
                              ? `정화 진행 중 (${progress}%)`
                              : cooldownSec > 0
                                ? `${cooldownSec}초 후 다시 실행 가능`
                                : '이 테마로 바로 덮어쓰기'}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}

          {/* =================================================================
              VIEW 2: AI CUSTOM THEME STUDIO
             ================================================================= */}
          {activeTab === 'studio' && (
            <section className={`rounded-3xl border p-5 space-y-5 ${cardSurface}`}>
              <div>
                <span className="text-xs font-bold text-emerald-600">
                  AI 맞춤 테마 설계
                </span>
                <h3 className={`mt-0.5 text-lg font-extrabold ${textPrimary}`}>
                  나만의 상황별 세탁 스위치 만들기
                </h3>
                <p className={`mt-1 text-xs ${textSecondary}`}>
                  누구에게 화면을 보여줘야 하는지 적어주시면, 그 상황에 딱 맞는 추천 검색어와 청정 영상 목록을 자동으로 구성해 드려요.
                </p>
              </div>

              <div className="space-y-2">
                <span className={`text-xs font-bold ${textSecondary}`}>
                  자주 찾는 상황 예시 (누르면 바로 입력돼요)
                </span>
                <div className="flex flex-wrap gap-2">
                  {QUICK_PERSONA_PROMPTS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPersonaPrompt(sample)}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition hover:border-emerald-500 hover:text-emerald-600 ${subCardSurface}`}
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleCreateCustomPersona} className="space-y-3.5">
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${textPrimary}`}>
                    테마 이름 (선택)
                  </label>
                  <input
                    type="text"
                    value={personaCustomName}
                    onChange={(e) => setPersonaCustomName(e.target.value)}
                    placeholder="예: 명절 친척 모임 안심 모드 / 다정한 홈카페 요리"
                    className={`w-full rounded-2xl border px-3.5 py-2.5 text-xs focus:border-emerald-500 focus:outline-none ${subCardSurface} ${textPrimary}`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${textPrimary}`}>
                    어떤 관심사로 피드를 채우고 싶나요? (필수)
                  </label>
                  <textarea
                    rows={3}
                    value={personaPrompt}
                    onChange={(e) => setPersonaPrompt(e.target.value)}
                    placeholder="예: 부모님께 보여드려도 안심할 수 있도록 재테크, 클래식, 세계 자연 다큐멘터리 위주로 구성해줘"
                    className={`w-full rounded-2xl border p-3.5 text-xs focus:border-emerald-500 focus:outline-none ${subCardSurface} ${textPrimary}`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isGeneratingPersona || !personaPrompt.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3 text-xs font-extrabold text-white shadow-sm shadow-emerald-500/20 transition hover:bg-emerald-600 disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>
                    {isGeneratingPersona
                      ? '맞춤 영상 목록을 구성하고 있어요...'
                      : '맞춤 세탁 스위치 추가하기'}
                  </span>
                </button>
              </form>
            </section>
          )}

          {/* =================================================================
              VIEW 3: ROLLBACK & RESTORE HISTORY
             ================================================================= */}
          {activeTab === 'rollback' && (
            <section className={`rounded-3xl border p-5 space-y-4 ${cardSurface}`}>
              <div>
                <span className="text-xs font-bold text-emerald-600">
                  원클릭 취향 복원
                </span>
                <h3 className={`mt-0.5 text-lg font-extrabold ${textPrimary}`}>
                  세탁 기록 및 원래 알고리즘 되돌리기
                </h3>
                <p className={`mt-1 text-xs ${textSecondary}`}>
                  급한 상황이 지나갔다면 방금 반영했던 영상들의 좋아요 표시를 한 번에 취소해 원래 내 유튜브 취향으로 되돌릴 수 있어요.
                </p>
              </div>

              {transactions.length === 0 ? (
                <div className={`rounded-2xl border border-dashed p-8 text-center space-y-2 ${subCardSurface}`}>
                  <History className={`mx-auto h-8 w-8 ${textMuted}`} />
                  <p className={`text-xs font-bold ${textPrimary}`}>
                    아직 실행한 피드 정화 기록이 없어요
                  </p>
                  <p className={`text-[11px] ${textSecondary}`}>
                    테마 카드를 눌러 피드를 정화하면 이곳에 시간별 복구 스냅샷이 자동으로 저장됩니다.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => {
                    const { Icon, bgLight, bgDark } = getThemeIconComponent(
                      tx.themeId
                    );
                    return (
                      <div
                        key={tx.id}
                        className={`rounded-2xl border p-4 space-y-3 ${subCardSurface}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${
                                isDarkMode ? bgDark : bgLight
                              }`}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <span className={`text-sm font-extrabold ${textPrimary}`}>
                                {tx.themeName}
                              </span>
                              <p className={`text-[11px] ${textSecondary}`}>
                                {new Date(tx.timestamp).toLocaleTimeString('ko-KR')} 실행 · 영상{' '}
                                {tx.videoIds.length}개 반영 · {(tx.elapsedMs / 1000).toFixed(2)}초 소요
                              </p>
                            </div>
                          </div>

                          {tx.rolledBack ? (
                            <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-500">
                              복구 완료됨
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={isRollingBackId === tx.id}
                              onClick={() => handleRollbackTransaction(tx)}
                              className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span>
                                {isRollingBackId === tx.id
                                  ? '되돌리는 중...'
                                  : '원래 상태로 되돌리기'}
                              </span>
                            </button>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {tx.videos.map((v) => (
                            <span
                              key={v.videoId}
                              className={`rounded-lg border px-2.5 py-1 text-[11px] ${
                                isDarkMode
                                  ? 'border-zinc-800 bg-zinc-900 text-zinc-300'
                                  : 'border-slate-200 bg-white text-slate-600'
                              }`}
                            >
                              {v.title.slice(0, 24)}...
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* =================================================================
              VIEW 4: PRO PLAN & QUOTA REPORT
             ================================================================= */}
          {activeTab === 'saas' && (
            <section className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className={`rounded-3xl border p-4 space-y-1 ${cardSurface}`}>
                  <div className={`flex items-center justify-between text-xs ${textSecondary}`}>
                    <span>캐시 즉시 매칭률</span>
                    <Database className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-600">
                    {telemetry.cacheHitRate}%
                  </div>
                  <p className={`text-[11px] ${textSecondary}`}>
                    실시간 검색 지연 없이 즉시 반영
                  </p>
                </div>

                <div className={`rounded-3xl border p-4 space-y-1 ${cardSurface}`}>
                  <div className={`flex items-center justify-between text-xs ${textSecondary}`}>
                    <span>절약한 API 포인트</span>
                    <ShieldCheck className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-extrabold text-blue-600">
                    {telemetry.savedSearchUnits.toLocaleString()}p
                  </div>
                  <p className={`text-[11px] ${textSecondary}`}>
                    사전 검증된 영상 풀로 쿼터 보호
                  </p>
                </div>

                <div className={`rounded-3xl border p-4 space-y-1 ${cardSurface}`}>
                  <div className={`flex items-center justify-between text-xs ${textSecondary}`}>
                    <span>평균 정화 소요 시간</span>
                    <Activity className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className={`text-2xl font-extrabold ${textPrimary}`}>
                    {(telemetry.avgBatchLatencyMs / 1000).toFixed(2)}초
                  </div>
                  <p className={`text-[11px] ${textSecondary}`}>
                    비동기 동시 처리로 대기 시간 단축
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className={`rounded-3xl border p-5 space-y-3 ${cardSurface}`}>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                    기본 플랜
                  </span>
                  <div className={`text-xl font-extrabold ${textPrimary}`}>
                    무료 <span className={`text-xs font-normal ${textSecondary}`}>/ 매일 3회</span>
                  </div>
                  <ul className={`space-y-2 text-xs ${textSecondary}`}>
                    <li>· 하루 3회 빠른 피드 정화 제공</li>
                    <li>· 8가지 기본 안심 테마 전체 이용</li>
                    <li>· 언제든 원래 취향으로 수동 복구</li>
                  </ul>
                </div>

                <div className="rounded-3xl border border-emerald-500 bg-gradient-to-br from-emerald-50/90 to-teal-50/60 p-5 space-y-3 shadow-sm">
                  <span className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-[11px] font-bold text-white">
                    Pro 멤버십
                  </span>
                  <div className="text-xl font-extrabold text-slate-900">
                    월 2,900원 <span className="text-xs font-normal text-emerald-700">/ 무제한</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-700">
                    <li>· 일일 횟수 제한 없는 무제한 즉시 정화</li>
                    <li>· 나만의 AI 맞춤 테마 무제한 추가</li>
                    <li>· 1시간 뒤 자동 복구 타이머 및 화면 가리기</li>
                  </ul>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProPlan(true);
                      appendLog('Pro 멤버십 혜택이 활성화되었습니다.');
                    }}
                    className="w-full rounded-2xl bg-emerald-500 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-emerald-600"
                  >
                    {isProPlan ? '현재 Pro 멤버십 이용 중' : '무료로 Pro 혜택 체험하기'}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* =================================================================
              VIEW 5: STEALTH SCREEN DISGUISE SETTINGS
             ================================================================= */}
          {activeTab === 'stealth' && (
            <section className={`rounded-3xl border p-5 space-y-4 ${cardSurface}`}>
              <div>
                <span className="text-xs font-bold text-emerald-600">
                  프라이버시 보호
                </span>
                <h3 className={`mt-0.5 text-lg font-extrabold ${textPrimary}`}>
                  급할 때 화면 가리기 (단축키 ESC)
                </h3>
                <p className={`mt-1 text-xs ${textSecondary}`}>
                  이 웹앱을 켜둔 채로 누군가 다가올 때, 키보드 ESC 키나 상단 버튼을 누르면 즉시 자연스러운 학습·정보 화면으로 바뀝니다.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setStealthSkin('cs_interview');
                    setIsStealthOverlay(true);
                  }}
                  className={`rounded-2xl border p-4 text-left transition hover:border-emerald-500 ${subCardSurface}`}
                >
                  <div className={`text-sm font-extrabold ${textPrimary}`}>
                    전공 면접 핵심 요약 노트로 가리기
                  </div>
                  <p className={`mt-1 text-xs ${textSecondary}`}>
                    운영체제, 네트워크, 데이터베이스 질문과 해설이 정리된 공부 화면으로 전환해요.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStealthSkin('weather_center');
                    setIsStealthOverlay(true);
                  }}
                  className={`rounded-2xl border p-4 text-left transition hover:border-emerald-500 ${subCardSurface}`}
                >
                  <div className={`text-sm font-extrabold ${textPrimary}`}>
                    실시간 미세먼지 · 기상 상황판으로 가리기
                  </div>
                  <p className={`mt-1 text-xs ${textSecondary}`}>
                    주요 도시 기온과 미세먼지 농도를 확인하는 깔끔한 날씨 화면으로 전환해요.
                  </p>
                </button>
              </div>
            </section>
          )}
        </main>

        {/* -------------------------------------------------------------------
            COLUMN 3 (Right Live Inspector - lg:col-span-4):
            Synced Theme Video Stream + Expected YouTube Home Feed + Activity Log
           ------------------------------------------------------------------- */}
        <aside className="lg:col-span-4 flex flex-col gap-5">
          {/* 1. Selected Theme Target Video Stream */}
          <section className={`rounded-3xl border p-4 space-y-3 ${cardSurface}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-500" />
                <span className={`text-xs font-extrabold ${textPrimary}`}>
                  {activeSelectedThemeMeta.name} 반영 영상 목록
                </span>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600">
                {washResult && washResult.themeId === selectedThemeId
                  ? `${(washResult.elapsedMs / 1000).toFixed(2)}초 만에 완료`
                  : `${INTENSITY_META[selectedIntensity].count}개 대기 중`}
              </span>
            </div>

            {isWashing && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold text-emerald-600">
                  <span>선택한 테마 영상을 계정에 반영하고 있어요...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Video Thumbnail Stream List */}
            <div className="space-y-2 max-h-[268px] overflow-y-auto pr-1">
              {previewVideos
                .slice(0, INTENSITY_META[selectedIntensity].count)
                .map((vid, idx) => {
                  const isInjected =
                    (Boolean(washResult) &&
                      washResult?.themeId === selectedThemeId) ||
                    (isWashing && idx < streamingIndex);
                  return (
                    <div
                      key={vid.videoId}
                      className={`flex items-center gap-2.5 rounded-2xl border p-2 transition ${
                        isInjected
                          ? 'border-emerald-500/40 bg-emerald-50/60'
                          : subCardSurface
                      } ${isDarkMode && isInjected ? '!bg-emerald-950/25' : ''}`}
                    >
                      <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-200">
                        {vid.thumbnailUrl && (
                          <img
                            src={vid.thumbnailUrl}
                            alt={vid.title}
                            className="h-full w-full object-cover"
                          />
                        )}
                        <span className="absolute bottom-0.5 right-1 rounded bg-black/75 px-1 text-[9px] font-mono text-white">
                          {vid.duration ?? '10:24'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-xs font-bold ${textPrimary}`}>
                          {vid.title}
                        </p>
                        <p className={`truncate text-[10px] ${textSecondary}`}>
                          {vid.channelTitle} · #{vid.keyword}
                        </p>
                      </div>
                      <div className="shrink-0">
                        {isInjected ? (
                          <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-500 px-2 py-1 text-[10px] font-bold text-white">
                            <Check className="h-3 w-3" />
                            반영됨
                          </span>
                        ) : (
                          <span
                            className={`rounded-xl px-2 py-1 text-[10px] font-semibold ${
                              isDarkMode
                                ? 'bg-zinc-800 text-zinc-400'
                                : 'bg-slate-200/70 text-slate-500'
                            }`}
                          >
                            준비됨
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* DeepLink Action Bar */}
            {washResult && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={washResult.deepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-600"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  유튜브 앱 열기
                </a>
                <a
                  href={washResult.searchDeepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold ${subCardSurface} ${textPrimary}`}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  정화된 피드 보기
                </a>
              </div>
            )}
          </section>

          {/* 2. Expected YouTube Home Feed Preview (Synced with Selected Theme) */}
          <section className={`rounded-3xl border p-4 space-y-3 ${cardSurface}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-extrabold ${textPrimary}`}>
                예상 유튜브 홈 피드 미리보기
              </span>
              <span className="text-[11px] text-emerald-600 font-bold">
                {activeSelectedThemeMeta.name} 기준
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {previewVideos.slice(0, 4).map((video) => (
                <div
                  key={`preview_${video.videoId}`}
                  className={`overflow-hidden rounded-2xl border ${subCardSurface}`}
                >
                  <div className="relative aspect-video w-full bg-slate-200">
                    {video.thumbnailUrl && (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="h-full w-full object-cover"
                      />
                    )}
                    <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1 text-[9px] text-white">
                      {video.duration ?? '12:10'}
                    </span>
                  </div>
                  <div className="p-2.5 space-y-0.5">
                    <p
                      className={`line-clamp-2 text-[11px] font-bold leading-snug ${textPrimary}`}
                    >
                      {video.title}
                    </p>
                    <p className={`truncate text-[10px] ${textSecondary}`}>
                      {video.channelTitle}
                    </p>
                    <p className={`text-[9px] ${textMuted}`}>
                      {video.viewCountText ?? '조회수 52만회 · 2일 전'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Real-time Activity Status Log */}
          <section className={`rounded-3xl border p-4 space-y-2 ${cardSurface}`}>
            <div className="flex items-center justify-between">
              <span className={`flex items-center gap-1.5 text-xs font-bold ${textPrimary}`}>
                <Terminal className="h-3.5 w-3.5 text-emerald-500" />
                실시간 처리 내역
              </span>
              <span className={`text-[10px] ${textMuted}`}>자동 기록</span>
            </div>
            <div className={`h-28 overflow-y-auto text-[11px] leading-relaxed space-y-1.5 ${textSecondary}`}>
              {terminalLogs.map((log, index) => (
                <div
                  key={index}
                  className={
                    index === 0
                      ? 'text-emerald-600 font-bold'
                      : textSecondary
                  }
                >
                  {log}
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {/* =====================================================================
          MOBILE BOTTOM FIXED NAVIGATION BAR (< lg)
         ===================================================================== */}
      <nav
        className={`fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t px-2 py-2 backdrop-blur lg:hidden ${headerSurface}`}
      >
        {[
          { id: 'console', label: '피드정화', icon: Zap },
          { id: 'studio', label: '맞춤테마', icon: Sparkles },
          { id: 'rollback', label: '되돌리기', icon: History },
          { id: 'saas', label: '이용권', icon: Crown },
          { id: 'stealth', label: '화면가리기', icon: EyeOff },
        ].map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id as ActiveTab)}
              className={`flex flex-col items-center gap-1 rounded-xl px-3 py-1 text-[10px] font-bold ${
                active ? 'text-emerald-600' : textSecondary
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* =====================================================================
          PRO UPGRADE MODAL (Clean Toss Style)
         ===================================================================== */}
      {showProModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600">
                AlgoWash Pro 멤버십
              </span>
              <button
                type="button"
                onClick={() => setShowProModal(false)}
                className="text-xs font-semibold text-slate-400 hover:text-slate-700"
              >
                닫기 ✕
              </button>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">
              급한 순간, 횟수 제한 없이 바로 정화하세요
            </h3>
            <p className="text-xs leading-relaxed text-slate-600">
              월 2,900원으로 하루 횟수 제한 없이 모든 테마를 즉시 반영하고, 나만의 맞춤 테마 무제한 생성과 1시간 뒤 자동 복구 타이머를 이용할 수 있어요.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsProPlan(true);
                  setShowProModal(false);
                  appendLog('Pro 멤버십 무료 체험이 시작되었습니다.');
                }}
                className="flex-1 rounded-2xl bg-emerald-500 py-3 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-600"
              >
                무료 체험으로 바로 시작하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
