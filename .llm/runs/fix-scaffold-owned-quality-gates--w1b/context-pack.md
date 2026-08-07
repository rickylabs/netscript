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

Slice 1 is committed/pushed as `80a5dc07b`; its trail reconciliation is `10a9287ec`, and the
structured comment is `#issuecomment-5214270787`.

Slice 2 now repairs the measured app/service/plugin/background output plus the AppHost defects
revealed by the expanded selection. AppHost product MTS is checked with the restored local
TypeScript project; the Deno-only `run-tool.mts` remains under Deno check; generated Aspire SDK and
Prisma output remain non-product inputs rather than direct lint/fmt targets. Plugin regeneration
formats its exact outputs and `netscript.config.ts` at the owning mutation boundary.

Current evidence: 78 focused tests / 186 steps green; fresh generated check/lint/fmt and UI AI gates
green across 144 selected product files; scoped repo check/lint/fmt wrappers green over 1,071 files.
The root lock remains untouched and absent from status.

Next: commit/push Slice 2 explicitly, post its structured implementation comment and reconcile
status, then run the accepted Slice 3 static/package gates, installed released consumer smoke,
leak-check, and single one-pass `scaffold.runtime` before the independent IMPL-EVAL handoff.
