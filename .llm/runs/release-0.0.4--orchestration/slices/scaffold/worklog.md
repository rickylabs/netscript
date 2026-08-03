# Scaffold agent surface worklog

## Slice 1 — #1071 + #1073

- Implementation commit: `a12e002a6` — `feat(cli): generate app-scoped AGENTS.md and WEB-LAYER.md naming canonical examples`
- Review/test follow-ups: `cfd9ec5b5`, `776500632`, merge `baeb18cae`, final R3 correction `04afc1635`.
- Push target: `origin/feat/1071-scaffold-agent-surface`.

### Gate evidence actually read

| Command | Output read |
| --- | --- |
| `deno test -A --unstable-kv --minimum-dependency-age=0 packages/cli/src/public/features/ui/add/add-ui-command_test.ts packages/cli/src/public/features/root/public-command-tree_test.ts` | `ok \| 4 passed \| 0 failed (1s)` after R1/R2; the generated fixtures reported `Created: 168 files, 36 directories` with service and `Created: 146 files, 23 directories` without service. |
| `deno test -A --unstable-kv --minimum-dependency-age=0 packages/cli/src/public/features/ui/add/add-ui-command_test.ts` | After R3 whitespace normalization: `ok \| 1 passed \| 0 failed (19ms)`. |
| scoped lint wrapper over six owned TS files | JSON summary: `filesSelected: 6`, `exitCode: 0`, `totalOccurrences: 0`, `uniqueOccurrences: 0`. |
| scoped fmt wrapper over the two new TS files | JSON summary: `filesSelected: 2`, `failedBatches: 0`, `findings: 0`. |
| first six-file scoped fmt attempt | RED, read verbatim: `packages/cli/src/public/features/ui/add/add-ui-command.ts` — `-import { Command } from "@cliffy/command";`. This is pre-existing legacy CLI formatting; the root format task explicitly excludes `packages/cli`. No unrelated formatting churn was retained. |
| `deno task quality:scan` | `{"ok":true,"mode":"repository","scanned":["packages/cli/src","plugins"],"findings":[],"allowCount":7,...}`. |
| `deno task arch:check` | Exit 0. Every printed doctrine unit reported `FAIL=0`; existing WARN/INFO findings remained, including catalog warnings and package documentation/cardinality warnings. |
| `deno task check` | Started, but the supervising turn was interrupted before its final report was observed. Not claimed as green and not rerun per supervisor instruction. |

### Review proof

- R1 compares the unique set of path-like backticked Markdown tokens with `appConventionsReferencedPaths(input)`, then resolves every declared path against the generated filesystem. The supervisor independently mutated a declared path to a nonexistent file and observed the fixture fail with `NotFound`.
- R2 adds rendered help examples that describe the page route + colocated hydrating island + query loader as one data-screen unit and distinguishes that flow from copying a registry item.
- R3 collapses rendered help whitespace before full-sentence assertions, making the help test independent of terminal-width wrapping.

## Slice 2 — #1072

- Commit: `b4dcf83c9dc6e617e7ad632d37595f8db74eff19` — `feat(cli,mcp): gate drift entries on diagnostic evidence and announce the agent surface`
- Pushed to `origin/feat/1071-scaffold-agent-surface`.
- Decision: diagnostic receipts are project-local JSON files under `.netscript/agent/diagnostics/`, keyed by resource. Only exit-status-0 receipts no older than 15 minutes authorize an entry; drift entries append to `.netscript/agent/drift.jsonl`.

### Gate evidence actually read

