## Summary

Gate every issue GitHub will close—including Development-sidebar and commit-message references—and report why each issue is in the closing set.

## Scope

- Area: close-gate / GitHub process automation
- Closes #1188

## Slices

- [x] S0 Issue-first research and draft surface — `cce241f60`
- [x] S1 Authoritative closing-reference discovery and provenance — `6b8706f3e`
- [x] S2 Negative/compatibility regressions and ready handoff — `6b8706f3e`

## Validation

- Validation tool suite: 40 passed
- Targeted `deno check`: pass
- Scoped lint/fmt: 17 files, 0 findings
- Live PR #1303: body-keyword source discovered; unchecked acceptance failed as expected
- Live PR #1180 after manual-link removal: no closing references; pass

## Harness

- Run dir: `.llm/runs/fix-close-gate-manual-links-1188--1188/`
- Route: openai / gpt-5.6-sol / medium
- D6 composed evaluation; no local PLAN-EVAL

```acceptance-evidence
issue: 1188
entries:
  - box-index: 1
    evidence: "The authoritative closingIssuesReferences union feeds the existing acceptance scan; the manual-only fixture resolves #1166 as manual link and unchecked acceptance makes closeGatePasses false."
  - box-index: 2
    evidence: "JSON carries closingIssueReferences and pretty output prints body keyword, commit message, or manual link; source-union and pretty-output regressions cover all three labels."
  - box-index: 3
    evidence: "The fixture proves manual link + unchecked box fails and removing the authoritative link yields an empty set/pass; live PR #1180 after link removal also passes with no closing references."
  - box-index: 4
    evidence: "Body-only resolver regression remains #1171/body keyword; live PR #1303 discovers its Closes #1188 body keyword and fails on the unchanged acceptance gate."
```
