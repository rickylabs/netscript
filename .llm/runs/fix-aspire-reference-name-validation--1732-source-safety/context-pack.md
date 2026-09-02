# Context Pack: #1732 background reference-name validation / source safety

## Run Metadata

| Field          | Value                                                      |
| -------------- | ---------------------------------------------------------- |
| Run ID         | `fix-aspire-reference-name-validation--1732-source-safety` |
| Branch         | `fix/aspire-reference-name-validation`                     |
| Current phase  | `implementation` — D-165 urgent recovery gated; evaluation pending |
| Archetype      | `6 — CLI / Tooling` (dominant surface)                     |
| Scope overlays | none                                                       |

## Current State

The branch was rebased over owner-supplied main `052f86595` and then over live `f59874abd` after
unrelated PR #1829 landed during verification. D-165 supersedes D-127's unsafe name-derived
background binding decision: generated identifiers are ordinal, every user-supplied emitted string
is a JSON literal, and semantic tests parse/execute reserved words, normalization collisions, and
source-sensitive entry/reference strings. The Flow-B users+sagas union still uses a generic binding
and exact captured set anchor. Required static gates pass; hosted runtime and fresh separate-session
IMPL-EVAL remain pending.

## Completed

- Loaded all requested skills and static-gates guidance.
- Verified clean branch and exact baseline.
- Researched Aspire's default name contract and current scaffold production contract.
- Locked dual-defense ordering and the explicit compatibility position.
- Kept the new Aspire grammar in a private `packages/aspire/src/domain/` module rather than adding a
  public `@netscript/aspire/constants` symbol.
- Captured red pre-change doc-lint and JSR-audit baselines without reporting them green.
- Recorded PLAN-EVAL cycle 1 at evaluator commit `1f52d5e2b6b35e204167686714fe3ad72f4fafae` and
  repaired F1/F2 without implementing.
- Added accepted parse-and-execute coverage for `class`, `await`, and `builder`, plus direct
  arbitrary-input binding safety.
- Recorded sibling service/plugin/app identifier exposure as pre-existing deferred scope owned
  upstream.
- Pushed the final plan amendment at `f1d7d9d8f738b4907e1c770051ee1f59abaacc4a` without modifying
  either evaluator verdict file.
- Added and executed the visible RED matrix before production edits: 67 pass, 32 fail, 99 total.
- Completed slice 2 with 59/59 generator tests and fully covered scoped check/lint/format wrappers.
- Preserved the exact `services__workers-api__http__0` discovery key and negative normalization
  assertion while making generated code safe for arbitrary direct-generator names.
- Added exact processor/service/plugin contextual diagnostics at config parse time without changing
  shared `ReferenceFields`, record-key schemas, or published JSON-schema output.
- Confirmed identical `z.toJSONSchema(AppSettingsSchema)` serialization before/after: 9,988 bytes,
  SHA-256 `87e3911b745954f91dba8c05456e36a92ff965cbab3f03b8350e24b09766e881`.
- Published slice 2 at `6e82aad1d4e0f4e14a5e4d6ed1395b6169505099` and slice 3 at
  `0d25cce469a784596101d331445b176be34cdbd6`.
- Completed the authorized static set: all leaf-focused code/repo gates pass; doc-lint and JSR audit
  match their recorded nonzero baselines. The later-fired root suite exits 1 only on two failures
  reproduced at `main` and outside this leaf's scope.

## Next Steps

1. Commit the D-165 recovery slice and force-push with a freshly resolved remote lease SHA.
2. Rewrite PR #1747's body to remove stale runtime/evaluation claims and expose both pending gates.
3. Hand the exact final head and static evidence back to the coordinator for fresh GLM IMPL-EVAL and
   separately hosted runtime proof.

## Files Changed

- Product changes are limited to the background generator, flow-B fixture, private Aspire rule,
  composed config validation, and the focused tests committed in RED.

## Gates

All leaf-focused check/test/lint/format, code-quality, architecture, and asset gates pass. Doc-lint
and JSR audit retain only their recorded existing findings. The root test was later **FIRED** by the
owner in a detached throwaway worktree at `6605625ab50850da40e71b6f0a77bb704c675751`: exit 1 after
179,100 ms, with 4,308 passed, 2 failed, 19 ignored, and 4,329 total. Both failures reproduce at
`main` `13878a80a50c55b9662099fed64555f2310ae4a3` and are outside the leaf diff. No runtime/E2E gate
has run. The complete 14-row table is in `worklog.md`.

The earlier host condition is retained as history but is superseded as of 2026-08-30. The host now
reports PID 1 as `tini`, zero zombies, 113 total processes, and `ulimit -n` of 524,288. The prior
attribution of `hybrid-launcher_test` to zombie exhaustion was wrong for this file and is withdrawn:
its old failure cause is no longer decidable; only its current equality at `main` and this head is
established.

## Open Questions

- None. PLAN-EVAL is owner-released with no cycle 3; IMPL-EVAL is the next separate formal gate.

## Drift and Debt

- Drift: the scaffold is looser than Aspire; the accepted correction rejects those values earlier.
- Drift: `rtk` is unavailable on the host despite the requested tooling skill.
- Corrected plan premise: exported `constants.ts` is a JSR surface, so the rule moved private.
- Drift: sibling service/plugin/app generators retain the pre-existing identifier exposure; this
  leaf deliberately does not fix it.
- Debt: none created.

## Commits

- `2176041116f3eb40c2d035f1e22d20c024e8a0dc` — initial narrowed plan artifact.
- `5b84eaea5ad80a0ac21936cfc60deec89897fc0c` — visible RED matrix.
- `6e82aad1d4e0f4e14a5e4d6ed1395b6169505099` — source-safe background emission.
- `0d25cce469a784596101d331445b176be34cdbd6` — private Aspire grammar lock.
- The complete artifact/published head SHA is copied from final `git log` into the draft PR phase
  comment and final handoff.
