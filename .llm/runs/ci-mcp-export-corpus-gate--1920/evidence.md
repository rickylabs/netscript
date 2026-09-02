# Evidence — #1920 MCP export-corpus CI gate

All command verdicts record the child command's real exit code using
`out=$(command); rc=$?`; no verdict is derived from a pipeline.

## Baseline

- Branch: `ci/mcp-export-corpus-gate`
- Base: `ec848e6b0334ec8fcd2bc66ba009305d35367b01`
- Initial tree: clean
- `deno task check:mcp-export-corpus`: `REAL_EXIT=1`; emitted
  `MCP export-surface corpus is stale; run deno task gen:mcp-export-corpus`.

## Determinism

All three generations ran while Git `HEAD` remained the exact pinned base. The run artifacts were
uncommitted and do not participate in corpus discovery.

| Environment | Generator exit | Generated-file SHA-256 | Payload SHA-256 | Subpaths | Symbols |
| --- | ---: | --- | --- | ---: | ---: |
| Warm cache 1 | 0 | `906827e588700236fb663fa423a527cbf73f0ed150e51f22b471d73baac9956f` | `749a692aa86a9d978a187865e4a28fd4b7bf0c3b4b22435b2bdb9b3f50253f73` | 272 | 7,803 |
| Warm cache 2 | 0 | `906827e588700236fb663fa423a527cbf73f0ed150e51f22b471d73baac9956f` | `749a692aa86a9d978a187865e4a28fd4b7bf0c3b4b22435b2bdb9b3f50253f73` | 272 | 7,803 |
| Pristine `DENO_DIR=/ephemeral/tmp/tmp.pTbHbGV0Gg` | 0 | `906827e588700236fb663fa423a527cbf73f0ed150e51f22b471d73baac9956f` | `749a692aa86a9d978a187865e4a28fd4b7bf0c3b4b22435b2bdb9b3f50253f73` | 272 | 7,803 |

- Warm repeat byte equality: `true`.
- Warm/pristine byte equality: `true`.
- Generator provenance also agrees on framework `0.0.6`, 35 packages, 2,185,819 uncompressed
  bytes, and 316,584 compressed bytes.
- The task-owned pristine cache was not deleted because repository policy forbids cache deletion
  without approval.

## Trigger path

The generator reads the root manifest, each immediate `packages/*` and `plugins/*` manifest, each
declared published entrypoint, and the transitive module/dependency graph observed by `deno doc`.
The classifier reaches `RUN_DENO` for those inputs as follows:

- package/plugin non-Markdown source and generated output hit `CODE_PREFIXES` and set `deno=true`;
- nested `deno.json`/`deno.jsonc` and any `deno.lock` hit `isDenoConfigBase` and set `deno=true`;
- root `deno.json` sets `deno=true` for both tasks-only and toolchain changes;
- the TypeScript generator under `.llm/tools/docs/` is a code extension under a docs prefix and
  sets `deno=true`;
- `.github/workflows/ci.yml` is tier-defining and sets `deno=true`;
- unknown paths fail closed toward all capabilities.

In `ci.yml`, `quality` is selected when classifier failure occurs or `needs_deno || needs_docs` is
true. `RUN_DENO` is true on classifier failure or `needs_deno=true`, and the new step is conditioned
on `RUN_DENO`. An executable nine-case derivation returned `REAL_EXIT=0`; every result had
`needsDeno=true`, `qualityRuns=true`, and `runDeno=true`:

1. package source/export target;
2. plugin source/export target;
3. package manifest;
4. plugin manifest;
5. root dependency lock;
6. generator implementation;
7. quality workflow;
8. generated corpus;
9. root manifest/version change.

No content-affecting input class was found that can stale the corpus while skipping Deno-backed
quality.

## CI YAML parse

- Authoritative parse/assertion: `REAL_EXIT=0` using pinned `jsr:@std/yaml@1` with `--no-lock`.
- Parsed location: `jobs.quality.steps`.
- Read-back step: name `MCP export corpus freshness`; condition `env.RUN_DENO == 'true'`; command
  exactly invokes `--gate mcp-export-corpus --id quality-mcp-export-corpus --output
  .llm/tmp/gate-receipts/quality/mcp-export-corpus.json` through `run-gate.ts`.
- Two setup attempts exited 1 before parsing: Deno 2.9 rejects `eval --allow-read`, and the root
  import map does not define `@std/yaml`. The corrected fully qualified `--no-lock` invocation is
  the verdict source and did not modify dependencies or the lockfile.

## Teeth

| Direction | Environment | Real exit | Evidence |
| --- | --- | ---: | --- |
| RED | Detached throwaway worktree at `ec848e6b0334ec8fcd2bc66ba009305d35367b01` | 1 | Expected stale-corpus diagnostic matched; worktree add/remove each exited 0. |
| GREEN | Fresh generated corpus in live worktree | 0 | Provenance payload SHA `749a692a…`, 272 subpaths, 7,803 symbols. |
| GREEN through CI runner | Exact `run-gate.ts --gate mcp-export-corpus --id quality-mcp-export-corpus` invocation | 0 | Receipt outcome `PASS`; child exit 0. |

## Required validation

| Command/check | Real exit | Result |
| --- | ---: | --- |
| `deno task check:mcp-export-corpus` | 0 | PASS |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools --ext ts` | 0 | PASS — 342 files, 3 batches, 0 failed batches/findings |
| Parsed YAML assertion | 0 | PASS |
| Classifier reachability assertion | 0 | PASS |

`deno task e2e:cli` was not run, per the explicit non-scope instruction.

## Hygiene and final identity

- First remote-main fetch: `REAL_EXIT=0`; `origin/main` advanced during the slice to
  `37452f11f5045f0f5a98e07d802bcc2a2e94333b`.
- The intervening changes include #1917's classifier repair and #1915's package/plugin public
  surface plus regenerated corpus, so integration/regeneration is required rather than assuming
  the dispatched-base blob carried.
- Final integrated-main SHA, regenerated SHA/cardinalities, lock verdict, and clean status: pending
  slice 3.
