use harness

## SKILL

- netscript-harness — substantive independent S3 review; do not edit, commit, push, or comment.
- netscript-pr — preserve the isolated last workflow commit and PR contract.

Review only the current uncommitted S3 workflow diff for issue #1881 plus its interaction with the
already committed `readme.quickstart` suite. The coordinator requires a step immediately after
`quickstart.walk` in `.github/workflows/e2e-cli-prod.yml` running the published JSR CLI suite with
`--cleanup`, the exact report path `.llm/tmp/readme-quickstart-prod-report.json`, and exact log path
`.llm/tmp/readme-quickstart-prod.ndjson`; the report must join the failure-summary loop and artifact
upload. It must not touch release refs/workflows, publication, tags, or Canary 8. Runtime suites may
not be run locally.

Inspect the actual diff and relevant suite/report conventions. Verify YAML syntax/expressions,
step ordering and conditions, exact CLI/version wiring, failure reporting, artifact paths, and that
the change does not weaken existing evidence. Static evidence: YAML_PARSE_OK through pinned
`@std/yaml` with `--no-lock`; check 229 PASS; 314 tests PASS; format 229 PASS; suites/gates PASS;
lint is the documented unchanged fixture coverage refusal with zero findings.

Return exactly `PASS` or `CHANGES_REQUIRED`, followed by concise severity-ranked findings with
file/line references. Do not modify files.
