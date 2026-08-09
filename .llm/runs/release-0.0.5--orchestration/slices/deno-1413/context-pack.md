# Context Pack: Deno 2.9.5 toolchain standardization (#1413)

## Current state

Tier-D implementation and all owner-required gates are complete on
`chore/deno-2-9-5-toolchain`, based on
`origin/main@399f60185d5d01ae68764a8f48d1f716ca3a51aa`. Exact scratch RED/GREEN proof is preserved in
`red-green-proof.md`. Draft PR [#1414](https://github.com/rickylabs/netscript/pull/1414) is open at
`9121b3f5d364190ee9ca121f734b7291ca589fd1`; the current phase is `impl-eval` handoff.

## Completed

- Read requested skills and harness run loop/activation/gates.
- Selected Archetype 6 for the internal CLI scaffold leaf.
- Audited `.github`: 21 Deno 2.9.0 pins across 11 files.
- Verified unrelated OpenTelemetry and negative-fixture 2.9.0 strings must remain unchanged.
- Verified canonical scaffold constant and Claude mirror generator.
- Updated 21 `.github` pins, scaffold constant/derived consumers, and toolchain skill/mirror.
- Proved 2.9.3 exit 1 and 2.9.5 exit 0 with exact canary write.
- All owner-required gates green; no lockfile changed.
- Implementation/evidence committed and pushed with the explicit refspec.
- Draft PR #1414 opened against `main`, milestone 0.0.5, with exactly one `status:impl-eval` and
  the required taxonomy; issue #1413 reconciled to the same phase.

## In progress

- None in this Tier-D lane. Awaiting milestone-orchestrator separate-session IMPL-EVAL.

## Next steps

1. Milestone orchestrator launches mandatory separate-session IMPL-EVAL at the final head.
2. Orchestrator completes CI/close-gate evidence and merges only after evaluator PASS.

## Key decisions

- One scaffold constant; derived consumers/tests.
- Exact explicit prerelease only; never `@canary`.
- Age bypass only for intentionally fresh release verification.
- Preserve lockfiles and unrelated version strings.

## Drift and debt

- Drift: local Deno is already user-owned 2.9.5, not root-owned 2.9.3.
- Debt: none expected.

## Gate summary

- Required gates: all raw exit 0; see `worklog.md` for counts.
- `.github` residues: 0 old pins; 21 Deno 2.9.5 pins.
- Lockfiles: unchanged.
- Extra direct whole-CLI doctrine scan: exit 1 on 50 existing untouched-file findings; required
  configured architecture and quality gates remain exit 0. No allowance added.
