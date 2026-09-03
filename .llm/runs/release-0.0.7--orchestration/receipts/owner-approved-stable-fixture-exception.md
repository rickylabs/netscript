# Owner-approved, one-time canary evidence reuse — stable 0.0.7

The owner answered **yes** to the explicit request to retain canary.10's green evidence after
the publish-excluded test-only correction, then reaffirmed continuing. This is not a general
release-policy change and does not authorize a CI, runtime, review, or publication-gate waiver.

## Exact authorized boundary

- Original content: `a2d5b8b75083769b946c03ab772e08f2634e2b35`.
- Green canary publication: https://github.com/rickylabs/netscript/actions/runs/33762898477.
- Green canary.10 production E2E: https://github.com/rickylabs/netscript/actions/runs/33763460542.
- Native reviewed version-only stable cut: `b8fb15bc136feb98ef81c21d010f43b1ee282798`.
- Independently reviewed correction: `6884b7548a0fdc53a17c52ef343c6025a7527d93`.
- Sole additional path: `packages/cli/src/public/features/root/public-command-tree_test.ts`.
  Its `**/*_test.ts` publish exclusion is unchanged. No shipped file or manifest differs
  between the stable cut and the correction. All original assertions and real subprocesses remain.
- Independent correction review PASS, focused tests5/0 and check/lint/fmt green:
  `eval-readme-cold/evaluate-stable-fixture.md`.

## Execution and non-waived gates

The release branch was fast-forwarded to the exact reviewed correction and explicitly pushed.
Full required CI must pass at that head before merge. Close-gate, thread audit, lifecycle labels
and final body review remain mandatory. No new canary is minted for this excluded-test change.

After the green merge, prove the merged tree is identical to the reviewed correction and re-read
both actual canary workflow conclusions. Record an explicitly described **owner-approved inherited
canary.10 evidence** commit status on that exact stable merge SHA, linking this approval receipt
and the original green pair. This is evidence reuse under the approved exception, not a claim
that a new workflow executed at the merge SHA. Do not write or overwrite any CI check result.

The unmodified native `release:publish` path and `publish.yml` still enforce the canary status,
preflight/readiness and OIDC publication. Stable's exact artifact-pinned production E2E must pass
before completion. Any extra changed path or product delta falls outside this authorization.
