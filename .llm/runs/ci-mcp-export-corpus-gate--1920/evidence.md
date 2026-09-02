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

After integrating current `origin/main` at
`37452f11f5045f0f5a98e07d802bcc2a2e94333b`, the corpus was regenerated from the integrated
surface and the environment comparison was repeated:

| Environment | Generator exit | Generated-file SHA-256 | Payload SHA-256 | Subpaths | Symbols |
| --- | ---: | --- | --- | ---: | ---: |
| Integrated warm cache 1 | 0 | `21cfdee7c2f48ab48358dd0fbe0ab18749aac12ff2c00a9c6aafa748e6e38c9d` | `81d49c6cc3f8cf6ea8bee59330ec562998ce6def0ea137d06287bd21376214df` | 273 | 7,809 |
| Integrated warm cache 2 | 0 | `21cfdee7c2f48ab48358dd0fbe0ab18749aac12ff2c00a9c6aafa748e6e38c9d` | `81d49c6cc3f8cf6ea8bee59330ec562998ce6def0ea137d06287bd21376214df` | 273 | 7,809 |
| Integrated pristine `DENO_DIR=/ephemeral/tmp/tmp.oMEjBhPcXR` | 0 | `21cfdee7c2f48ab48358dd0fbe0ab18749aac12ff2c00a9c6aafa748e6e38c9d` | `81d49c6cc3f8cf6ea8bee59330ec562998ce6def0ea137d06287bd21376214df` | 273 | 7,809 |

- Integrated warm repeat byte equality: `true`.
- Integrated warm/pristine byte equality: `true`.
- Integrated provenance also agrees on framework `0.0.6`, 35 packages, 2,188,579 uncompressed
  bytes, and 317,178 compressed bytes.
- The final pristine generation left the Git tree clean, and its task-reported metadata agreed
  with the generated file read-back.

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
| RED after integration | Detached throwaway worktree at current main `37452f11f5045f0f5a98e07d802bcc2a2e94333b` | 1 | Expected stale-corpus diagnostic matched; worktree add/remove each exited 0. |
| GREEN after integration | Fresh regenerated corpus in live integrated tree | 0 | Payload SHA `81d49c6…`, 273 subpaths, 7,809 symbols. |
| GREEN through CI runner after integration | `run-gate.ts --gate mcp-export-corpus` with an isolated final evidence ID/receipt | 0 | Receipt outcome `PASS`; child exit 0. |

## Required validation

