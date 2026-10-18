# 🤖 AGENTS.md (AlgoWash Harness Entrypoint & Guardrails)

> **목적**: 에이전트의 컨텍스트 부패(Context Rot)를 방지하고, 모든 루프 실행 시 단일 진입점(Map) 역할을 수행한다. (100줄 이내 엄수)

## 1. 프로젝트 핵심 요약 (`AlgoWash`)
- **정의**: 비상 상황 시 원터치로 사용자의 실제 유튜브 계정 추천 알고리즘을 10~20초 내에 무해한 테마(`🐶 강아지`, `👶 아기`, `📚 갓생`)로 덮어쓰는 **모바일 퍼스트 서버리스 PWA 웹앱**.
- **핵심 메커니즘**: Google OAuth 2.0 공식 위임 ➔ 캐싱된 테마별 청정 영상 ID 풀 조회(미스 시 Gemini 큐레이션) ➔ 서버리스 비동기 병렬 처리로 `videos.rate(like)` 및 재생목록 추가 신호 주입(Recency 가중치 강제 덮어쓰기).

## 2. 핵심 문서 지도 (Harness Map)
매 루프 시작 전 반드시 아래 문서를 참조하여 정합성을 유지한다:
- `AGENTS.md`: 에이전트 절대 규칙, 디렉토리 구조, 명령어, 보안/쿼터 가드레일 (현재 문서)
- `SPEC.md`: 유저 시나리오, 3대 테마 프리셋, API 명세 및 예외(쿼터/토큰) 핸들링
- `ARCHITECTURE.md`: 서버리스 PWA 데이터 흐름도(Mermaid) 및 0.5초 응답 비동기 배치 구조
- `LOOPS.md`: `Planner -> Generator -> Evaluator` 루프 규약, DoD(완료 조건), 3-Strike 롤백 규칙
- `PLAN.md` & `PROGRESS.md`: 마이크로 스텝(Phase 1~5) 체크리스트 및 루프 실행 상태 저장소

## 3. 표준 디렉토리 구조 (Next.js App Router Serverless)
```text
├── public/                 # PWA manifest.json, 아이콘, 정적 에셋
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts  # Google OAuth 2.0 핸들러
│   │   │   ├── wash/route.ts                # 원클릭 알고리즘 세탁 트리거 API
│   │   │   ├── themes/route.ts              # 테마별 캐시 풀 조회/갱신 API
│   │   │   └── health/route.ts              # 하네스 헬스체크 API
│   │   ├── layout.tsx                       # PWA 메타데이터 및 모바일 뷰포트 고정
│   │   └── page.tsx                         # 모바일 원터치 비상 스위치 대시보드
│   ├── lib/
│   │   ├── auth.ts         # Auth.js 설정 및 OAuth 토큰 자동 갱신(Refresh) 로직
│   │   ├── youtube.ts      # YouTube Data API v3 래퍼 (배치 신호 주입 및 쿼터 가드)
│   │   ├── gemini.ts       # Gemini Flash 기반 테마별 청정 영상/키워드 큐레이터
│   │   └── cache.ts        # Vercel KV / Supabase / In-Memory 폴백 캐시 레이어
│   └── types/              # Zod 스키마 및 전역 TypeScript 타입 정의
└── tests/                  # Vitest 단위/통합 테스트 하네스 (MSW/Mock 포함)
```

## 4. 하네스 실행 명령어 (Single-Command Gates)
- **개발 서버**: `npm run dev`
- **타입 검사**: `npm run typecheck` (`tsc --noEmit`)
- **린트 검사**: `npm run lint`
- **단위/통합 테스트**: `npm run test:run` (`vitest run`)
- **프로덕션 빌드**: `npm run build`
- **통합 하네스 검증**: `npm run harness:check` (`typecheck && lint && test:run && build`)

## 5. 🛡️ 보안 및 쿼터 절대 가드레일 (Strict Guardrails)
1. **시크릿 노출 절대 금지**: `.env.local` 외에 코드, 테스트, 마크다운 어디에도 `GOOGLE_CLIENT_SECRET`, `GEMINI_API_KEY`, `NEXTAUTH_SECRET` 등 실제 키를 하드코딩하지 않는다.
2. **OAuth 토큰 보안**: 사용자의 Access/Refresh Token은 서버 사이드 암호화 세션(JWE/HTTP-Only Cookie)으로만 다루며, 클라이언트 브라우저 로컬 스토리지에 평문 노출을 금지한다.
3. **YouTube API 쿼터 방어 (일일 10,000 unit 엄수)**:
   - 비용이 높은 `search.list` (**100 units/회**)를 사용자 세탁 버튼 클릭 시마다 실시간 호출하는 것을 **절대 금지**한다.
   - 반드시 **캐시 레이어(`lib/cache.ts`)의 검증된 영상 ID 풀을 1순위로 조회**하며, 세탁 실행 시에는 `videos.rate` (**50 units/회**) 및 `playlistItems.insert` (**50 units/회**)만 제한된 개수(1회 세탁당 5~8개)로 병렬 호출한다.
4. **비공식 매크로/크롤링 금지**: 계정 정지 위험이 있는 Puppeteer/Playwright 자동 로그인, DOM 스크래핑, 비공식 API 사용을 전면 금지하며 **100% 공식 Google OAuth 2.0 및 YouTube Data API v3**만 사용한다.
