# 🔄 LOOPS.md (Autonomous Loop Engineering Protocol v2.0)

> **문서 목적 (v2.0)**: `AlgoWash v2.0 (풀스택 SaaS 대시보드 & 하이브리드 PWA)` 업그레이드 루프에서 에이전트가 준수할 역할 분리, 완료 계약 조건(DoD), 실패 복구 규칙을 정의한다.

---

## 1. 3단계 에이전트 역할 분리 (Planner ➔ Generator ➔ Evaluator)

1. **🧠 Planner (계획자)**: `PLAN.md`의 v2.0 Micro-step(Step 1 ~ Step 6) 중 현재 스텝의 입출력 스키마와 컴포넌트 책임을 정의하고 `PROGRESS.md`를 갱신한다.
2. **⚡ Generator (구현자)**: `AGENTS.md`의 보안/쿼터 가드레일을 준수하며 TypeScript Strict Mode(`strict: true`, `any` 금지)로 백엔드 API, 캐시 스토어, 3단 Bento UI 및 테스트 코드를 구현한다.
3. **🔍 Evaluator (검증자)**: `npm run typecheck`, `npm run test:run`, `npm run build`를 직접 실행하여 모든 게이트가 통과하는지 확인한다.

---

## 2. v2.0 완료 계약 조건 (Definition of Done - DoD)

1. **Type-Safety & Build Gate (`PASS`)**: `tsc --noEmit` 에러 0건 및 `next build` 프로덕션 빌드 성공.
2. **v2.0 Feature Verification Gate (`PASS`)**:
   - 데스크톱 3단 Bento Grid(`lg:grid-cols-12`) 및 모바일 하단 5탭 네비게이션 동작.
   - 알고리즘 위험도 진단기(`88% 위험` ➔ 세탁 후 `4% 안전`) 상태 전환 및 카테고리 바 차트 렌더링.
   - 실시간 썸네일 스트리밍 프리뷰, 라이브 로그 터미널, 예상 유튜브 홈 피드 미리보기 동작.
   - 트랜잭션 스냅샷 저장 및 `POST /api/wash/rollback`(`videos.rate(none)`) 원클릭 원상복구 테스트 통과.
   - Gemini 기반 AI 커스텀 페르소나 생성/조회/삭제(`GET/POST/DELETE /api/personas`) CRUD 및 단위 테스트 통과.
   - 스텔스 위장 모드(`ESC` 단축키 및 패닉 버튼), 1시간 자동 복구 타이머, SaaS Pro 업그레이드 모달 및 엔지니어링 메트릭 카드 동작.
3. **Automated Test Suite (`PASS`)**: 기존 13개 테스트 + 신규 v2.0 롤백/페르소나/텔레메트리 테스트 100% 통과.

---

## 3. 3-Strike Rollback Rule
- 동일 스텝에서 3회 연속 타입/빌드/테스트 에러 발생 시 `@ts-ignore` 등 우회 패치를 금지하고 직전 정상 상태로 롤백 후 재설계한다.
