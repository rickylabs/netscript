use harness

## SKILL

- netscript-harness — evaluator protocol (`.llm/harness/evaluator/protocol.md`,
  `verdict-definitions.md`); you are the **independent IMPL-EVAL** for Codex-authored work; you
  never continue implementation and never self-certify anything.
- netscript-tools — scoped wrappers, gate receipts (`.llm/tools/gates/run-gate.ts`), raw git
  verification.
- netscript-pr — PR/labels/closing-keyword rules.
- aspire — Aspire CLI facts; **do not** start an AppHost or upgrade/install the host Aspire CLI (no
  runtime lease).

## Context

Formal IMPL-EVAL for **S5 of the Aspire 13.5 epic** — issue #1717, draft PR #1740 (closes #1717,
#1365, #1370, #979), epic #1712. Route: Claude · Anthropic · Fable 5 · medium (native
opposite-family evaluator of Codex · GPT-5.6 Sol work), per `.llm/harness/workflow/lane-policy.md`.

- Evaluate **exactly** head `1634a3c3c` on branch `fix/aspire-13-5-s5-literal-ports` (base
  `origin/main` `13878a80a`). Your worktree: `/home/codex/repos/netscript-aspire-13-5-s5-eval`
  (detached at that head; read-only for product files).
- Generator run dir (in the tree): `.llm/runs/fix-aspire-13-5-s5-literal-ports--impl/`
  (`supervisor.md`, `worklog.md` incl. Design + gate tables, `context-pack.md`, `drift.md`,
  `receipts/parity-phase1-{red,green}.json`).
- Contract of record: issue #1717 (+ #1365 sagas publisher, #1370 contributions, #979 plugin API
  host ports; S2 V3 comment on infrastructure host ports); locked decisions D-14 (sagas compat
  export, no core type change) and D-16 (infrastructure host ports opt-in) in
  `.llm/runs/research-aspire-13.5-adoption--0.0.7/plan.md` on `origin/research/aspire-13.5-0.0.7`
  (`git show origin/research/aspire-13.5-0.0.7:.llm/runs/research-aspire-13.5-adoption--0.0.7/plan.md`).
- Supervisor Tier-A notes:
  `git show origin/research/aspire-13.5-0.0.7:.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s5/review-tier-a.md`.
- S2 receipts referenced by S5: `origin/test/aspire-13-5-s2-runtime-verification`
  `.llm/runs/test-aspire-13-5-s2-runtime-verification--impl/receipts/`
  (`02-capture-db-allocation-*`, `02-aspire-describe-*.json`).
- Known baseline (not S5's): `packages/fresh/src/application/query/hydration.ts` TS2345 on
  `origin/main` (#1734 / PR #1736) fails generated-project `deno task check`; classify it explicitly
  if any CI gate is red for that reason.

## What to verify (run the gates yourself; verdicts from executed evidence, not the generator's claims)

1. Design checkpoint exists and commit slices match it (gate RED → sagas publisher/constant →
   contributions → plugin API + infrastructure host ports → E2E probes → regen/gates).
2. Gate: `check:aspire-host-ports` covers plugin contributions + generated infrastructure host
   ports; RED receipt on the base then green at head; the S5 literal grep
   (`git grep -nE '809[1-4]|4437|127\.0\.0\.1:80' -- plugins packages/cli/src packages/cli/e2e`)
   hits only `plugins/sagas/src/constants.ts` and deprecation-contract tests.
3. D-14: `SAGAS_API_DEFAULT_PORT` still exported from root `mod.ts`, `./public`, `./runtime`,
   `./aspire` with unchanged value and `@deprecated` JSDoc; **no runtime path reads it** (grep call
   sites); `SagaPublisherResult` type unchanged; `no-endpoint` rejection tested. Run
   `deno publish --dry-run --allow-dirty` in `plugins/sagas` (no new warnings beyond the three
   pre-existing dynamic-import ones) and `deno doc --lint plugins/sagas/mod.ts` (no error beyond
   pre-existing `private-type-ref` #1708). Deprecation-issue draft exists in the run dir.
4. Contributions (sagas/streams/triggers/workers + consumer stub) publish URLs/health only from
   `ctx.port(resource)`/service references — no fallback second argument, no literal loopback port.
5. D-16: `generate-register-infrastructure.ts` emits `port:` only when the entry configures one;
   plugin registration/scaffolder default emission carries no host port; tests assert both arms; two
   `--isolated` starts cannot collide by construction (reason from the emitted code — no runtime
   start).
6. E2E probes resolve URLs from `aspire describe --format Json` (`urls[].url`) rather than literal
   ports; `deno task e2e:cli run scaffold.plugins --format pretty` green (no Aspire runtime);
   `scaffold.runtime` is CI's on ready — classify any red against the #1734 baseline explicitly.
7. Gates you run: scoped wrappers on touched roots (+ raw fmt/lint on config-excluded `packages/cli`
   files), `quality:scan`, `arch:check`, `check:assets-barrel`, `check:publish-assets` if READMEs
   changed, plugin unit suites; no new `deno-lint-ignore`/`as unknown as`/`any`; no public export
   removed or public type changed.
8. Draft PR body `Closes #1717` / `Closes #1365` / `Closes #1370` / `Closes #979` / `Part of #1712`,
   labels/milestone, per-commit comments, explicit-refspec pushes; boundaries respected (no
   health-check registration S6, no resource commands S8, no pins, no `packages/fresh`, no
   skills/docs, no runtime, no host CLI change).

## Output

Write `evaluate.md` from `.llm/harness/templates/evaluate.md` into the generator run dir path **on
the supervisor's research worktree** by absolute path:
`/home/codex/repos/netscript-007-aspire-13-5-research/.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s5/evaluate.md`
(declare the exact evaluated head in the file), and post the same verdict as a PR #1740 comment
starting with `**[PHASE: IMPL-EVAL]**` and the head SHA. Verdict ∈ `PASS` / `FAIL_FIX` /
`FAIL_RESCOPE` / `FAIL_DEBT`. Do not commit to the S5 branch, do not mark the PR ready, do not
merge.
