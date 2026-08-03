use harness

# Composed milestone implementation augment — PR #1194 / issue #1131

Perform the OpenHands cloud augment that participates in the milestone-run composed final
evaluation. This is review-only: do not edit product code, tests, package docs, PR/issue bodies, or
labels. Do not merge. If you find a defect, report it with a failing verdict and a concrete remedy;
do not implement it in this run.

## SKILL

- `netscript-harness` — apply the tracked run-artifact and evaluator-separation contracts.
- `netscript-doctrine` — review the `packages/mcp` Archetype-2 port/adapter layering and gates.
- `netscript-tools` — use repo-native scoped validation and evidence rules; preserve lock hygiene.
- `jsr-audit` — verify the new public port/adapter exports, docs, and dry-run evidence.
- `netscript-deno-toolchain` — use native Deno inspection/check/doc/publish commands correctly.
- `netscript-pr` — understand the authoritative DoD and closing-keyword/acceptance close gate.
- `aspire` — validate the Aspire 13.4 machine-query adapter contract and explicit failures.
- `openhands-handoff` — write the required tracked verdict and `OPENHANDS_SUMMARY_PATH` output.
- `rtk` — keep git/gh/read-heavy validation output compact.

## Authority and scope

Review the complete PR diff from baseline `2c8865e8c` through the checked-out PR head. Read first:

- issue #1131 and RFC PR #1123;
- `.llm/runs/test-openapi-mcp-wave0-proofs--wave0/proofs/P1-verdict.md`;
- `.llm/runs/test-openapi-mcp-wave0-proofs--wave0/proofs/P3-verdict.md`;
- `.llm/runs/feat-openapi-mcp-endpoint-directory--s5/plan.md`;
- `.llm/runs/feat-openapi-mcp-endpoint-directory--s5/worklog.md`;
- `.llm/runs/feat-openapi-mcp-endpoint-directory--s5/review-codex-complex.md`.

The qualified F1(b) ruling is binding: effective precedence is
`override > aspire-cli > run-manifest > appsettings`, with Aspire CLI the primary live source and
run-manifest still first-class additive. P3's exact `spec_unavailable` guidance is binding. S5 must
not import the parallel S4 projection domain.

## Decisive checks

Independently verify both issue acceptance gates:

1. The fixture matrix covers every source outcome and status row, including foreign-root manifest,
   torn manifest with healthy appsettings, and reused-port identity mismatch.
2. A non-cooperative hanging spec fetch yields a row-local timeout while healthy directory rows
   return.

Also inspect explicit Aspire CLI absent/non-zero/parse failures, real-root + current-run manifest
identity, deterministic conflicts, exclusions before fetch, parent cancellation, credential- and
redirect-free bounded requests, spec-first identity, path-mounted overrides, public JSDoc/exports,
and no S4 coupling. Run the focused fixtures and the smallest static/package/doc/JSR/publish gates
needed to validate the recorded claims. The full CLI scaffold E2E is outside this package-only
surface and is not required.

## Output and hygiene

- Write the formal cloud augment verdict to
  `.llm/runs/feat-openapi-mcp-endpoint-directory--s5/evaluate.md`.
- Write `OPENHANDS_SUMMARY_PATH` with the same verdict, decisive evidence, findings, commands, raw
  exits, and residual risks.
- Emit `OPENHANDS_VERDICT: PASS` only if both acceptance boxes and all substantive contract claims
  are proven; otherwise use the appropriate failing verdict.
- Do not mutate or commit `deno.lock`; compare it to true base `2c8865e8c` before finishing.
- Do not add lint ignores, unsafe casts, generated scratch, or unrelated files.
