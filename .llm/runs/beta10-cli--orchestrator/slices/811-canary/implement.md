use harness

## SKILL
- netscript-harness; netscript-release (READ FULLY — you are extending its flow); netscript-tools; netscript-deno-toolchain; jsr-audit; netscript-pr; rtk

## Slice: implement #811 — the canary publish channel + publish-readiness automation (enterprise-grade, mandatory gate)

Worktree `/home/codex/repos/b10-canary`, branch `feat/811-release-canary`, base = current main. PR base: main.

READ FIRST: issue #811 (the ratified design — GitHub API via resolveGithubToken in `.llm/tools/agentic/lib/agentic-lib.ts`, fallback ~/.config/gh/hosts.yml oauth_token), PR #810 (the preflight sunset criterion you must integrate), and the existing `.llm/tools/release/` toolbelt (cut.ts, github-release.ts, jsr-provision-packages.ts, preflight-release.ts, publish-workspace.ts, run-publish.ts) + `.github/workflows/publish.yml` and `e2e-cli-prod.yml` — REUSE their machinery; the canary is the same pipeline pointed at a canary version, not a parallel reimplementation.

Deliverables:
1. **`release:canary` task + `.llm/tools/release/canary.ts`**: derives the canary version `<next-version>-canary.N` (N auto-incremented from existing JSR versions), performs the same bump/residue/preflight/dry-run gates as cut.ts (factor shared logic out rather than duplicating), and does NOT create a release PR — canary cuts live on an ephemeral branch/tag only.
2. **`.github/workflows/release-canary.yml`** (workflow_dispatch with the target stable version as input; optionally auto on release-prep branches): runs publish-readiness (below) → provisioning → the SAME real-publish path as publish.yml but for the canary version, never `make_latest`, and on success auto-dispatches `e2e-cli-prod.yml` with `published-version=<canary>` — the post-canary live production CI. Job summary states the green-pair verdict.
3. **`.llm/tools/release/publish-readiness.ts`** + task: composed pre-publish verdict — new-package detection (workspace member absent on JSR → first-publish checklist: README production-standard scoped to publishable packages, tagline byte-cap, license/exports present, provisioning dry-check), publish-set completeness vs workspace globs, lockstep version + residue validation, and the import-attribute preflight (carry #810's check with its denoland/deno#35546 sunset criterion in the failure message). Per-check structured evidence output (Gate-log discipline); each check proven-to-fail on a seeded violation in tests.
4. **Doctrine**: update the netscript-release skill SOURCE (`.agents/skills/netscript-release/SKILL.md`) + regenerate mirror: canary-first flow is MANDATORY — "no release:publish without a green canary pair (canary publish + canary-pinned e2e-cli-prod) for the same content"; document the canary version scheme, yanking policy, and that ad-hoc publishing is prohibited. Where practical add the check: github-release.ts warns/fails if no green canary pair exists for the content sha (best-effort lookup via the API; if too complex, document-only and say so).
5. Coordinate with PR #810 (in flight, touches preflight): read its branch `fix/mcp-readme-text-import`; do NOT duplicate its changes — design publish-readiness to CALL the preflight, and note the integration in both PR bodies.

Gates: full test pass over `.llm/tools/release/` (existing + new; every new check proven-to-fail on seed); `deno check --unstable-kv` on touched TS; YAML structural sanity for the workflow; `agentic:sync-claude:check`; no new suppressions; changed-file quality:scan.

Push explicit refspec `git push origin HEAD:refs/heads/feat/811-release-canary`; DRAFT PR to main with `Closes #811`, labels `type:feature, area:tooling, gate:ci, priority:p0, status:impl-eval`, milestone 13. No self-evals; do not merge. NOTE in the PR body anything requiring OWNER action (e.g. repo settings, environments, or JSR scope permissions for canary versions).