| Command | Output read |
| --- | --- |
| scoped Slice 2 tests (`drift-evidence`, MCP docs/stdio, agent init/drift, plugin doctor) | `ok \| 35 passed \| 0 failed (2s)`. This included no-receipt, stale, non-zero, fresh, CLI/MCP shared gate, actual MCP doctor receipt, actual plugin doctor receipt, initialize instructions, and help symptom search. |
| broader MCP + affected CLI test set | `ok \| 74 passed \| 0 failed (3s)`. |
| final affected MCP + CLI test matrix observed in this turn | `ok \| 73 passed \| 0 failed (8s)`. |
| `deno task check` | Completed with no diagnostics; output read: `Task check deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages --root plugins --ext ts,tsx --exclude ...`. |
| `deno doc --lint` over all nine added/changed MCP implementation files | `Checked 9 files` with no documentation errors. |
| `deno task doc:lint --root packages/mcp --pretty` | JSON summary: `totalPackages: 1`, `totalErrors: 0`, `totalPrivateTypeRef: 0`, `totalMissingJSDoc: 0`, `totalOther: 0`; both `./cli.ts` and `./mod.ts` reported `total: 0`. |
| `deno task lint` | JSON summary: `exitCode: 0`, `filesSelected: 1748`, `batches: 9`, `totalOccurrences: 0`, `uniqueOccurrences: 0`. |
| scoped CLI lint wrapper | JSON summary: `exitCode: 0`, `filesSelected: 18`, `totalOccurrences: 0`, `uniqueOccurrences: 0`. |
| `deno task quality:scan` | `{"ok":true,"mode":"repository","scanned":["packages/cli/src","plugins"],"findings":[],"allowCount":7,...}`. |
| `deno task arch:check` | Completed; every printed doctrine unit reported `FAIL=0`. Existing dependency-catalog and doctrine WARN/INFO findings were unchanged. |
| scoped fmt wrapper | RED tooling verdict with zero findings: `Failed to parse "workspace" configuration. Caused by: invalid type: string "packages/*", expected struct WorkspaceConfig`. No formatting difference was reported. |

### Explicit acceptance gap

- The issue's fourth criterion, “a follow-up agent run shows non-zero MCP diagnostic tool usage,” is not achievable or measurable inside this PR. It was not implemented, simulated, or marked complete. A post-merge/follow-up harness run must supply that evidence.

## Slice 3 — #1024 — stopped before implementation

- No Slice 3 commit was created. At stop time the shared worktree contained concurrent/uncommitted partial Slice 3 edits (`agent-grade-manifest.json`, generator/task wiring, and installer wiring); they were not authored, completed, reverted, or claimed by this run.
- The issue's required consumer e2e smoke cannot be satisfied by embedding the named `.llm/tools/e2e/scaffold-e2e-test.ts`. The current script imports repository-internal `../agentic/teardown/probes.ts` and `../agentic/teardown/run-resources.ts`, infers a NetScript repository root from its own path, defaults the CLI to `<repo>/packages/cli/bin/netscript-dev.ts`, and writes under `<repo>/.llm/tmp/`.
- A generated consumer project has none of those internal modules or repository paths. Copying the file would therefore violate the acceptance criterion that the scaffold run the smoke without cloning the framework repository.
- The concurrent manifest attempts to include four teardown support modules, which resolves the two static imports, but it does not resolve the runner's default dependency on `<repo>/packages/cli/bin/netscript-dev.ts` or its framework-repository project model. Those partial files remain for supervisor disposition.
- Making the smoke consumer-grade requires extracting/replacing its teardown ownership adapters and redesigning CLI/project discovery across the 1,600+ line runner. That is unbounded relative to this slice and cannot honestly be represented by a manifest/install-only change.
- Per the slice instruction, implementation stopped rather than half-shipping the other seven tools or claiming a broken e2e task. Supervisor direction is required to rescope the smoke into a bounded consumer runner or explicitly split that acceptance criterion into follow-up work.

### Evidence actually read

| Command | Output read |
| --- | --- |
| `gh issue view 1024 --repo rickylabs/netscript --json title,body,url` | The full issue lists eight tools and requires: “A scaffolded project can run the full e2e smoke without cloning the framework repository.” |
| import/path inspection of `.llm/tools/e2e/scaffold-e2e-test.ts` | Imports at lines 19–20 reference `../agentic/teardown/probes.ts` and `../agentic/teardown/run-resources.ts`; defaults at lines 201–217 reference the framework repo, `packages/cli/bin/netscript-dev.ts`, and `.llm/tmp/`. |
