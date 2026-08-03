# Context pack — ci-scope-expensive-jobs--1152

**State**: implementation complete on PR #1155 (draft), live-verified by demo runs; awaiting the
PR's own full CI green, then acceptance-evidence mirror → ready-merge → merge.

- Branch `ci/scope-expensive-jobs`; PR #1155 (`Closes #1152`). #1151 already SHIPPED via PR #1153.
- Landed: classifier capability vector (needs_deno/docker/desktop/docs/surface) + #1122 precision
  (tier-defining workflows only; root deno.json tasks-only discrimination), consumers in
  e2e-cli.yml / ci.yml / surface-diff.yml (all skipped-by-policy pattern, fail-closed), Node-24
  action bumps.
- Evidence: 50 classifier unit tests; demo run 30827771974 (docs-only → all three expensive jobs
  skipped); demo run 30827782060 (release-workflow-only → same, the #1122 replay).
- Follow-ups: post-merge observation of first real docs-only PR; needs_docker package-set
  tightening against observed green history; sqlite-tier e2e idea filed as its own issue.
- Constraints: label set frozen; skipped jobs still report; unrecognised path ⇒ vector all true.
