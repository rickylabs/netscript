# Context Pack: Deno 2.9.5 toolchain standardization (#1413)

## Current state

Tier-D implementation and all owner-required gates are complete on
`chore/deno-2-9-5-toolchain`, based on
`origin/main@399f60185d5d01ae68764a8f48d1f716ca3a51aa`. Exact scratch RED/GREEN proof is preserved in
`red-green-proof.md`. Commit/push/draft PR remain before orchestrator handback.

## Completed

- Read requested skills and harness run loop/activation/gates.
- Selected Archetype 6 for the internal CLI scaffold leaf.
- Audited `.github`: 21 Deno 2.9.0 pins across 11 files.
- Verified unrelated OpenTelemetry and negative-fixture 2.9.0 strings must remain unchanged.
- Verified canonical scaffold constant and Claude mirror generator.
- Updated 21 `.github` pins, scaffold constant/derived consumers, and toolchain skill/mirror.
- Proved 2.9.3 exit 1 and 2.9.5 exit 0 with exact canary write.
- All owner-required gates green; no lockfile changed.

## In progress

- Commit, explicit-refspec push, draft PR creation/metadata, and implementation phase comment.

## Next steps

1. Commit and push with the explicit owner refspec.
2. Open the draft PR, set milestone/taxonomy, post implementation evidence, then hand back for
   separate-session IMPL-EVAL/CI/merge.

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
