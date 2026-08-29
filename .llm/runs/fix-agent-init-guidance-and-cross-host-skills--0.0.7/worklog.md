# Worklog: agent-init guidance and cross-host skills

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-agent-init-guidance-and-cross-host-skills--0.0.7` |
| Branch | `fix/agent-init-guidance-and-cross-host-skills` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Design

Recorded before product implementation.

### Public Surface

- CLI command remains `netscript agent init [--host claude|vscode|all] [--with-docs]`.
- Generated filesystem contract adds canonical `.agents/skills/**`, conditionally mirrors
  `.claude/skills/**`, and writes the marked root `AGENTS.md` section for every host.
- TypeScript/JSR export map is unchanged.

### Domain Vocabulary

- `AgentHost` — existing host-config/mirror selection (`claude`, `vscode`).
- Canonical skill tree — `.agents/skills/`, always emitted and host-neutral.
- Host mirror — derived copy for a selected host convention; this leaf owns only Claude's mirror.
- Guidance pointer surface — the marked root `AGENTS.md` section; discovery cues, not tutorials.
- Behavioural acceptance — post-implementation unfamiliar-agent usage measurement, outside this
  implementation session.

### Ports

- `AgentInitFileSystem` — existing read/write/exists seam used for canonical write and mirror readback.
- `AspireAgentInitializer` — existing Claude-only optional delegation; unchanged.
- `AgentDocsGenerator` — existing optional offline corpus generator; unchanged.
- No new ports.

### Constants

- Existing five spine abstracts (unchanged): `CliCommand<Input, Result>`, `CliCommandGroup`,
  `CliRoot`, `UseCase<Input, Result>`, `Registry<TKey, TValue>`.
- Existing layer-2 abstracts introduced by this slice: none.
- `TEMPLATE_KEYS.agentGuidance` — the one new finite asset identifier.
- `START_MARKER` / `END_MARKER` — existing idempotent root-section boundary.
- Canonical skill root `.agents/skills`; Claude mirror root `.claude/skills`.

### Archetype-6 Catalog

- Vertical feature: `src/public/features/agent/init/`; command, input, use case, docs generator, and
  filesystem port remain co-located.
- Extension axes/registries: plugin kind, DB engine, template, output renderer, preset, deploy
  target — unchanged by this leaf.
- Composition: `src/public/features/agent/agent-group.ts` continues to wire `initAgent`; no new
  inline command logic.
- Effects: writes remain through `AgentInitFileSystem`; optional Aspire process execution remains in
  the existing adapter.
- Contributor path: edit the guidance asset for prose, add its key to the typed manifest, regenerate
  the asset barrel, then update semantic assertions in `init-agent_test.ts`.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Activate/re-baseline harness and lock issue-separated design | Plan checklist; raw git baseline | Run artifacts only |
| 2 | Ship canonical cross-host skills and composed root guidance | Focused unit test, scoped wrappers, asset freshness, fresh CLI scaffold proof | Product ceiling + run artifacts |
| 3 | Record final gate evidence and Tier-A handoff | Quality/arch, publishability, clean diff/head checks | Run artifacts only |

### Deferred Scope

- Behavioural unfamiliar-agent wave — supervisor chooses `[post-merge]` or explicit rejection.
- Older #1674 one-root consolidation proposal — superseded for this run by current re-intake.
- Internal Deno skill expansion and MCP/docs changes — explicitly prohibited.

### Contributor Path

Start at `init-agent.ts` for install sequencing and at
`kernel/assets/agent/guidance.md.template` for generated prose. The manifest and generated barrel
form the shipping boundary; tests verify canonical/mirror semantics and individual issue cues.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-30 | 1 | Research | Verified branch/base, live issue bodies/comments, doctrine profile, exact installer/app-guide/asset paths. |
| 2026-08-30 | 1 | Plan | Locked five-path product ceiling and separate acceptance/evidence tables. |
| 2026-08-30 | 1 | Plan-Gate | `PLAN-EVAL: N/A` — current re-intake fixes contract, scope, risks, and gates; only close-gate disposition is safely deferred. |
| 2026-08-30 | 2 | Implement | Added one embedded guidance asset, universal root guidance, canonical `.agents/skills`, and Claude mirrors copied from canonical bytes. |
| 2026-08-30 | 2 | Focused gates | Issue-labelled installer suite passed 22/22; scoped check and lint passed with non-empty selections. |
| 2026-08-30 | 2 | Consumer proof | Fresh local scaffold + real `agent init --host all --editor vscode --with-docs` emitted eight required guidance cues, six canonical skills, six byte-identical Claude mirrors, configs, and offline docs. |
| 2026-08-30 | 2 | Commit | Product slice committed/pushed as `2f4b8c00d664f0c03f22946d1e0315cb7819303e` using the required explicit branch refspec. |
| 2026-08-30 | 3 | Durable gates | Assets barrel, quality/doctrine, and CLI publish dry-run all passed at the immutable product SHA. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Current grouped re-intake supersedes conflicting older issue comments | It is the latest explicit task authority and supplies exact boundaries. | `implement.md`, live issue comments |
| Always install canonical skills and root guidance | Both are cross-host workspace contracts. | #1672/#1675 contract |
| Claude mirror reads canonical bytes | Proves derivation rather than coincidental duplicate writes. | #1675 acceptance |
| Template + generated barrel for guidance | Published JSR modules cannot rely on runtime asset reads; asset freshness is gated. | JSR audit / asset generator |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Older #1674 comment says delete nested app guide; re-intake says preserve/link | significant | yes |
| Older #1672 comment says edit internal toolchain skill; re-intake forbids it | significant | yes |
| Root formatter policy excludes `packages/cli`; wrapper cannot give a clean CLI verdict without imposing an ad hoc whole-file rewrite | significant | yes |
| Local-source scaffold lacks root import evidence required by the existing offline-doc resolver | minor | yes |
| Draft PR's live `main` base advanced after the exact intake baseline | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Focused unit test | `scoped-test.json` | PASS | 22 passed, 0 failed; includes separate #1672/#1674/#1675 assertions. |
| Scoped check | `scoped-check.json` | PASS | Four explicit changed TypeScript files; zero findings. |
| Scoped lint | `scoped-lint.json` | PASS | Three authored TypeScript files; zero findings with non-empty coverage. |
| Scoped format | `scoped-fmt.json` | BASELINE_BLOCKED | Root config excludes all of `packages/cli`; an explicit neutral config processes the files but reports legacy whole-file style, so Tier-A must disposition rather than accepting review-noise rewrites. |
| Changed-line whitespace | `git diff-tree --check 2f4b8c00d^ 2f4b8c00d` | PASS | No whitespace errors in the committed slice. |
| Asset barrel | `assets-barrel.json` | PASS | SHA `2f4b8c00d...`; request `6c612bd52779...`; generated output is current. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-1/F-3/F-10/F-11/F-12/F-16/F-18/F-CLI | PASS | `quality-gate.json`, request `39f2aee25ed0...` | Durable `quality:scan && arch:check` at `2f4b8c00d...`; pre-existing repository warnings remain non-failing. |
| F-5/F-7 | DEBT_ACCEPTED baseline | `cli/public-api-doc-completeness` | No public export/JSDoc change. |
| F-6 | PASS | `cli-publish-dry-run.json`, request `75356945379b...` | Package dry run includes `src/**/*.template` and completes successfully. |
| F-19 | PASS with Tier-A format disposition | scoped wrapper reports + `drift.md` | Test/check/lint have clean structured evidence; formatter policy exception is explicit, not hidden. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `e2e:cli` / Aspire / Docker | N/A | explicit brief boundary | Not authorized. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Fresh `agent init --host all --with-docs` workspace | PASS | `.llm/tmp/gate-receipts/agent-init-guidance/scaffold-proof.json` | 150-file fresh scaffold; 8 cues, 6 canonical files, 6 byte-identical mirrors, configs and offline docs. Disposable local-source fixture added `@netscript/cli: workspace:` because the existing scaffold root carries no docs-version import evidence. |
| Behavioural unfamiliar-agent wave | NOT_RUN | supervisor decision pending | Cannot be produced by this leaf. |

## Handoff Notes

- Tier-A should inspect the product ceiling, canonical→mirror readback, issue-separated assertions,
  formatter-policy exception, and the three unresolved behavioural acceptance boxes first.
- IMPL-EVAL must be a fresh opposite-family session after Tier-A review; this author will not fill
  `evaluate.md` or claim PASS.
- Product gate receipts attest `2f4b8c00d664f0c03f22946d1e0315cb7819303e`; the final evidence-only
  commit is expected to advance the reported branch head without changing product bytes.
