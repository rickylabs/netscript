# Context Pack: #1732 background reference-name validation / source safety

## Run Metadata

| Field          | Value                                                      |
| -------------- | ---------------------------------------------------------- |
| Run ID         | `fix-aspire-reference-name-validation--1732-source-safety` |
| Branch         | `fix/aspire-reference-name-validation`                     |
| Current phase  | `implementation` — final static evidence reconciliation    |
| Archetype      | `6 — CLI / Tooling` (dominant surface)                     |
| Scope overlays | none                                                       |

## Current State

Slices 2 and 3 are pushed and green. Source-safe emission is load-bearing beneath an exact private
Aspire resource-name rule applied through a background-object `superRefine`. The full focused matrix
passes 143/143, the generated JSON schema is byte-for-byte unchanged, and the private rule is not
re-exported or exposed through a public type. The complete static gate set has been populated for a
final-head rerun after this artifact reconciliation commit.

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
- Completed the authorized static set provisionally: all fired code/repo gates pass; doc-lint and
  JSR audit match their recorded nonzero baselines; root test remains NOT FIRED.

## Next Steps

1. Commit and push this final evidence reconciliation.
2. Repeat every fired static gate without source changes at that exact pushed head.
3. Update the draft PR body/comment and stop for owner-dispatched IMPL-EVAL.

## Files Changed

- Product changes are limited to the background generator, flow-B fixture, private Aspire rule,
  composed config validation, and the focused tests committed in RED.

## Gates

All fired focused/root/code-quality/architecture/asset gates pass. Doc-lint and JSR audit retain
only their recorded existing findings. Root test remains explicitly `NOT FIRED`; no runtime/E2E gate
has run. The complete 14-row table is in `worklog.md`.

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
