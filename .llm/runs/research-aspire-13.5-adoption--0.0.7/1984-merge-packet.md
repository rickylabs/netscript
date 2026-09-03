# Merge packet — PR #1984 `chore(release): cut 0.0.7`

- PR: https://github.com/rickylabs/netscript/pull/1984 — non-draft, base `main`, `status:ready-merge`
- **Exact head: `6884b7548a0fdc53a17c52ef343c6025a7527d93`** — merge this SHA only
- mergeStateStatus **CLEAN**; review threads **0/0 unanswered**
- Commits over main `a2d5b8b75`: `b8fb15bc1` version-only cut · `6884b7548` publish-excluded test fixture

## Exact-head CI (run 33770214410 + 33770214389/33770214363/33770214195) — all green
quality · check-test (13m24s) · close-gate · code-quality · build · fresh-ui-quality · classify changes / Fresh UI / docs-site · core CI lane visibility

The earlier `check-test` red was the Docker Hub / Cloudflare outage (`502 Bad Gateway` pulling
`redis:7-alpine`), not repository content. It passed unchanged on rerun with no code change.

## Evidence verified independently by the topic supervisor
- Canary pair GREEN on `a2d5b8b75`: `release/canary-pair` = success, "Canary 0.0.7-canary.10 publish
  + pinned production E2E passed" (publish 33762898477, pinned E2E 33763460542, cleanup 33765493143).
- `git diff --name-status b8fb15bc1..6884b7548` → exactly one path,
  `packages/cli/src/public/features/root/public-command-tree_test.ts`.
- `packages/cli/deno.json` publish `exclude` contains `**/*_test.ts` → **no shipped file differs**
  from the reviewed version-only cut. The owner-approved exception's core claim is true.
- Independent release-delta review PASS at this exact head, separate session
  `0039d1ad-72eb-4047-964c-8b326ff65902`.
- Aspire epic closed: #1881, #863, #1712 all CLOSED.

## BLOCKING pre-publish step (verified by running the real gate)
`deno task release:verify-canary-pair` at this head fails closed:

    Stable publication blocked: 6884b7548… has no green release/canary-pair status, and the
    immediate parent cannot be used because the current commit contains non-version changes.

`verifyGreenCanaryPair` checks HEAD's status first, then only tolerates a version-only HEAD^ diff.
The test-fixture commit makes the delta non-version-only, so parent evidence cannot be inherited
automatically. **After merge, record the owner-approved inherited canary.10 evidence
`release/canary-pair` status on the exact stable merge SHA** (per
`receipts/owner-approved-stable-fixture-exception.md`) or `release:publish` and `publish.yml` will
both fail closed.

## Post-merge sequence
1. Verify merged tree == reviewed correction; write the inherited-evidence status on the merge SHA.
2. `deno task release:publish -- v0.0.7 --notes-file <.llm/runs/release-0.0.7--orchestration/release-0.0.7-intro.md> --prev-tag v0.0.6`
3. `publish.yml` (OIDC) green, then its artifact-pinned `e2e-cli-prod` green. Both required; a
   GitHub Release record alone is not completion.
