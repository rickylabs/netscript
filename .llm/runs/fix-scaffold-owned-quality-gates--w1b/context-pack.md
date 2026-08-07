# Context pack: Canary.15 W1-B

## Objective

One draft PR directly to `main` closes #1328's scaffold-owned quality implementation and references
#1024's remaining clone-independent published-smoke receipt. W1-B is a generated-contract repair
plus proving tests, not a release or whole-scaffold inventory.

## State to preserve

- Base/current main: `7af6d1c02ab3f380dde7354ebac190e67d363db0`.
- Branch: `fix/scaffold-owned-quality-gates`, explicit push refspec only, no upstream.
- Sole writer: Codex thread `019fdb07-deb8-7971-80aa-d02fb6b56c37`.
- `deno.lock`, every foreign/quarantined worktree, and old `ns004-agenttools` are protected.
- #1092's exact eight installed agent tools and symptom-led docs are shipped behavior, not a design
  opening.

## Current defect

Generated root `check` uses three `.ts` shell globs and misses TSX, plugins, background runtimes,
and AppHost/helper `.mts`; bare lint/fmt are too broad. The runtime E2E generates registries but has
no negative selection proof. A fresh diagnostic found five product lint and four format defects.

## Locked approach

- Always generate a dependency-free `.netscript` quality runner.
- Generated tasks invoke modes for check, lint, format-check, and format-write—no shell globs and no
  optional `.llm/tools` dependency.
- Select apps, services, contracts, plugins, workers, sagas, triggers, streams, AppHost/helpers, and
  other scaffold-owned TypeScript source; exclude dependency caches, offline agent/docs bundles, and
  direct machine-output lint/fmt targets.
- Check reaches runtime-generated registries/clients through imports; it may not false-green because
  executable source is excluded by project config.
- E2E injects one deliberate bad fixture per owned surface, including app TSX and AppHost/helper
  MTS, then proves cleanup and a final green check/lint/format-check.
- Fix generator sources responsible for inherent output findings.
- Close #1024 with the installed eight-tool smoke running from a real consumer outside any checkout.

## Evaluation risks

1. The selection matrix could miss an AppHost-executed helper or incorrectly lint machine output.
2. Passing explicit paths while root `exclude` still suppresses them would recreate the issue's
   excluded-file exit-0 trap.
3. The negative matrix could be costly or destructive unless fixtures are serial and precisely
   owned.
4. Reusing optional agent tools would make normal scaffolds incomplete; expanding the eight-tool
   bundle would regress #1092's explicit boundary.
5. Clone-independent smoke evidence must use the installed released path, not a local CLI fallback.

## PLAN-EVAL result

Independent session `017613f0-c5be-4738-b59c-0bf540202686` returned PASS on exact head
`045ca6c3262c854f830b428e871ef9ed8730ba10` using the canonical Minimax M3 high route. The tracked
distillation is `plan-eval.md`; all seven advisories are incorporated into `worklog.md`'s mandatory
Design checkpoint. Do not rerun PLAN-EVAL.

The verdict/Design commit is `9ac85e921`; its explicit-refspec push and structured PR comment are
complete. PR #1342 and both issues are at exactly `status:impl`.

## Implementation state

- Slice 1: `80a5dc07b`, trail `10a9287ec`, comment `#issuecomment-5214270787`.
- Slice 2: `1ab303975`, trail `760d5f1ad`, comment `#issuecomment-5214946644`.
- Slice 3 implementation: `21dd6a6c0`; merge-readiness repairs: `f3a4d5d2e` and `3512e1dc4`.
- Current-source focused tests: 122 passed / 140 steps / 0 failed.
- Scoped repository wrappers: check 1,197 files / 10 batches / 0 diagnostics; lint 1,197 / 6 /
  0 findings; format 1,197 / 6 / 0 findings.
- Quality/doctrine gate, CLI doc-lint, asset freshness, and CLI publish dry-run: exit 0 (existing
  warnings only).
- Canonical current-head `scaffold.runtime`: 76 passed / 0 failed, including ten deliberate owned
  surface failures, restored green generated quality, Aspire/database/plugin/behavior/telemetry,
  and cleanup.
- Final leak-check: exit 0, no run-owned survivors; foreign/unproven resources untouched.
- Root `deno.lock` remains untouched and absent from the base-to-head diff.

## Independent IMPL-EVAL

Separate session `49e6c09a-705b-47e4-9598-9b45f932c210` returned **PASS** on immutable head
`a02467d8cd28be215855764d163fb60508afe895` through the mandated Claude Code/OpenRouter
`deepseek/deepseek-v4-flash-0731` max route. It found no current-head implementation defects,
independently verified `scaffold.runtime` at 76/0, and ran scoped check/lint/format over 1,195 files
with zero diagnostics/findings. The tracked verdict is `evaluate.md`.

## Deferred release receipt

Stable `0.0.4` and published canaries 5 and 14 predate different parts of this branch's combined
repair. The authoritative handoff forbids canary.15 until W1-B and W1-C merge, so the missing
published consumer result is sequenced release evidence rather than an implementation defect.

Keep PR #1342 draft with `Closes #1328` and `Refs #1024`; keep PR and both issues exactly
`status:impl`. After both waves merge and the post-fix canary is authorized, run the installed smoke
outside the framework checkout and use its green receipt to check #1024's final box. Do not rerun
either formal evaluator, trigger OpenHands, publish from this run, mark ready, or merge.
