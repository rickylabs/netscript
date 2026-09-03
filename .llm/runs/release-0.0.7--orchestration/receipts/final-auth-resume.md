# Final permission boundary and immediate resume

2026-09-03 10:56Z. Owner requires one intended final canary, then stable immediately after its
true green pair and issue acceptance; no unrelated content drift, no premature version minting.

## Live lanes

- Main d2af6e8b40777720b242aaea639b0e538299cdc8; #1970 merged, #1455 closed/shipped. Its original
  author01a06201-d0b9-7cb1-afe6-8b071ca28012 exited normally, no decisive gate left.
- #1945 new final head d6ffcb5ea73c9b06f3106b8dfff64b3d0d6584b3: existing author
  01a06322-7bb5-7d80-badf-3068fb4942eb, worktree007-leaf-1481, native PID223518 is watching
  core CI33746758886. Source test fix85bd9b65d plus conflict-free main merge33fde3777; 115/115
  selected tests, 1004-file check and carriers green. No new source-evaluation cycle is required;
  preserve scoped PASS and the unchanged-design-product runtime pair33744551964 (104/0,99/0).
  Review final body and issue acceptance, required CI, head identity and review threads, then
  coordinator merges. Closes1481 and1971. Never delegate merge authority to its author.
- Cold README source832e53720baf7a8d11e132d93582c48879a4628e on local
  fix/readme-cold-release-proof, worktree007-readme-cold-release-proof: independent
  PASS_IMPL session0039d1ad-72eb-4047-964c-8b326ff65902, process exited normally. Full verdict and
  completed raw transport are in receipts/eval-readme-cold/, already committed on primary.

## Sole owner action

GitHub stored PAT currently has repo only; new workflow push was explicitly rejected for missing
workflow scope. First device authorization expired; the second is pending in exec session68835
and was surfaced via owner question. Do not bypass this refusal with another endpoint or print
credentials. Read gh auth status after approval; require the actual new scope, not user wording.
If expired, request a fresh code once the owner is present rather than spinning authorization.

After authorization, push the cold-proof branch using the authorized gh credential helper. The
legacy global helper points at a separate local token file; never display it. Prefer a one-command
credential-helper override to gh auth git-credential, clearing prior helper values for that command,
rather than copying a token or mutating shared global credentials. Create the bounded release-proof
PR with Refs #1881 (not Closes), link the independent verdict, truthful DoD and ordinary core CI.

Run e2e-cli-prod.yml at that reviewed workflow branch against existing0.0.7-canary.9 BEFORE minting
the next canary; inspect cold baseline JSON, ordered12 README commands and owned cleanup plus the
whole workflow result. This publishes no version. Measure hosted Docker pre-pull assumptions rather
than betting a new release on them. Fix actual findings before final candidate freeze.

Once #1945 and the cold-proof correction are verified/merged: clean final-head worktree, composed
publish:readiness, then native release-canary.yml target-version0.0.7. The workflow rechecks the
rolling JSR budget before minting (last run33704380711 measured3720/4000 remaining,35 needed;
that historical count is not current authorization). No ad-hoc local publisher or reused version.
Require the new version's exact published production pair and cold README proof; then close1881,
863 and1712 with actual receipts, stable cut/publish and stable-pinned production pair.

Preserve all five capped native Fable supervisors and their models/Remote Control ownership.
No new quota probe, no global runtime lease, no Docker/Aspire resource creation occurred here.
Last host audit10:30Z: zero apps/containers/custom networks. Harness retention remains owner-controlled.
