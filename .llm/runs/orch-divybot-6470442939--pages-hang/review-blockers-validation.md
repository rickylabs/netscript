# Review blockers — validation

Baseline source: 8c86721b7. Comparison corpus includes main 96d13d294 merged before repair.
Raw command logs, structured reports and native receipts remain outside Git; public summaries
contain only repository-relative source paths and aggregate results.

## Red-before controls

- Unknown JSR export after an ordinary type-error fence: structured test exited 1 because
  unattributed_failure was false instead of true. Actual diagnostics include Unknown export.
- Deploy timeout contract: structured test exited 1 because deploy had no finite timeout.
- Timer disabled locally: independent fixture watchdog rejects at 5,000ms; structured wrapper
  exits 1 in 7.424s including startup/checking. It no longer hangs for 150 seconds.
- Group SIGKILL disabled locally: inherited-pipe descendant marker survives, assertion fails;
  wrapper exits 1 in 3.136s. No assertion or gate was relaxed.
- Original compiler: initial snippets PASS in 84.838s; initial README stopped at a 240s external
  safety bound. Full warm baseline repetition passed: snippets 98.574s, README 277.052s. Mutations are restored in finally.

## Warm comparison

All measured invocations exited zero; root lock remained unchanged.

| Command | Main compiler run 1 / run 2 | Repaired run 1 / run 2 | Median change |
| --- | ---: | ---: | ---: |
| docs:snippets | 11.403s / 11.184s | 12.397s / 10.649s | +2.0% |
| docs:readme-fences | 22.851s / 21.312s | 24.006s / 21.120s | +2.2% |

Main's compiler was loaded temporarily into the current task plumbing against the same corpus,
then restored. Both repaired rounds are within 20% of the corresponding main baseline. The
latest README census is 36 READMEs, 100/100 TypeScript-like fences, five known errors across
four READMEs, no syntax invalidity and no unattributed failure.

## Gate status

Final structured combined suite: **38 PASS**, zero failed, 37.033s wrapper time. It includes
all original snippet, README policy and workflow tests plus the new batching/export/deploy cases.
Actual `deno task docs:snippets:test`: **27 PASS**, zero failed, 23.083s wall time.
Structured check and format: **PASS**, 53 source files each. Scoped structured lint: **PASS**,
all seven touched TypeScript source/test files. Root lock unchanged.

All **23 native gate receipts are PASS**, exit zero. Commands use the allowlisted
`.llm/tools/gates/run-gate.ts --gate <gate>` runner. Receipts attest pre-commit commands; the
reviewed source fingerprints below tie this working tree to the later signoff commit.

| Native gate | Exit | Seconds |
| --- | ---: | ---: |
| quality-gate | 0 | 30.119 |
| docs-source-format | 0 | 0.519 |
| docs-source-format-test | 0 | 3.247 |
| quality-job | 0 | 329.632 |
| prod-install | 0 | 0.666 |
| lint-report | 0 | 8.888 |
| fmt-check-report | 0 | 2.825 |
| docs-tagline | 0 | 0.315 |
| docs-accuracy | 0 | 6.633 |
| jsdoc-example-compile | 0 | 55.126 |
| readme-fences | 0 | 10.489 |
| agent-docs-prose | 0 | 10.987 |
| mcp-export-corpus | 0 | 8.782 |
| assets-barrel | 0 | 2.068 |
| publish-assets | 0 | 0.565 |
| emitted-samples | 0 | 7.027 |
| netscript-jsr-specifiers | 0 | 1.517 |
| scaffold-versions | 0 | 0.265 |
| aspire-version-parity | 0 | 0.466 |
| publish-dry-run | 0 | 43.904 |
| ai-peer-resolution | 0 | 13.359 |
| audit-critical | 0 | 0.616 |
| exports-drift | 0 | 4.625 |

Additional actual commands:

- `deno ci`: PASS, 0.668s, frozen workspace install.
- `deno task release:preflight`: PASS, 2.275s.
- `deno task --cwd docs/site verify`: PASS, 13.352s, build/render/link/caveat verification.
- `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`: exit 1, 5.679s.
  Aspire doctor preflight fails and Docker is unavailable. Runtime behavior is UNPROVEN.
  The suite and all CI gates remain intact.
- `deno task check:review-threads -- --repo rickylabs/netscript --pr 2458 --pretty`: PASS,
  three answered threads, zero unanswered.
- Read-only resource inspection: completed. No foreign/unknown resource mutation.
- Root tracked lock unchanged and `git diff --check` clean.

The final native README receipt passes in 10.489s, with the same 100/five/four/false census.
Independent read-only IMPL-EVAL follows before the repair signoff commit.


## Source identity submitted for review

| Source | Git blob |
| --- | --- |
| `.github/workflows/pages.yml` | `1e24cb643d19757be3f708dffbab4bf0a6d6ebce` |
| `.llm/tools/docs/check-readme-fences.ts` | `19038aa38c484eccf9bab4c019b3c1a56b4b0f7a` |
| `.llm/tools/docs/pages-workflow_test.ts` | `c6e152f2afab8ec964b25b38a9c753795b6bf7a8` |
| `.llm/tools/docs/snippet-compiler.ts` | `097b3ec59f48f7634cdba5e1eb6281b2c478fa76` |
| `.llm/tools/docs/snippet-compiler_test.ts` | `0f277cf5b3f2b4258a50af441d87401fdf0c0ca0` |
| `.llm/tools/docs/snippet-process.ts` | `75fb6b341257ac6a38f662a12a7c0efa9c52203a` |
| `.llm/tools/docs/snippet-process_test.ts` | `e8dcf884980463d95b527f3c22bdb94f9141acf4` |
| `.llm/tools/docs/snippet-test-watchdog.ts` | `d6d682488d9361f5ad3c4fab338642cd9e7f1cb0` |
| `.llm/tools/docs/fixtures/unknown-export/README.md` | `763172be5df51fbc84920e0b0ef3a0258abb11bd` |

## Independent signoff

**PASS**, native `claude-opus-5-5`, high effort, separate Anthropic session, read-only
Read/Glob/Grep and closed stdin. Exit zero after 202.241s, zero permission denials, no fixes
required. The reviewer inspected raw evidence and recomputed the paired timing medians.
Approved source fingerprints match the table above. No merge/release approval is implied.
