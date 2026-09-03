## Summary

Cut NetScript 0.0.7 from the final verified canary.10 content. The native release writer coordinates
workspace versions and regenerates the release-owned assets; no new feature or runtime fix is added.

## Scope

- Release engineering: 64 version/generated-output paths, plus one publish-excluded test correction.
- Parent content: `a2d5b8b75083769b946c03ab772e08f2634e2b35`.
- Release head: `6884b7548a0fdc53a17c52ef343c6025a7527d93`.
- The test asserts the emitted public version pin, then resolves local checkout code before
  invoking the real resource generator. No published file changes beyond the native version cut.
- All milestone issue acceptance is closed, including #1881, #863 and #1712. No new closing keyword.
- Coordinator tracking: #1641; primary coordinator is the sole authorized merger/release writer.

## Validation

- `deno task release:cut -- 0.0.7` — exit 0; all generated outputs, residue scan,
  publish readiness, publish dry-run and `deno ci --prod` PASS.
- [Canary publication](https://github.com/rickylabs/netscript/actions/runs/33762898477) — SUCCESS.
- [Exact published canary.10 E2E](https://github.com/rickylabs/netscript/actions/runs/33763460542)
  — README 13/0, scaffold runtime 104/0, quickstart plus integrity/cleanup 9/0; no retries.
- [Supplementary same-version cleanup proof](https://github.com/rickylabs/netscript/actions/runs/33765493143)
  — README 13/0, post-run AppHosts/containers/volumes/custom networks all zero; caches retained.
- Independent mechanical-delta review and fixture-correction review both PASS in the named
  separate session. Focused fixture file5/0; check/lint/fmt green. Full exact-head CI is running.
  No skipped check is claimed as executed; production canary results are the named runtime evidence.

## Harness

Run: `.llm/runs/release-0.0.7--orchestration/` on coordinator PR #1641.
Primary SOL/high; independent review GLM 5.3 Flash in existing evaluator session
`0039d1ad-72eb-4047-964c-8b326ff65902`. No PLAN-EVAL for a deterministic version-only release.
`impl-eval:skip` prevents duplicate automatic evaluation; it does not waive the named local review.

## Drift / Debt

Stable release notes use the full `v0.0.6` range and a handwritten introduction. The native note
collector's 100-issue page limit will be reconciled with the complete paginated list through its
existing formatter before release handoff. No product change or new canary is needed for notes.

Owner explicitly approved one-time reuse of canary.10 evidence for the publish-excluded test-only
correction after CI revealed an attempt to import stable0.0.7 before it was published. The
original canary workflows remain the provenance; this does not claim a new canary ran or waive CI.
Receipt: `.llm/runs/release-0.0.7--orchestration/receipts/owner-approved-stable-fixture-exception.md`
on coordinator PR #1641. No general inheritance-policy change.

## Definition of Done

- [x] Native coordinated release preparation passed.
- [x] Source candidate has a complete green canary pair and final issue acceptance.
- [ ] Independent release-delta review PASS and required CI green at the immutable head.
- [ ] Close-gate, thread audit and final PR-body/diff review agree with the actual delivered change.

## Post-Merge

Primary runs `release:publish -- v0.0.7 --notes-file <prepared-intro> --prev-tag v0.0.6`.
The stable release is not complete until OIDC publication and its artifact-pinned production E2E
are both green. A GitHub Release record alone is not completion.
