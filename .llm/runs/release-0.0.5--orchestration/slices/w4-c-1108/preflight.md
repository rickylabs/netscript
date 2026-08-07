# W4-C preflight — repair reference/export alignment

Observed on 2026-08-06 before dispatch:

- PR #1292 already established the package-entrypoint mapping authority, `deno.json.exports`
  derivation, deterministic drift check, negative fixture, and curated-symbol inventory support.
- Live mismatches remain across Fresh UI, plugin, config, contracts, queue, SDK, service, and
  telemetry reference pages.
- Intentional omissions are not yet uniformly machine-readable, and the repair/update workflow is
  not fully integrated into existing documentation verification.

## Required supervisor mission

1. Run the checked-in drift checker on the exact dispatch head and independently inspect every named
   package with `deno doc` plus its live `deno.json.exports` before editing prose.
2. Repair all reproduced entrypoint/symbol omissions, invented names, obsolete names, and wrong
   subpaths across the eight named package references. Do not narrow the claimed reference scope to
   make the gate green.
3. Represent every intentional omission in the existing machine-readable authority with rationale
   and negative coverage; no prose-only exception list.
4. Document the maintainer regeneration/update procedure and wire the drift checker into the current
   docs verification path without creating a second task/inventory authority.
5. Seed missing, renamed, invented, and intentionally omitted export negatives; prove repaired live
   inventory passes and docs build remains green.
6. Run docs links/accuracy/build, changed-file/source alignment, scoped tooling check/lint/fmt, JSR/
   public-doc lint where package surfaces are inspected, and exact active-reference residue checks.
7. Open a draft PR with `Closes #1108` only after the three remaining rows are evidenced; leave it
   at `status:impl-eval` for separate Qwen evaluation.

Passing by deleting “generated/full” claims or by copying another static export list is evaluator-
blocking false completion.
