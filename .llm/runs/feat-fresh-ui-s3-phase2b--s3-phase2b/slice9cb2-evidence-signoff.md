# Independent DataTable/DataGrid committed-source evidence review

PASS (slice 9c-b2 evidence reconciliation at source commit `2fc48299`; no READY)

The public evidence matches the reviewed DataTable/DataGrid source and the gate set. The carriers, quality receipt and native publish were all recorded after the commit, in order, and the public records are reconciled.

- **Tests** (`.llm/runs/feat-fresh-ui-s3-phase2b--s3-phase2b/slice9cb2-validation.json`):
  - 399 contract, 10 installed and 14 catalog tests passed, all with nothing failed or ignored and exit code 0.
  - **Chromium:** 76 cases passed with nothing failed, ignored or flaky, and zero page console errors. The scope covers the four states, RTL, narrow containers, native roles and keys, selection refusal, row versus independent controls, host compositions, pointer text selection, exact `target` restoration and observer count.
  - **Firefox and WebKit:** 44 focused cases passed, explicitly *not* full certification. They include the Shift guard, native middle-click, modifiers and target restoration.
  - **Fresh production consumer:** 2/0 at 390 and 1280, with real `ui:add` fidelity, island hydration, native new tabs for all three `target` values, an unchanged current document, one observer event and native partial navigation.
  - Zero serious or critical axe findings, zero allowances, 24 captures.
- **Wrappers:** source check, lint and format passed on 11 files each, and the browser fixture check (2), spec check (1), lint (3) and format (3) passed, all with nothing dropped.
- **Gates at the commit:**
  - Quality/architecture passed with exit 0 at `2fc48299`.
  - Preflight, docs accuracy, export drift and the docs prose build passed.
  - The native publish dry-run passed with 0 slow types.
  - `publicationAudit` points to the 124 doc-lint failure kept under #2531, with an unchanged set of diagnostics.
- **Carriers:** `gen:mcp-export-corpus` and `gen:publish-assets` were followed by all four freshness checks, all exit 0 at the committed source, with two expected generated MCP changes (see the authoritative clarification below). Only README clarifications and run text changed between the source PASS and the commit, with no runtime code change.
- **Review trail:** `slice9cb2-review.md` keeps the source PASS and records the reasoned decisions on the non-blocking points:
  - keep the serialized `aria-checked`;
  - keep the selection and action click isolation for compatibility;
  - document Ctrl/Meta on button rows.

  All three are acceptable as documented.
- **Honest status:** inventory 104/91/13/120. 20 source files plus 2 generated MCP carriers is inside the limit. `runtime` is `NEW_HEAD_UNPROVEN`, `requiredRemoteCI` is `PENDING_DRAFT_CHECKS_SKIPPED`, `wholePhase2b` is `IN_PROGRESS` and `ready` is `false`. The owned Fresh server is recorded as stopped, with no foreign changes. No absolute home paths or UUID-style identifiers anywhere in the phase 2b run directory.

Non-blocking:
- `docsSiteBuild` is recorded through `deno task gen:agent-docs-prose`. Since that task builds the site to extract prose, it's acceptable evidence, but name it explicitly, for example "site built via `gen:agent-docs-prose`", so it isn't mistaken for the standalone docs build.
- Set `independentEvidenceReview` to this PASS in the evidence commit.

Next, the private public-audit must pass before the normal push and the PR #2538 comment. Only then does AI slice 10a (Marker/Trace/Attachment) begin. The AI, Docs and Desktop units, the extensions and all-style harness, and the final gates are still required.

## Authoritative generated-carrier clarification

PASS (slice 9c-b2 evidence clarification; no READY)

The correction is accurate, and I approve committing both generated MCP files with the evidence.

- **What changed after source `2fc48299`:** the public validation and context records now say so explicitly.
  - `slice9cb2-validation.json` lists `sourceCommitFiles: 20`, `sourceFiles: 22`, and `generatedCarriersAfterSource` as:
    - `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`
    - `packages/mcp/src/publish-assets.generated.ts`
  - `context-pack.md:175` records that these are the two expected generated files, says the earlier "no generated difference" wording was wrong, and requires both to be in the evidence commit.
- **Why the changes are expected:** 9c-b2 adds a public `DataGridState` export to the `@netscript/fresh-ui` root entry point.
  - The export-surface corpus stores each entry point's declarations deflated and base64-encoded with a SHA-256 and a symbol count (`export-surface-corpus.generated.ts:7-9`). So adding a public type has to change the Fresh UI root row. I can't decode the row with read-only tools, but the change is consistent with the generator's documented format.
  - The MCP publish-assets carrier records docs provenance, which changes with it.
  - Both files carry `@generated` headers and say "do not edit by hand".
- **Integrity:** the files came from `gen:mcp-export-corpus` and `gen:publish-assets` run on the committed source, and all four freshness checks then passed, including `check:mcp-export-corpus` and `check:publish-assets` against these exact bytes. No maintained product code changed after the source PASS.
- **Budget:** 20 source files in the commit plus 2 generated carriers makes a 22-file unit, still under the 30-file limit.

My earlier repetition of "no generated source differences" and "20 source files" is withdrawn. The corrected records are authoritative: two generated files changed and the worktree isn't clean until the evidence commit. Everything else in my previous evidence PASS stands.

Next, the private public-audit must pass before the evidence commit, push and PR #2538 comment, and then AI slice 10a. The full assignment is still in progress.
