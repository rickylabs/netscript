# C1 native documentation corpus repair

use harness

## Scope and ownership

Full ready-event CI at b4ee0c34399cad78ef75aaf3f71fd6d5ac38196a passed Fresh UI quality, but failed the explicit agent-docs prose freshness check and two MCP corpus generator fixtures. The scoped qualification had missed these generated consumers of C1 reference pages and public exports. This follow-up refreshes exactly three generated assets with the existing native generators; no implementation, manifests, locks, tools, workflows or tests change.

The prose corpus retains all182 entries; only llms-full.txt and the contracts/service reference pages change. Both external context entries remain identical. The MCP corpus adds only contracts/commands and service/commands with39 symbols, preserving all7908 existing entries. Provenance version remains0.0.7. See [semantic corpus comparison](./docs-repair-corpus-diff.json) and [all tracked source proof](./docs-repair-source-manifest.json).

## Actual qualification

Both stale baselines reproduce exit1. Existing native rendered-site/bundle generation and MCP generation pass0, followed by full prose freshness0 and MCP freshness0 under exactCI Deno2.9.5. MCP also passes under local2.9.7. Existing bundle4, source-format6 and safe MCP5 regressions pass. No new test requires a mutation: this generated-only repair adds none. Existing product/mutation evidence is source-identical. Supervisor independently decodes both corpora, compares against committed baseline, verifies exact preserved content/integrity and runs native MCP freshness, quality:scan and arch:check, all0. [Actual commands and exits](./docs-repair-gate-evidence.json).

Seven existing MCP fixtures create temporary worktrees from committed HEAD. User layout rules prohibit those local worktrees; normal committed-head repository CI must execute the unchanged fixtures, including the two prior failures. They are pending, not waived or claimed to pass. Full CI remains pending after the signed-off repair. Root uses a separate regular C1 clone inside the task folder while C2's S4 shared checkout remains isolated.

## Evaluation and release state

Round1 report at e64c841bc9c1a9f967afa357b54f454445807db8 and round2 at17e9ad075e595aa591b12e3b009c6aed6c482fbf remain byte-exact in evaluate-round-1.md/evaluate-round-2.md and immutable commits. The new qualification head requires the same opposite-family evaluator session's third review. Current evaluate.md still records historical round2 until that evaluator writes its new report. No new PASS is asserted by this implementation or supervisor review. PR#2082 is draft/status:ci-fail with its closing claim withheld. No merge, force push or publication occurs.
