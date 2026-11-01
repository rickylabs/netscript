# Plan & Design — READY FOR REVIEW

Contract before implementation:
- All rendered callout twins use only GitHub NOTE/TIP/IMPORTANT/WARNING/CAUTION markers.
  Legacy error and danger aliases serialize as CAUTION through both authoring paths, retaining
  content, custom titles and destructive HTML semantics. Unknown input still fails closed.
- Only --ns-studio-api-kind-number-text may receive the independently sourced orange-12 exemption.
  Other exemption keys cannot suppress red detection, including through aliases. Matching remains
  exact-value-based and token-layer-only. Existing raw-color and role checks stay enforced.

S0: record contract, source/gates and tracker intake; open draft PR.
S1: add red regressions; implement both mappings and exemption-name restriction; generated twins,
  browser controls and current source tests prove behavior. Own tools/docs-site, docs plugins and
  existing docs browser tests only.
S2: refresh four carrier chain outputs; all15 check tasks, docs/build/rendered/links/accuracy,
  structured source wrappers and actual Chromium docs checks; separate read-only implementation
  review before sign-off/push. Full CLI runtime CI once during readiness; no release or merge.

PLAN-EVAL: N/A. This is a bounded bug fix to two existing data contracts with no new architecture,
component design, dependency or routing choice. Mandatory independent IMPL-EVAL remains.
Deferred: S3 fingerprints (explicit dependency), existing owned S3/S7/scaffold PRs, paused themes,
Pagefind strict determinism owned by #2453, unrelated token or style changes.
