# 🏗️ ARCHITECTURE.md (AlgoWash v2.0 Hybrid SaaS & Rollback Architecture)

> **문서 목적 (v2.0)**: 데스크톱 3단 Bento Grid와 모바일 하단 탭바를 아우르는 하이브리드 UI 구조, 실시간 스트리밍 피드백, 트랜잭션 롤백(`rating='none'`) 엔진, 그리고 엔지니어링 텔레메트리 아키텍처를 정의한다.

---

## 1. v2.0 전체 시스템 아키텍처 (Hybrid Bento + Serverless Core)

```mermaid
flowchart TD
    subgraph Client ["💻 Desktop 3-Column Bento & 📱 Mobile Bottom-Nav PWA"]
        Nav["Left Sidebar / Bottom Bar\n(5 Views + ESC Camouflage)"]
        Main["Center Workspace\n(Risk Radar, Emergency Switches,\nAI Persona Studio, SaaS Metrics)"]
        Inspector["Right Live Inspector\n(Streaming Thumbnail Feed,\nTerminal Log, Mock YT Preview)"]
        Modal["Pro Upgrade Modal &\nStealth Camouflage Overlay"]
    end

    subgraph Serverless ["⚡ Next.js App Router Serverless APIs"]
        WashAPI["POST /api/wash\n(Concurrent Like Injection)"]
        RollbackAPI["POST /api/wash/rollback\n(Concurrent 'none' Undo Engine)"]
        PersonaAPI["GET/POST/DELETE /api/personas\n(Gemini Custom Persona CRUD)"]
        ThemesAPI["GET /api/themes\n(Telemetry, Quota & History)"]
    end

    subgraph State ["🗄️ L1/L2 Cache & Transaction Store"]
        SeedPool[("L1 Static Seed Pool\n+ Custom Persona Pool")]
        TxStore[("Transaction Snapshot Store\n+ Saved Quota Telemetry")]
    end

    subgraph External ["🌐 Google & AI Cloud"]
        YT["YouTube Data API v3\nvideos.rate(like | none)"]
        Gemini["Gemini 1.5 Flash\nPersona & Keyword Generator"]
    end

    Main -->|"1. 원터치 세탁 실행"| WashAPI
    WashAPI -->|"2. 0ms 캐시 샘플링"| SeedPool
    WashAPI -->|"3. Promise.allSettled(like)"| YT
    WashAPI -->|"4. 스냅샷 & 절약 쿼터 기록"| TxStore
    WashAPI -->|"5. 실시간 썸네일/로그 스트림"| Inspector

    Inspector -->|"6. 원클릭 원상복구(Undo)"| RollbackAPI
    RollbackAPI -->|"7. Promise.allSettled(none)"| YT
    RollbackAPI -->|"8. 스냅샷 롤백 마킹"| TxStore

    Main -->|"A. 커스텀 상황 프롬프트"| PersonaAPI
    PersonaAPI -->|"B. 맞춤형 키워드/영상 생성"| Gemini
    PersonaAPI -->|"C. 커스텀 스위치 등록"| SeedPool
```

---

## 2. 트랜잭션 스냅샷 & 원클릭 롤백(Undo) 시퀀스

위기 상황이 종료된 후 사용자의 원래 알고리즘 취향이 망가지지 않도록, 주입했던 신호를 정확히 역추적하여 `rating='none'`으로 중화합니다.

```mermaid
sequenceDiagram
    autonumber
    actor User as 사용자
    participant UI as AlgoWash Dashboard
    participant Wash as POST /api/wash
    participant Rollback as POST /api/wash/rollback
    participant Store as Transaction Store (Cache)
    participant YT as YouTube API (videos.rate)

    User->>UI: [🚨 강아지 모드 세탁] 클릭
    UI->>Wash: POST { themeId: "puppy", intensity: "normal" }
    Wash->>YT: 병렬 videos.rate(id, "like") x 6
    Wash->>Store: Save Snapshot { txId, videoIds: [v1..v6], status: "active" }
    Wash-->>UI: 200 OK (txId, injectedVideos, riskScore: 88% -> 4%)

    Note over User,UI: 위기 상황 종료 (연인/가족에게 화면 보여주기 완료)

    User->>UI: [🔄 상황 종료: 원래 알고리즘으로 복구] 클릭
    UI->>Rollback: POST { transactionId: txId, videoIds: [v1..v6] }
    par 병렬 좋아요 취소 (Concurrent Undo)
        Rollback->>YT: videos.rate(v1, "none")
        Rollback->>YT: videos.rate(v2, "none")
        Rollback->>YT: videos.rate(v6, "none")
    end
    Rollback->>Store: Mark Snapshot { txId, rolledBack: true }
    Rollback-->>UI: 200 OK (restoredCount: 6)
    UI-->>User: 🔄 원상복구 완료! (주입된 좋아요 흔적 100% 제거)
```

---

## 3. 엔지니어링 텔레메트리 산식 (Observability Metrics)

포트폴리오 심사자 및 사용자에게 아키텍처의 효율성을 증명하기 위해 캐시 레이어(`src/lib/cache.ts`)에서 다음 지표를 실시간 계산합니다:
- **절약한 `search.list` 쿼터 (`savedSearchUnits`)**: 매 세탁 또는 프리셋 조회 시 실시간 검색(`100 units` + 영상 상세 조회) 대신 L1/L2 캐시 풀을 사용한 횟수 × `100 units`.
- **캐시 적중률 (`cacheHitRate`)**: `cacheHits / (cacheHits + cacheMisses) * 100` (L1 정적 시드 풀 보장으로 99%+ 유지).
- **평균 병렬 처리 레이턴시 (`avgLatencyMs`)**: 직렬 호출 대비 `Promise.allSettled` 팬아웃으로 단축된 실제 처리 시간 추적.
