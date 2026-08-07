# Context pack: Canary.15 W1-B

## Objective

One draft PR directly to `main` must close #1024's sole remaining clone-independent full-smoke item
and all eight #1328 scaffold-owned quality items. W1-B is a generated-contract repair plus proving
tests, not a release or whole-scaffold inventory.

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

## Blocking prerequisite

The installed published-consumer gate is not green. Stable `0.0.4` and published canaries 5 and 14
predate different parts of this branch's host-port and tool-ordering repairs; no
`0.0.5-canary.15` exists. Publication is protected and forbidden in this run. This disproves the
PLAN-EVAL assumption that the released fallback could close #1024 without a post-fix publication.

Do not dispatch IMPL-EVAL or move lifecycle beyond `status:impl` while #1024 box 6 remains
unchecked: the evaluator protocol makes that unchecked close gate blocking. Once a published
post-fix CLI exists, rerun only the installed consumer smoke from the owned external consumer root,
record exit 0, then hand the exact new head to a fresh local DeepSeek V4 Flash 0731 max evaluator
session. Do not rerun PLAN-EVAL or use OpenHands.
