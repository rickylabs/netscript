**[PHASE: IMPL] [SLICE: S4]**

S4 pushed: D4 changes `e2e-cli-prod` to run after successful `publish` workflow completion and pins the published version via a run-id-named artifact.

- Commit: `307981d8` (`chore(release): order prod e2e after publish`)
- Scope: `.github/workflows/e2e-cli-prod.yml`, `.github/workflows/publish.yml`
- Gate: `actionlint` — SKIPPED, not installed in this environment
- Gate: YAML parse via Deno `jsr:@std/yaml` — PASS for both workflows
- Gate: `git diff --check` on both workflow files — PASS
- Manual sanity: `workflow_run` trigger, job success guard, artifact name `netscript-published-version-${{ github.run_id }}`, download from `github.event.workflow_run.id`, and manual dispatch fallback are present. No real release was triggered.
