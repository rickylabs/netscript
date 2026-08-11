# Worklog — docs-rfc-runtime-versioned-automation--supervisor

## 2026-08-11 Bootstrap

- Run dir scaffolded; supervisor identity + owner overrides recorded (Fable 5 medium supervisor,
  Sol xhigh final PLAN-EVAL) — see supervisor.md, drift.md D-1/D-2.
- Baseline verified: branch `docs/rfc-runtime-versioned-automation` == `origin/main` @ `2256a67bf`.
- Read-only surfaces verified present: `/home/codex/repos/netscript-start-ref` (legacy),
  `/home/codex/repos/ns-1443-plugin-ai-orchestrator` (#1443/#1444).
- No established `docs/architecture/rfc/` location exists yet (grep over docs/ found no RFC/ADR
  tree); this run will create `docs/architecture/rfc/` and record that as a locked decision in
  plan.md.

## 2026-08-11 G3 — #1444 impact memo (early deliverable)

- Read-only inspection of `/home/codex/repos/ns-1443-plugin-ai-orchestrator`: PR #1444 body, D-10
  owner decision (control-plane/runtime split), uncommitted child-process loader
  (`configured-plugin-manifest-loader-child.ts`, `plugin-registry.ts` diff), workspace-mutator
  `plugin.ts` registration, barrel stub cleanup. Never wrote in that worktree.
- Wrote `1444-impact.md` (run dir): ratifies the D-10 split, keeps the child loader (clearEnv is
  load-bearing), 8 compatibility constraints C1–C8 (notably: manifests stay serializable data,
  additive-extensible schema, `deno.jsonc` loader gap, `generate runtime-schemas` stays
  control-plane-only, `workers|triggers/runtime/**` untouched).
- Posted to PR #1444: https://github.com/rickylabs/netscript/pull/1444#issuecomment-5248826402
- G1 legacy archaeology Codex slice launched: thread visible in `codex-thread-ids.md`
  (gpt-5.6-sol · medium, worktree = this RFC worktree, legacy repo read-only subject). First
  launch attempt failed (runner forwards only --launch-arg values; --brief/--worktree must be
  inside them) — relaunched successfully.

## 2026-08-11 G1 — legacy capability map landed (slice review PASS)

- Codex Sol·medium thread `019feef8-673d-7c53-98a4-db337494105b`, 6 turns (budget-exhausted at
  max-turns but report structurally complete: 15 sections, exec summary, 3 operator journeys,
  reachability audit, 5 weakest claims).
- Headline (reshapes the RFC): **the versioned runtime trees were DEAD even in legacy** — loader +
  watcher existed but no executable service imported `@netscript/runtime-config`; hot
  add/update/rollback never worked end-to-end. Real-but-orphaned data plane: KV task registry +
  7-runtime polyglot executor (per-message KV resolution = live-update capable) with NO operator
  registration path. Workers cockpit task pages wired (list/detail/run, no create); triggers
  cockpit dead vs delivered Hono service (contract/server mismatch). Permissions: absent → 
  `--allow-all`; non-Deno adapters inherit host env, no sandbox. Split-brain config across 5
  stores. Schemas = editor artifacts, 2 diverged authorities, no admission validation.
- Supervisor slice review: read full report; spot-checked the 2 most load-bearing claims —
  (a) no runtime-config consumers in legacy (grep confirms only type/contribution metadata),
  (b) `permission-flags.ts` returns `--allow-all` when permissions absent (verified verbatim).
  PASS. The owner's "capability" is best understood as an *aspiration with a working execution
  engine*, not a lost working feature.

## 2026-08-11 Owner mid-run directives + sandbox survey

- D-4 (complete redesign in scope), D-5 (no compat/migration layer), D-6 (parent hypotheses) —
  recorded in drift.md; plan.md + G2 brief updated accordingly.
- External isolation-tech survey extracted to `.llm/tmp/docs/sandbox-isolation-survey-2026-08.md`
  (Deno security docs primary; gVisor/Firecracker/WASM-WASI/V8-isolate comparison; managed
  sandbox market scan).
