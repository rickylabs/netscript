# Worklog: OpenCode MCP attachment and provider-valid resume

## Run Metadata

| Field          | Value                                      |
| -------------- | ------------------------------------------ |
| Run ID         | `fix-opencode-mcp-resume-boundaries--w1-c` |
| Branch         | `fix/opencode-mcp-resume-boundaries`       |
| Archetype      | N/A — internal agentic infrastructure      |
| Scope overlays | none                                       |

## Design

### Public Surface

- `prepareOpenCodeEnvironment` — discovers/translates/overlays project MCP and the boundary plugin.
- `normalizeOpenCodeHistory` — pure, idempotent provider-boundary normalization contract.
- `runOpenCodePreflight` — proves MCP server/tool attachment and one harmless docs lookup.
- `runOpenCode` / `opencodeRunArguments` — add explicit session, MCP requirement, and receipt
  options.
- Local OpenCode plugin default export — runs normalization before every dispatch and records safe
  tool/discovery telemetry.

### Domain Vocabulary

- `ClaudeMcpDocument`, `ClaudeMcpServer` — untrusted generated project declaration shapes.
- `OpenCodeLocalMcpServer`, `OpenCodeConfigOverlay` — validated target configuration.
- `OpenCodeMeasurementRequirement` — expected server/tool and harmless lookup contract.
- `OpenCodePreflightReceipt` — counts/status/call evidence with no content or secrets.
- `OpenCodeStoredMessage`, `OpenCodeStoredPart` — minimal structural history seam.
- `HistoryTransformation`, `HistoryNormalizationReceipt` — event id, reason code, before/after
  counts.
- `DiscoverySource` — `mcp | public_web | local_docs | generated_source`.

### Ports

- Injectable config filesystem reads/stats — deterministic discovery/malformed fixtures.
- `OpenCodePreflightPort` — bounded server enumeration and provider-visible harmless tool execution.
- Receipt sink/clock — privacy assertions without real filesystem timing in unit tests.

### Constants

- Expected generated server names: `netscript`, `aspire` (acceptance vocabulary, not provider
  policy).
- History reason codes: `empty_text`, `empty_reasoning`, `empty_assistant`,
  `signed_reasoning_separator_unsafe`.
- Discovery sources: `mcp`, `public_web`, `local_docs`, `generated_source`.
- Volatile model/version/endpoint/provider values remain in `.llm/tools/agentic/config/` and routing
  policy; none are introduced locally.

### Commit Slices

| #  | Slice                               | Gate                                             | Files                                                    |
| -- | ----------------------------------- | ------------------------------------------------ | -------------------------------------------------------- |
| S0 | Lock research/design/plan           | separate Minimax PLAN-EVAL                       | run directory                                            |
| S1 | MCP overlay, preflight, telemetry   | focused matrix + scoped wrappers + agentic suite | OpenCode/hybrid tooling, tests, task/docs, run artifacts |
| S2 | Resume/history guard                | full history matrix + same gates                 | OpenCode plugin/run/tests/docs, run artifacts            |
| S3 | Live receipts and formal evaluation | live MCP/resume, exact-head gates, DeepSeek PASS | run receipts/evaluation/handoff                          |

### Deferred Scope

- OpenCode V2 API/plugin migration — wait for the pinned tool version to change.
- General host-neutral `.mcp.json` translation library — only OpenCode is defective/currently owned.
- Release/Billing Run — milestone orchestrator authority.

### Contributor Path

Add a supported Claude MCP field in `opencode-project-config.ts` with a matrix row; add a history
part rule in the pure normalizer with an idempotence/provider-switch fixture; add a telemetry source
only through the closed `DiscoverySource` classifier and prove the receipt contains no input/output.

## Progress Log

