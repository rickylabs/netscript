# Context pack — docs-1377-content--leaf

Resumable summary. Read with `supervisor.md`, `worklog.md`, `drift.md`.

## What this run is

PR-C of #1377 — the **content** half. Documentation authoring only. The gate half (a
`publish-readiness.ts` reference-page check that currently runs over zero packages, a
command-coverage gate, and the reference path-convention decision) is PR-D and is **out of scope**.

`Refs #1377`, never `Closes` — the issue's gate acceptance rows are not this PR's to complete.

## Coordinates

| Field | Value |
| --- | --- |
| Worktree | `/home/codex/repos/ns006-1377-content` |
| Branch | `docs/1377-reference-ia-readme-truth` |
| Baseline | `cd24e1679` |
| PR | **#1541** (draft) |
| Run dir | `.llm/runs/docs-1377-content--leaf/` |

Push with an explicit refspec: `git push origin HEAD:refs/heads/docs/1377-reference-ia-readme-truth`.

## Slices

| Slice | Commit | State |
| --- | --- | --- |
| S1 four `-core` reference pages + reference index | `e22a2f952` | landed, gated, commented |
| S2 `packages/sdk/README.md` query dialect | `68cf6f2e5` | landed, gated, commented |
| S3 root `README.md` scaffold count + specifier | `617b74884` | landed, gated, commented |
| S4 CLI reference — six verbs + two wrong claims | — | in progress |

## Measurements that must not be re-derived

- **Alias row of #1377 is already satisfied.** `@contracts`, `@/lib/`, `api-clients` are at zero
  under `docs/site/`, and `check-accuracy-and-discoverability.ts:57-58` actively forbids them. Tick
  on measurement; do not "fix".
- **Reference pages: 35 effective-publish members, 0 missing** after S1 (was 4 missing).
- **Path convention:** 31 name-exact, 4 exceptions — the *deployable* plugins drop `plugin-`.
- **No generator writes into `docs/site/reference/`.** Pages are hand-written.
- **Deploy target operations, measured from source:**

  | Target(s) | Class | Operations |
  | --- | --- | --- |
  | `compose`, `docker` | `AspireComposeDeployTarget:64` | plan · emit · up · down · status · logs (**6**) |
  | `kubernetes`, `azure-aca`, `azure-app-service`, `azure-aks`, `cloud-run` | `AspireCloudDeployTarget:125` | plan · emit · up · down (**4**) |
  | `deno-deploy` | `deno-deploy-target.ts:57` | plan · up · down · status · logs (5) |
  | `windows-service`, `linux-service` | `service-deploy-target.ts:21` | plan · emit · up · down · status · logs (6), +`rollback` with an `ActivationPort`, +`secrets` with a `SecretsStorePort` |

  Verb subcommands are generated from the target's `operations`
  (`target-deploy-command.ts:58-66`), so both wrong claims are decidable from these arrays.
- **Six verbs confirmed undocumented** in `docs/site/`: `agent drift`, `deploy desktop`,
  `deploy package-cli`, `deploy list`, `config list` → zero occurrences; `plugin ai` → one, at
  `reference/plugin-ai/index.md:311`, absent from both command references.

## Hard boundaries

- **Do not open** the nine `docs/site` Tier-1 files PR-B is editing concurrently: `quickstart.vto`,
  `index.vto`, `services-sdk/sdk.md`, `services-sdk/how-to/add-a-service.md`, and
  `web-layer/{query,examples,interactive,form,query-bridge}.md`.
- No gate code, no checkers, no negative tests — PR-D.
- No `packages/**` or `plugins/**` change except `README.md`.
- Do not mark ready for review. Do not merge. A separate opposite-family Codex audit runs after this,
  then a Fable prose polish.

## Gate commands for this run

```text
deno task docs:links
deno task docs:accuracy
deno task quality:gate
deno task publish:dry-run
cd docs/site && deno run --no-lock --allow-read _plugins/check-source-format.ts .
deno fmt <README paths>          # docs/site/**/*.md is excluded — see drift DR-4
```
