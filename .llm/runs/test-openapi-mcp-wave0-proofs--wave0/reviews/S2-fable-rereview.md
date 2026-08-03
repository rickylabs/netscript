APPROVED

# S2 Fable re-review — amended P2 evidence

- Reviewer: Claude Fable 5, fresh separate native session (advisory slice review, not IMPL-EVAL).
- Scope: read-only verification of the amendments named in `briefs/S2-review-fixes.md` against
  `reviews/S2-fable.md`. No implementation/evidence file was edited; no scaffold, AppHost, commit,
  push, or GitHub contact occurred. Two verification commands were run: a read-only
  `sha256sum`/`wc -c` over the committed and scratch raw specs, and a sandboxed re-run of
  `p2-measure-live-spec.ts` against the committed raw spec writing only to the session scratch
  directory, followed by a structural diff and an independent key-completeness check.

## Per-finding disposition

### M1 (keyword evidence omitted a present standard keyword) — RESOLVED

- `p2-measure-live-spec.ts` now carries an explicit `STANDARD_KEYWORDS` allowlist covering the
  JSON Schema 2020-12 vocabularies and OpenAPI 3.1 fixed fields (including `summary`, `tags`,
  `license`, `contact`, `const`, `prefixItems`, `$schema`), plus HTTP method keys, and every
  non-allowlisted object key is emitted with its full paths in `nonAllowlistedObjectKeys`.
- Independently re-verified: I re-ran the amended script on the committed raw spec into a scratch
  output; excluding `measuredAt`, the regenerated evidence is byte-for-byte structurally identical
  to the committed `P2-no-db.json`. An independent traversal of every object key in the raw spec
  confirms the union of `recursivelyObservedKeywords` and `nonAllowlistedObjectKeys` covers **all**
  keys with an empty remainder and no overlap — no key can now be silently dropped. `summary` is
  present in the committed keyword list.
- The context-blind property-name limitation is documented in the evidence
  (`keywordScanLimitation`) and restated honestly in `P2-verdict.md`.

### Raw-spec retention (M1 action 3) — RESOLVED

`proofs/evidence/P2-no-db-live-spec.json` is exactly 3657 bytes, SHA-256
`8f8cf105d9eecac2b701354815ef94e6d509948019ae4129772759bdf0a985c3`, matching both the scratch copy
and the recorded fetch in `P2-runtime.json` (`fetchedRawBytes: 3657`, same hash). It is
credential-free. Keyword completeness stays auditable after scratch cleanup.

### Verdict sentence (M1 action 4) — RESOLVED

`P2-verdict.md` now states the allowlisted-subset claim precisely, names the present `summary` key,
describes the separate non-allowlisted key record, and states the context-blindness limitation.

### m1 (lint-ignore gate note) — RESOLVED

The worklog static-gate row now reads "No lint-ignore directive in either P1 or P2 experiment."
Verified: neither `p1-post-allocation-manifest.ts` nor `p2-measure-live-spec.ts` contains a
`deno-lint-ignore` directive.

### m2 (undrifted plan-command deviation) — RESOLVED

`drift.md` has an append-only entry ("P2 split fetch/measurement command") recording the filename
change (`p2-measure-spec.ts` → `p2-measure-live-spec.ts`), the split bounded fetch, and the
narrowed permissions (`--no-lock --allow-read --allow-write`, no network), with severity minor and
evidence pointers. `P2-runtime.json`'s command list matches the executed split.

### m3 (digest algorithm) — RESOLVED

`P1-runtime.json` now names `rootDenoLockDigestAlgorithm: "SHA-1"` and `P2-runtime.json` names
`"digestAlgorithm": "SHA-256"`; the historical hex values are unchanged, so the 40-vs-64-hex
distinction is explicit and cross-slice comparison is possible.

## Reconfirmed from the first review

- **Combined P2 `FAIL` stands and remains the only truthful D7/D12 outcome.** The DB branch is
  carried solely as the attributed normalized failure (`P2-db-failure.json`: exit 1, missing
  `--allow-ffi`, `liveSpecAttributed: false`); the ambiguous P1 HTTP 200 remains expressly
  excluded in the failure record, attempts record, and verdict. No partial PASS or `NOT_RUN`
  laundering appeared during amendment.
- **Measurement claims still hold.** Regeneration from the committed raw spec reproduces every
  byte/limit/reference/keyword value in `P2-no-db.json`; the source vs locally-dereferenced
  equality remains legitimate (zero `$ref`s); error views remain `{}`/2 bytes with
  `commonErrorEnvelopeObserved: false` stated, not inferred; truncation policy values still match
  `DEFAULT_TRUNCATION_POLICY`, with the absent whole-result byte ceiling stated explicitly.
- **Scope hygiene.** `git status` shows only run-dir changes; no product, template, or lock churn.
- **#1128 acceptance must remain unchecked.** Only the no-DB half of the required two-scaffold
  measurement exists; the DB half awaits the rescoped `--allow-ffi` product fix. The verdict,
  worklog gate tables, and context-pack all map the combined state to `FAIL` and withhold any
  acceptance or closing-keyword claim. Checking the box would misrepresent a missing required
  measurement as done, exactly what RFC §4 S-17 forbids.

## New blocking findings

None.

## Summary

All four findings from `reviews/S2-fable.md` are resolved with verifiable evidence: the keyword
record is now provably complete over the hash-matched committed raw spec (independent full-key
audit shows zero uncaptured keys), unknown keys are auditable with paths, the limitation is honest,
and the three record-hygiene items are corrected without altering historical values. The combined
P2 `FAIL` is unchanged and correctly not represented as #1128 acceptance. This is advisory slice
review, not IMPL-EVAL.