| Time       | Slice | Step                 | Notes                                                                                                                                                   |
| ---------- | ----- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-07 | S0    | Bootstrap/research   | Exact clean base and live issues verified; prepared artifacts re-read from coordination commit.                                                         |
| 2026-08-07 | S0    | Design               | Exact OpenCode 1.17.20 config/plugin/message/server contracts inspected; typed seams locked.                                                            |
| 2026-08-07 | S0    | PLAN-EVAL selected   | Decision-heavy hook/collision/signature choices require separate Minimax verdict before source work.                                                    |
| 2026-08-07 | S0    | PLAN-EVAL            | Minimax M3/high session `f7af5fb2-d91d-4e58-bea3-2538195fc856` returned PASS.                                                                           |
| 2026-08-07 | S1/S2 | Typed implementation | Added deterministic MCP overlay, bounded preflight, privacy-safe discovery receipts, provider-boundary history guard, session resume, and hybrid reuse. |
| 2026-08-07 | S1/S2 | Focused gates        | 38 tests pass; scoped agentic check/lint/fmt pass. A concurrency fixture caught and proved adapter-level environment caching/FIFO launch.               |
| 2026-08-07 | S1    | Live drift           | Exact host registry excludes MCP from debug/tool-list execution; switched to a bounded provider preflight turn proved by the tool receipt.              |
| 2026-08-07 | S3    | Live MCP             | Generated Aspire project plus agent init: 2/2 servers connected, preflight MCP call 1, product NetScript MCP call 1, launcher exit 0.                   |
| 2026-08-07 | S3    | Live resume          | Session `ses_023871aaeffehRNSqFc3I43Fvc` resumed through the sole current OpenCode route; `RESUME_OK`, provider-valid receipt, exit 0.                  |
| 2026-08-07 | S3    | Exact-head gates     | Focused matrix, 455-test agentic suite, scoped check/lint/fmt, volatile guard, and docs links all pass.                                                 |
| 2026-08-07 | S3    | IMPL-EVAL            | Separate DeepSeek V4 Flash 0731/max session `b332e8ae-d235-4923-80de-82cbb8b016be` independently re-ran the load-bearing gates and returned PASS.       |
| 2026-08-07 | S3    | Terminal gates       | Review-thread gate: exit 0, 0 threads/unanswered. PR checks: exit 0, 17 current checks, 0 failures at `67a0bf33d`.                                      |

## Decisions

| Decision                     | Reason                                                                                                                   | Source                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| PLAN-EVAL required           | Deferring config precedence or signature normalization would force source rework and could corrupt semantics.            | research + plan D1–D7              |
| No package archetype         | Owned surface is internal harness tooling, not published CLI/package code.                                               | archetype README + owned paths     |
| Provider preflight tool call | OpenCode 1.17.20 appends MCP tools only in session dispatch; a real bounded turn is the available provider-visible seam. | exact tag + live generated project |

## Drift

| Drift                                                | Severity    | Logged in drift.md |
| ---------------------------------------------------- | ----------- | ------------------ |
| Prepared paths/routes/base/lock differ from live run | significant | yes                |
| Debug/tool-list seam excludes MCP tools              | significant | yes                |

## Gate Results

- PLAN-EVAL: PASS, exact evaluated HEAD `c9a152277`, artifact commit `bf36fc75b`.
- Focused OpenCode/hybrid and permission matrix: exit 0, 50 passed / 0 failed.
- Exact-head agentic suite: exit 0, 455 passed / 0 failed.
- Scoped agentic check: exit 0, 161 files, 0 findings.
- Scoped agentic lint: exit 0, 161 files, 0 findings.
- Scoped agentic format: exit 0, 161 files, 0 findings.
- Internal docs links: exit 0, 102 docs, 0 broken links/anchors/orphans.
- Live MCP: exit 0; 2 connected servers; preflight and product NetScript MCP calls proved.
- Live resume: exit 0 on 1/1 current policy route; `provider_valid` receipt proved.
- Independent IMPL-EVAL: PASS; DeepSeek V4 Flash 0731/max session
  `b332e8ae-d235-4923-80de-82cbb8b016be`; artifact commit `67a0bf33d`.
- Review-thread gate at `67a0bf33d`: exit 0, threads 0, unanswered 0.
- PR checks at `67a0bf33d`: exit 0, checks 17, current failures 0.
- `deno.lock` SHA-256 remains `d32ef0c1f2b9256e05cf7339c452bd8cf6addeb9a4b433d38abcee992651b529`.

## Handoff Notes

- Implementation, live acceptance, formal evaluation, and terminal gates are complete. Keep the PR
  draft and leave ready/merge/release transitions to the milestone orchestrator.
