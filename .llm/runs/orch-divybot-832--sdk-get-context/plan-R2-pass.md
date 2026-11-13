# Independent exact-R2 plan review — PASS

This is a publication-safe intake summary prepared by the implementation session,
not a new evaluation or a source-work authorization. The original independent
review was read in full and has SHA-256
`0c76011c98c1268009f16266b0df8a10e4f4423eba60cda7d280f53c03f53c32`.
Operational review-launch identifiers are omitted from this summary.

## Exact reviewed identity

- Source #2610; PR #2611; assignment rickylabs/harness#832.
- Verdict: **PASS (exact plan)**, R2 of the same review; one prior R1 FAIL, no reset.
- Reviewer reported in the original verdict: claude-opus-5-5, high, read-only.
- Reviewed head: `f78014899dbbc6df80c59a18e7821966d79fbe61`.
- Reviewed tree: `a633b029ed59196fbe2ca35666b0f65766d15adb`.
- Product baseline: `12c981104c1d13812d7119798911a0937e74348c`.
- Plan-R2 SHA-256: `d71172463c9539a62a8c34ae04c546df9a689cf28b35d968ea35095093b9b58e`.
- Immutable-manifest-R2 SHA-256: `5c3b762af1f5047bad1a96ce3650b09801688d452794f53ef917c8c848e79114`.
- Retained R1 verdict SHA-256: `731003f7a6101fa00b594d6578f6232533ac68b2b775427e977bc7a4521d3cb1`.

The intake verified head/tree and both sealed artifact hashes against the verdict.
All sealed R1/R2 evidence and protected source files still match their manifests.
This adjacent evidence addition changes none of those reviewed bytes.

## Independent findings

The reviewer closed B1–B3 and found A1–A5 satisfied. The independent rerun of the
public API controls reproduced two semantic RED assertions (one actual fetch,
two expected) and two GREEN controls, with no compiler, timeout, skip or sanitizer
failure. This is confirmation of baseline regression evidence, not a fixed SDK.
The reviewer also reran content scans at the exact reviewed head over all 32 run
files with no findings and manually reviewed the added content. The mutation
protocol, explicit per-API tradeoffs and supported upstream seams were accepted.

Carry these non-blocking advisories into authorized implementation:

- N1: document stopping accidental native fallback-POST coalescing as an intended
  dedupe change, while preserving its wire method/path/body behavior.
- N2: future slice content evidence needs a normalized head-bound derivative in
  a following evidence commit or an independent reviewer rerun.
- N3: constrain scanner output exclusion to a LEAK-*.json file inside this run;
  report actual added-source file/new-file line when improving patch diagnostics.
- N4: name SSR per-request QueryClients as a concrete different-client case in
  S3 documentation; queryUtils cross-request transport coalescing ends there.

## Remaining authority and acceptance gates

The original verdict explicitly states this plan PASS **does not authorize source
work**. Separate explicit parent product continuation is still required. It makes
no implementation sign-off, readiness, merge, runtime, deploy or publication claim.
Product S1–S3, mutation/restored-GREEN receipts, independent exact-head IMPL-EVAL,
actual required CI/runtime/E2E, publication and unchanged consumer acceptance
remain unproven. Parent owns continuation/merge; Eric retains package cuts.

PR #2611 must remain draft until the authorized repair and required qualification
are complete. Mergeable status or skipped checks do not satisfy that completion.
