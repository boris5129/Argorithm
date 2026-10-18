# 🗺️ PLAN.md (AlgoWash v2.0 Micro-Step Implementation Roadmap)

> **문서 목적 (v2.0)**: MVP(Phase 1~5 완료) 위에 **완성형 풀스택 SaaS 3단 Bento 대시보드 및 6대 고도화 기능**을 구축하기 위한 Phase 2(v2.0 Upgrade) 마이크로 스텝 로드맵이다.

---

## [완료] v1.0 Baseline (Phase 1 ~ Phase 5)
- [x] Next.js 15 + TS + Tailwind + Vitest 하네스, Google OAuth Silent Refresh, 기본 3종 시드 풀, 병렬 `videos.rate` 주입 엔진 구축 완료.

---

## 🚀 v2.0 Full-Stack SaaS & Hybrid Bento Upgrade Loop

### Step 1: 하네스 문서 v2.0 업데이트 및 체크리스트 재구성
- **Step 1.1**: `SPEC.md`, `ARCHITECTURE.md`, `LOOPS.md`, `PLAN.md`, `PROGRESS.md`를 v2.0 풀스택 SaaS 대시보드 명세로 업데이트.

### Step 2: 도메인 스키마 확장, 트랜잭션/텔레메트리 캐시 스토어 & 롤백/페르소나 백엔드 API 구축
- **Step 2.1**: `src/types/theme.ts` 및 `src/lib/seed-videos.ts` 확장 — 실제 유튜브 고화질 썸네일 URL/채널 메타데이터 보강, 트랜잭션 스냅샷 타입(`WashTransaction`), 커스텀 페르소나 타입(`CustomPersona`), 위험도 진단 데이터 및 엔지니어링 텔레메트리 타입 정의.
- **Step 2.2**: `src/lib/cache.ts` 고도화 — 세탁 트랜잭션 히스토리 저장/롤백 상태 관리, 커스텀 페르소나 인메모리+시드 CRUD 저장소, 캐시 적중률(`cacheHitRate`) 및 절약 쿼터(`savedSearchUnits`) 실시간 집계기 구현.
- **Step 2.3**: 원클릭 롤백 엔진(`executeBatchRollback` in `src/lib/youtube.ts` & `POST /api/wash/rollback/route.ts`) 구현 — 주입했던 영상 ID 리스트에 `videos.rate(rating='none')` 병렬 전송.
- **Step 2.4**: AI 커스텀 페르소나 스튜디오 API(`GET/POST/DELETE /api/personas/route.ts`) 및 `src/lib/gemini.ts` 상황별 커스텀 페르소나 생성기 구현 + v2.0 통합 테스트(`tests/v2-saas.test.ts`) 작성.

### Step 3 ~ Step 5: 데스크톱 3단 Bento Grid & 모바일 5탭 풀스택 SaaS 대시보드 UI 통합 구현
- **Step 3**:
  - `src/app/layout.tsx` 컨테이너 확장(데스크톱 풀 와이드 Bento Grid + 모바일 풀스크린 하이브리드 대응).
  - 상단 SaaS 상태 헤더(남은 무료 세탁 크레딧 `3/3` 게이지, `[⚡ Pro 업그레이드]` 버튼, `[🧪 시연 모드(Sandbox)]` 스위치, `[🕵️ 화면 위장 (ESC)]` 패닉 버튼).
  - 알고리즘 검열 위험도 진단기(`88% 위험` ➔ `96% 안전` 드라마틱 전환 차트) 및 실시간 영상 썸네일 스트리밍 프리뷰 + 라이브 로그 터미널 + 예상 유튜브 홈 피드 미리보기(Mock YouTube Feed Preview) 구현.
- **Step 4**:
  - `🔄 복구 & 타임머신` 뷰 및 우측 퀵 롤백 센터 연결 — 세탁 트랜잭션 스냅샷 리스트, `[🔄 상황 종료: 원래 알고리즘으로 복구]` 원클릭 실행, `1시간 뒤 자동 롤백 타이머` 카운트다운 스위치 구현.
- **Step 5**:
  - `✨ AI 페르소나 스튜디오` 뷰(상황 입력 프롬프트 추천 칩, Gemini 커스텀 스위치 생성/즉시 실행/삭제 CRUD).
  - `💎 Pro 멤버십 & 쿼터 통계` 뷰 및 업그레이드 비교 모달(Free vs 월 2,900원 Pro 데모 결제 전환, 캐시 적중률·절약 쿼터·평균 병렬 레이턴시 엔지니어링 지표 카드).
  - `🕵️ 스텔스 위장 화면`(단축키 `ESC` 또는 패닉 버튼 클릭 시 0.1초 만에 'CS 전공 면접 핵심 단어장' / '실시간 대기환경 기상청 종합 상황실' 화면으로 전환).

### Step 6: 통합 하네스 검증 (Evaluator) 및 최종 상태 기록
- **Step 6.1**: `npm run typecheck`, `npm run test:run`, `npm run build` 전체 실행 및 `PROGRESS.md` 완료 상태 기록.