| Command/check | Real exit | Result |
| --- | ---: | --- |
| `deno task check:mcp-export-corpus` | 0 | PASS |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools --ext ts` | 0 | PASS — 342 files, 3 batches, 0 failed batches/findings |
| Parsed YAML assertion | 0 | PASS |
| Classifier reachability assertion | 0 | PASS |
| Final integrated pristine-cache generation | 0 | PASS — byte-identical to the integrated warm result |
| Generated-corpus lockfile diff | 0 | PASS — no `deno.lock` change |

`deno task e2e:cli` was not run, per the explicit non-scope instruction.

## Hygiene and final identity

- First remote-main fetch: `REAL_EXIT=0`; `origin/main` advanced during the slice to
  `37452f11f5045f0f5a98e07d802bcc2a2e94333b`.
- The intervening changes include #1917's classifier repair and #1915's package/plugin public
  surface plus regenerated corpus, so the branch merged that exact main SHA without rebasing.
- The expected generated-file conflict was resolved exclusively by
  `deno task gen:mcp-export-corpus`; no concurrent public surface was hand-edited.
- Integration merge: `92ae7df426f069be2700bbd6b093fb55d8a4d1b3`.
- Current main itself remained stale after its merge: its corpus payload SHA was `658a3a563acf6041d3446c298d2349c86c01968ade340cb971ba895ee8a9c33f`, while regeneration from
  that exact public surface produced the final `81d49c6c…` payload. The current-main throwaway RED
  independently confirmed the stale state.
- Final generated-file SHA is `21cfdee7c2f48ab48358dd0fbe0ab18749aac12ff2c00a9c6aafa748e6e38c9d`;
  payload SHA is `81d49c6cc3f8cf6ea8bee59330ec562998ce6def0ea137d06287bd21376214df`;
  cardinalities are 273 subpaths and 7,809 symbols.
- `origin/main` was fetched again after the final pristine-cache check and remained exactly
  `37452f11f5045f0f5a98e07d802bcc2a2e94333b`.
- Diff/lock hygiene assertions returned `REAL_EXIT=0`; only the intended workflow step, generated
  corpus, and harness run artifacts differ from integrated main.

## Convergence — main `4720596fcd0a4c00d72616bec9739be8796718fe`

### Integration and generated-conflict handling

- Fetch and exact-main assertion: `REAL_EXIT=0`; `origin/main` was
  `4720596fcd0a4c00d72616bec9739be8796718fe`.
- Merge command: `REAL_EXIT=1`, with exactly one unmerged path:
  `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`.
- Conflict clearing used `git checkout --ours` only to make the index resolvable, then
  `deno task gen:mcp-export-corpus` replaced the file from source authority: take-side exit `0`,
  initial stage exit `0`, generator exit `0`, final stage exit `0`, and unmerged-path query exit
  `0` with an empty result. No generated content was merged line-by-line.
- Integration commit: `8a8c6a073bb9d56ca6939dd5a35ede8276602252`.

### Exact-head determinism

Both regeneration runs used the detached scratch worktree at integration commit `8a8c6a073` and
independent pristine caches. The committed blob was not copied into the scratch result after
generation; each generator run independently left the worktree clean.

| Source | Generator exit | File SHA-256 | Payload SHA-256 | Subpaths | Symbols |
| --- | ---: | --- | --- | ---: | ---: |
| Committed integration blob | N/A | `d1a5d3fb88fb49a5b4e9303d4350159a7f59945a77fdeebe1e4aaf0243fc70f4` | `0ce5d3066d740f2d1170d0eb0ca98022d0d32d22ba8afd37b93f58e383a04758` | 273 | 7,815 |
| Scratch run 1, `DENO_DIR=/ephemeral/tmp/tmp.Oo7egOUafE` | 0 | `d1a5d3fb88fb49a5b4e9303d4350159a7f59945a77fdeebe1e4aaf0243fc70f4` | `0ce5d3066d740f2d1170d0eb0ca98022d0d32d22ba8afd37b93f58e383a04758` | 273 | 7,815 |
| Scratch run 2, `DENO_DIR=/ephemeral/tmp/tmp.igriltKFGr` | 0 | `d1a5d3fb88fb49a5b4e9303d4350159a7f59945a77fdeebe1e4aaf0243fc70f4` | `0ce5d3066d740f2d1170d0eb0ca98022d0d32d22ba8afd37b93f58e383a04758` | 273 | 7,815 |

- Worktree add, both SHA reads, both clean-status reads, and worktree removal each exited `0`.
- Both scratch files equal the committed blob and each other byte-for-byte.
- Shared metadata: framework `0.0.6`, 35 packages, 2,190,664 uncompressed bytes, and 317,621
  compressed bytes.
- The pristine Deno caches were not deleted because repository policy forbids cache deletion
  without approval.

### Explained corpus delta

Against the superseded integrated corpus, the generated-file SHA moves from `21cfdee7…` to
`d1a5d3fb…`, the payload SHA moves from `81d49c6c…` to `0ce5d306…`, subpaths remain 273 (`delta 0`),
and symbols move from 7,809 to 7,815 (`delta +6`). The byte counts move by +2,085 uncompressed and
+443 compressed.

The change is explained by #1922 (`4720596fc`): it adds
`packages/sdk/src/client/locale-contribution.ts` and re-exports
`createLocaleSdkClientContribution`, `LocaleSdkClientContext`, and
`LocaleSdkClientContribution` from the existing `@netscript/sdk/client` entrypoint. Therefore no
new subpath is created, while the new declarations and their documented members add six corpus
symbol records. #1921 (`997b836ba`) changes tests only and contributes no published symbol; #1923
(`13bb9415e`) changes workflow concurrency only.

### Evaluated-surface carry

| Revision | `ci.yml` Git blob hash | Hash exit |
| --- | --- | ---: |
| Evaluated head `8c028d820` | `b36057ab6adc68be5bf760637ca2a7998e65e040` | 0 |
| Integration head `8a8c6a073` | `b36057ab6adc68be5bf760637ca2a7998e65e040` | 0 |

`git diff --exit-code 8c028d820 8a8c6a073 -- .github/workflows/ci.yml` returned `0` with no
output. The authored non-generated CI surface is byte-identical to the native Fable-PASS head; only
the generated corpus was refreshed for the newly integrated upstream public surface. Per the
coordinator's convergence ruling, the redundant OpenHands run is not a gate and was not awaited.

### Required exact-head checks

All verdicts below ran at integration head `8a8c6a073bb9d56ca6939dd5a35ede8276602252`
before this evidence-only commit, with child exits captured directly as `out=$(command); rc=$?`.

| Command/check | Real exit | Result |
| --- | ---: | --- |
| `deno task check:mcp-export-corpus` | 0 | PASS — payload `0ce5d306…`, 273 subpaths, 7,815 symbols |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools --ext ts` | 0 | PASS — 342 files, 3 batches, 0 failed batches/findings |
| Parsed YAML read-back from `jobs.quality.steps` | 0 | PASS — exact name, `RUN_DENO` condition, gate ID, invocation ID, and receipt path |
