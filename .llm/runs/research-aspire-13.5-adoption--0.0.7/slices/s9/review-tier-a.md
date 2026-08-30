# S9 Tier-A slice review — #1721 / PR #1759 (stacked on S8 `9dd06647` → S6 → S5)

## Sign-off at exact head `e11de98d` (phase A) — 2026-08-30

- Reviewer: Fable 5 medium supervisor (session `session_01Jusn3woxeK5xhCdj6ccooR`); generator: Codex
  · GPT-5.6 Sol · medium thread `01a0523a-d727-7610-9cd4-e4eddbd77aea`; worktree `007-aspire-s9`
  (clean at head, == origin).
- **Commit stack:** `83ae1a43` MCP smoke receipt gate (`agent.aspire-mcp-smoke`,
  `cli-surface.ts:65`, `gates/scaffold/aspire-mcp-smoke.ts` +
  `aspire-mcp/{contract,evidence,evaluate,receipt}.ts`, injectable transport,
  lifecycle/timeouts/redaction per the locked table, recorded transcript in the unit test, explicit
  skip receipt exit 20 when no `aspire-start` evidence) → `06a0e5e1` CI retention of the receipts →
  `418eb4b9` skills/corpora/agent-init to 13.5.3 truth through generators (`skills/aspire/SKILL.md`
  receipt-cited; mirrors via `agentic:sync-claude`; explicit four upstream workflow skills, never
  `aspire`/`all`; barrel/corpus/publish-assets/dogfood regen
  - new `agentic:dogfood-skills:check`) → `e11de98d` phase-A evidence closeout. 114 files
    (+17722/−904; 71 under `.agents/generated`).
- **Gates executed at head (fork, read-only, no runtime/MCP):** scoped `deno check` **0
  diagnostics** (1142 files); raw lint/fmt on the 22 changed TS files clean; `quality:scan` ok;
  `arch:check` FAIL 0; `check:assets-barrel`, `check:publish-assets`, `check:mcp-export-corpus`,
  `agentic:sync-claude:check`, `agentic:check-claude`, `check:emitted-samples`,
  `agentic:dogfood-skills:check` (`stale: []`) → exit 0; tests **182/0 · 5/0 · 24/0**; acceptance
  grep `13\.4\.6` over skills/mirrors/assets → **0 hits**; new lint escapes 0/0/0.
- **Contract:** gate placed in `RUNTIME_GATES` after wait/describe and before health/behaviour gates
  and `CLEANUP_ASPIRE_STOP`, on both tiers; never silently absent. Mirrors byte-identical to the
  shipped skill. Agent init explicit list verified in `aspire-agent-initializer.ts`. Archival rows
  untouched. No public docs prose, no `excludeFromMcp()` emission change, no pins.
- **D-45 handling (the reason the thread closed `BLOCKED:`):** static 13.5.3 receipt shows the
  14-tool baseline, `toolsMissing: ['get_integration_docs']`, `proofScope` explicitly "not the D-12
  AppHost smoke receipt"; the 15-tool gate assertion is **unchanged** (fails loudly live); the skill
  table documents the 14 observed tools and names `get_integration_docs` once as "expected by the
  locked contract, unobserved in both captures — treat as unavailable until a Phase-B receipt
  observes it". Honest; accepted. Resolution is a contract decision (D-45 recommendation), not a
  code defect.
- Minor: the recorded transcript fixture lives inside `aspire-mcp-smoke_test.ts` rather than a
  separate fixture file — acceptable; evaluator may note.
- Not claimed: the live D-12 smoke receipt, dashboard-only listing, live visibility — Phase B,
  lease-backed and environment-blocked (D-42/D-43).
- **Verdict: sign-off to independent IMPL-EVAL (phase A) at `e11de98d`.** Not a merge recommendation
  (stacked S8 → S6 → S5; D-41 applies). `docs_audit` single Sol pass dispatched in parallel per the
  doc-audit lane.
