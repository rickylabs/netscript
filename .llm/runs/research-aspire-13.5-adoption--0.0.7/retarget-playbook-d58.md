# D-58 retarget playbook — exact order and mutations (prepared 2026-08-30)

Rule: a stacked leaf is merged only after its parent is on `main`, its PR base is retargeted to
`main`, the acceptance mirror + close-gate are re-run at the exact head, and
`closingIssuesReferences` equals the intended set exactly. Never merge into a topic branch. Commands
use the REST path (`gh pr edit` needs `read:org` on this token).

## Order (each step unblocks the next)

| Step | PR (slice)                                     | Parent on `main` first         | Retarget       | Verify closing refs      | Runtime proof required at exact head                                    |
| ---- | ---------------------------------------------- | ------------------------------ | -------------- | ------------------------ | ----------------------------------------------------------------------- |
| 0    | #1736 (#1734 Fresh hydration) — owner decision | —                              | already `main` | —                        | unblocks every `scaffold-runtime`                                       |
| 1    | #1727 S1 pin bump                              | #1736                          | already `main` | {#1713}                  | CI `e2e-cli` at exact head (13.5.3 CLI via S1's own workflow pins)      |
| 2    | #1740 S5                                       | S1 (D-19 consumer) + #1736     | already `main` | {#1717, #1370, #979}     | CI `scaffold-runtime` + two-concurrent-start receipt (D-41 audit)       |
| 2b   | #1738 S4                                       | #1736                          | already `main` | {#1716}                  | CI `scaffold-runtime` at exact head                                     |
| 3    | #1743 S6                                       | S5                             | `main`         | {#1718, #1280}           | Phase-B `healthReports` receipts (CI or lease)                          |
| 4    | #1754 S8                                       | S6                             | `main`         | {#1720} (#863 = Part of) | Phase-B db-cli receipts incl. exact `db init --name init` (#863 gate 1) |
| 5a   | #1759 S9                                       | S8                             | `main`         | {#1721}                  | live D-12 MCP smoke receipt (CI on 13.5.3 after S1)                     |
| 5b   | #1760 S10                                      | S8                             | `main`         | {#1722}                  | `scaffold.runtime --cleanup` green with the new receipts, leak = 0      |
| 6    | #1741 S3                                       | #1736                          | already `main` | {#1715}                  | Phase-B telemetry envelopes (CI/off-host)                               |
| 7    | #1744 S7                                       | S3                             | `main`         | {#1719}                  | live #1429 reproduction / foreign-AppHost re-test                       |
| 8    | #1771 S11                                      | S10 (+ S1 for version prose)   | `main`         | {#1723, #1642}           | none (docs) — CI diagram parity green (M5)                              |
| 9    | #1779 S13                                      | S10, S1, S9, S11 (parity flip) | `main`         | {#1724}                  | none — flip commit lands last                                           |

## Mutations (template per PR; `N` = PR number)

```bash
# retarget base (REST)
gh api -X PATCH repos/rickylabs/netscript/pulls/N -f base=main --jq '.base.ref'
# body: keep Closes lines verbatim; refresh the "base" sentence; keep Part-of refs
gh pr view N --repo rickylabs/netscript --json body --jq .body > /tmp/N.md   # edit, then:
python3 -c "import json;print(json.dumps({'body':open('/tmp/N.md').read()}))" > /tmp/N.json
gh api -X PATCH repos/rickylabs/netscript/pulls/N --input /tmp/N.json --jq .number
# close-gate re-run at the exact head
deno task agentic:review-threads -- --repo rickylabs/netscript --pr N --pretty
gh pr checks N --repo rickylabs/netscript            # close-gate job must pass at the new head
gh pr view N --repo rickylabs/netscript --json closingIssuesReferences --jq '[.closingIssuesReferences[].number]'
# runtime proof (off-host): dispatch on the PR's branch ref, keep the run id as the receipt
gh workflow run e2e-cli.yml --repo rickylabs/netscript --ref <branch>
gh run list --repo rickylabs/netscript --workflow e2e-cli.yml --branch <branch> --limit 1 --json databaseId,conclusion
```

## Convergence hazards to resolve by regeneration at the hop

- `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`: regenerated
  on S9 and S13 (`gen:mcp-export-corpus`).
- `agent-docs.generated.ts`, `publish-assets.generated.ts`, `.llm/assets/agent-docs/*`: S11 vs main
  docs merges (`gen:agent-docs-prose`, `gen:publish-assets`).
- `packages/cli/e2e/src/domain/cli-surface.ts`: S9 and S10 both register runtime gates before
  cleanup — keep both entries; order = wait/describe → MCP smoke → behaviour gates →
  resource-command → cleanup.
- S13 vs S1: `check-aspire-version-parity.ts` (S1 phase 1 vs S13 phase 2), `scaffold-aspire.ts`,
  `deno.json` task wiring, the manifest — S13 rebases onto S1 after S1 lands; not mechanical.
