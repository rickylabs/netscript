# Supervisor identity — topic-docs-0.0.7

| Field                               | Value                                                                                                              |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Role                                | Claude topic orchestrator, `docs` lane (supervise-only)                                                            |
| Coordinator                         | `codex-root-0.0.7` (`/home/codex/repos/netscript-547-lffix`, run `release-0.0.7--orchestration`)                   |
| Coordinator Codex session           | `019ffaa3-32ae-7b02-92a5-d7ae146d8cbd` (sole merge/release authority)                                              |
| Requested route                     | native Claude · Opus 5 · high effort · Remote Control required                                                     |
| Observed route (process argv)       | `--model claude-opus-5 --effort high --permission-mode bypassPermissions --remote-control netscript-007-docs`      |
| Route verdict                       | matched                                                                                                            |
| Claude session id                   | `fcf04b0f-3c2f-4844-9508-84c52ce8298c`                                                                             |
| `bridgeSessionId`                   | `session_01SBHRTmr6ddueUYzCbcXrRV` (current; supersedes `session_01PLRauSHN1PnvrNF2ucefF6`, whose PID is dead)      |
| Remote Control URL                  | `https://claude.ai/code/session_01SBHRTmr6ddueUYzCbcXrRV`                                                          |
| Remote Control state                | attached; native Anthropic client, `--remote-control`, resumed on the same Claude session id                       |
| PID                                 | `11850` (respawn of `2429469`; the Claude session id is unchanged)                                                 |
| Exact cwd                           | `/home/codex/repos/netscript-007-docs`                                                                             |
| Worktree                            | `/home/codex/repos/netscript-007-docs`                                                                             |
| Branch                              | `orchestrator/release-0.0.7-docs` (no upstream by design; push by explicit refspec only)                           |
| Topic run                           | `.llm/runs/orchestrator-release-0.0.7-docs--topic`                                                                 |
| Preserved parked Codex topic thread | `019ffcc0-e19b-71d1-95ce-8c72559eb026` (parked/offline; never resumed as topic controller)                         |
| Leaves (both shipped)               | `comparison-docs-programme` → PR #1652 → `e090f894f`; `comparison-vs-pages` → PR #1660 → `729386c56`               |
| Leaf worktree / branch              | `/home/codex/repos/netscript-007-docs-comparison` / `docs/comparison-docs-programme`                               |
| Leaf implementer Codex thread       | `019ffcc9-16c2-7573-b7f6-d627172408e8` (gpt-5.6-sol · high · idle; steer by `codex exec resume`, never a new send) |
| Lane issue scope                    | #1551 only (one committed milestone issue)                                                                         |
| Lane status                         | **EXHAUSTED / PARKED** — allocation `[1551]` shipped; no docs-lane issue open                                      |
| Last reconciliation                 | 2026-08-15 vs coordinator state `353bd087a` (`updatedAt` 11:51Z, `currentMainSha` `baf1cdf67`) — allocation unchanged |

Attachment is proved by the native session registry entry `~/.claude/sessions/2429469.json`, whose
`pid`, `cwd`, and non-empty `bridgeSessionId` match the live process, plus the process argv above.
No `ANTHROPIC_BASE_URL` override is in play; this is a native Remote Control surface, not an
inference-only gateway session.

## Attachment claim against the coordinator's cluster state

`milestone-cluster-state.json` still records the docs controller as `state: pending_attachment` with
`requestedModel: claude-opus-5` and `requestedEffort: high`. This session satisfies that request.
The coordinator owns that field — this lane reports the proof and does **not** mutate the central
control plane.

## Dispatch order 6 (this lane's only assigned gate)

| Field      | Value                                                                             |
| ---------- | --------------------------------------------------------------------------------- |
| leafId     | `comparison-docs-programme`                                                       |
| phase      | `plan-eval`, cycle 1                                                              |
| PR         | #1652, branch `docs/comparison-docs-programme`                                    |
| worktree   | `/home/codex/repos/netscript-007-docs-comparison`                                 |
| sourceHead | `d35cbca30872d1f55118d63437638e93270c2ac3` (immutable evaluation head)            |
| runDir     | `.llm/runs/docs-comparison-docs-programme--1551`                                  |
| brief      | `comparison-docs-programme.md`                                                    |
| output     | `plan-eval.md`                                                                    |
| route      | native-claude · Claude Opus 5 (`claude-opus-5`) · effort **low**                  |
| rationale  | bounded docs-only PLAN-EVAL with immutable evidence and no product implementation |

Not yet granted. Cluster concurrency is 1 evaluator globally across all six dispatch entries; this
lane's turn has not been called.

## Leaf contract (binding, from `leaf-contracts.json`)

- archetype `1-small-contract`, overlay `docs`, wave 0, executionKind `implementation`.
- file surfaces: `.llm/tools/`, `docs/site` (incl. `docs/site/reference/`), and the immutable
  external source `EIS-Chat@5191de83f3da97559f21d8891c6c8afdf1cf473a`.
- proving gates: `check`, `test`, `docs-source-format`, `docs-accuracy`.
- JSR audit not applicable (no `packages/**` or `plugins/**` surface).

## Standing control laws (from `topic-claude-reset-common.md`)

- Supervise only. No product/docs/tooling edits in this worktree; implementation stays in
  daemon-attached WSL Codex leaves launched/steered through the agentic suite.
- Never resume parked Codex thread `019ffcc0-e19b-71d1-95ce-8c72559eb026` as a topic controller, and
  never fire a second `send-message-v2` at a leaf worktree — steer the existing thread.
- One evaluator globally at a time; fresh session per gate; opposite family from the Codex
  generator; exact route from `briefs/reset-gates/dispatch.json`. No OpenRouter/OpenCode/AGY
  substitution. Fable 5 requires a coordinator amendment recording genuine architectural necessity.
- Tier-A topic review may consolidate shared lane context but never replaces PLAN-EVAL or IMPL-EVAL.
- No merge, publish, ready-for-review, relabel, issue-close, milestone-scope change, cluster-state
  mutation, or release-writer lease from this lane.
- Do not blindly resume a leaf: re-establish exact local/remote/PR head, hold, formal gate, CI,
  resource lease, and thread state first.

## Recovery attachment + drift audit — 2026-08-23

Reattached against central recovery commit `ba1688732`, which set this lane's controller to
`state: recovery_pending` and instructed docs to "audit relevant main drift and documentation
consequences without silently taking new milestone scope". Allocation is unchanged: `[1551]`,
`queueState: exhausted_parked`, no open docs-lane issue. No scope taken.

| Field                | Value                                                          |
| -------------------- | -------------------------------------------------------------- |
| Claude session id    | `36288ff6-96bf-459b-8b1e-f289eab242e3`                         |
| `bridgeSessionId`    | `cse_01PMQqcnqEbKKQQz2ipLNf7K` (`bridgeOutboundOnly: false`)   |
| Remote Control URL   | `https://claude.ai/code/session_01PMQqcnqEbKKQQz2ipLNf7K`      |
| Route (respawnFlags) | `--model claude-opus-5 --effort high --remote-control`         |
| Route verdict        | matched (requested native Claude · Opus 5 · high · RC)         |
| cwd / worktree       | `/home/codex/repos/netscript-007-docs`                         |
| Reconciled at        | topic head `844acea27` clean; `origin/main` `9634735bc0`       |

Route evidence is `respawnFlags` in the daemon job state, not argv: this session was claimed from a
`bg-spare` process whose argv carries neither `--model` nor `--effort`.

### Four post-checkpoint RFC merges — NO documentation or release-compatibility drift

`#1678` `8ab438d47`, `#1683` `aac320d74`, `#1685` `43f4c1ff3`, `#1686` `9634735bc`.

- Path surface is exclusively `.llm/` and `rfcs/`. Zero `docs/site/`, `packages/`, `plugins/`,
  workspace config, or workflow files.
- Publish surface unchanged: `rfcs/` is not a workspace member and is inside no package
  `publish.include`.
- The new foreign-language and nested-config files (`Cargo.toml`, `.go`, `.cs`, `.py`, `.sh`,
  `.wasm`, a nested `deno.json`+`deno.lock` under `bench/parallel/wasmbuild-lcg/`, a `package.json`
  under `bench/bootsharp-lcg/`) sit outside every gate root: `check`/`lint`/`fmt:check` are rooted at
  `packages`+`plugins`; `quality:scan:repo` adds only `.llm/tools/fitness`, `.llm/tools/quality`,
  `docs/site`; the npm-catalog and zod-alignment scanners walk workspace members only.
- `docs:links` roots are `.llm/harness`, `docs/architecture/doctrine`, `.agents/skills` plus four
  root files — `rfcs/` and `.llm/runs/` are outside it, so new RFC prose cannot break it.
- Numbering is **not** drift: `rfcs/README.md` lifecycle step 1 requires drafts to keep `0000-<slug>`
  until a number is assigned on acceptance. Five concurrent `0000-*` drafts are conformant, and the
  README carries no index table to go stale.
- CI evidence: `ci` and `Code quality` are `success` at all four heads. The Pages docs workflow
  correctly did not run (no `docs/site` paths).

The series proposes four task-runtime adapters (scriptc/Rust/.NET/Go). None is Accepted, none carries
a 0.0.7 commitment, none needs docs/site coverage. Docs lane takes no scope from them.

### Lane corrections — docs consequences

- **#1663** (`194e22a3d`): 9 files, all under
  `.llm/runs/release-0.0.7-internals--orchestration/slices/package-gate-honesty/`. No product, no
  docs. **Zero docs-lane consequence.**
- **#1664** (`203374417`): docs-relevant paths are `packages/cli/README.md`,
  `packages/fresh/README.md`, three scaffold templates, and a regenerated `embedded.generated.ts` —
  the barrel regen is present, as `check:assets-barrel` requires. Checked and cleared: these README
  edits invalidate **neither** of the other two generated layers. `agent-docs.generated.ts` is fed
  from `.llm/assets/agent-docs/{prose.json.gz,provenance.json}`, and `publish-assets.generated.ts`
  embeds `packages/mcp/README.md` only. This lane's three-generated-layers rule does not fire.
  Remaining exposure is JSR landing-page copy, owned by the features lane's own publish gates.
- **#1671** (`bd97a7c03`): the only correction with a real docs-lane consequence — see below.

### #1671 — findings for the fixes lane

1. **Base predates the new blocking Pages gate.** #1671 edits `docs/site/services-sdk/sdk.md` and
   `docs/site/services-sdk/how-to/discover-services.md`, so it triggers Pages. Its base `0ef48c2ec`
   predates `2dd1a75ef` (#1666), which inserted `docs:exports-drift` into `pages.yml` ahead of
   `docs:snippets`. That step has never run against this branch — rebase onto current main before any
   readiness claim, or the gate is unproven.
2. **`docs:exports-drift` will not fail it.** Verified, not assumed: the gate compares entrypoint
   names and — for `checkSymbols: true` packages — exported *symbol names* only, never signatures.
   #1671 changes no entrypoint and adds/removes no exported symbol name in `@netscript/sdk`
   (`checkSymbols: false`) or `@netscript/contracts` (`checkSymbols: true`).
3. **Ungated reference/guide divergence — recommend extending the leaf.** #1671 rewrites the
   golden-path example in `services-sdk/sdk.md` from tuple destructuring + `isDefinedError` narrowing
   to the discriminant form (`result.isSuccess`, then `result.isDefined`) and drops the
   `isDefinedError` import from the example. `docs/site/reference/sdk/index.md` — untouched by #1671 —
   is the third page documenting this API and still presents `isDefinedError` (line 40) as the
   narrowing entry point, plus `SafeResult` (58) and `SafeFailure` (60). After merge, reference and
   guide teach two contracts for one API, and nothing catches it: symbol names are unchanged and
   `docs:snippets` compiles fenced code, not table rows. This is a 2–3 row edit; keeping it inside
   #1671 avoids creating docs debt this lane would otherwise inherit.
4. **Existing snippets stay compilable.** `SafeSuccess`, `NonDefinedSafeFailure`, and
   `DefinedSafeFailure` remain tuple-and-object intersections, so `const [error, result] = await
   safe(...)` still destructures. Two silent narrowings land: the failure payload slot moves
   `null` → `undefined`, and default `TError` moves `unknown` → `ThrowableError`. Repo-wide, the only
   docs/site pages touching this API are the three named above — the other `safe(` hits in
   `data-persistence/database.md` and `reference/prisma-adapter-mysql/index.md` are
   `executeRawUnsafe`/`$queryRawUnsafe` false positives.
5. **For the withheld JSR/export gate — exact locations, no verdict claimed.** #1671 puts three
   *unexported* types into public signatures reachable from published entrypoint
   `@netscript/sdk/client`: `NarrowDefined` (`packages/sdk/src/client/errors.ts:47`) in the return
   position of exported `isDefinedError` (`:115`), and `NonDefinedSafeFailure` (`:49`) /
   `DefinedSafeFailure` (`:61`) as the constituents of exported `SafeFailure` (`:71`). Current main
   has **zero** such references in that module — every public signature there resolves to an exported
   type — so this is new with #1671 and is the class of thing `deno doc --lint` / JSR slow-types
   police. Same shape as the coordinator's open `ContractBuilder` question, where
   `packages/contracts/src/application/contract-primitives.ts` now annotates exported `baseContract`
   with `ContractBuilder<…>` imported from `npm:@orpc/contract`, placing an upstream type in a
   published NetScript signature.

### Release-cut sequencing note

`bump-version.ts` rewrites `deno.json` files only, while `generate-cli-assets-barrel.ts` throws when
`.llm/assets/agent-docs/provenance.json` `version` differs from `packages/cli`. The 0.0.7 cut must
therefore run `gen:agent-docs-prose` inside the cut commit, as cuts 0.0.4/0.0.5/0.0.6 all did — and
because that regen re-extracts from `docs/site`, it must land **after** #1671's docs edits settle.

Pre-empting a plausible false alarm: `provenance.json` carries no `comparisons/*` entries, but that is
by design, not staleness. The "Agent docs corpus freshness" gate executed and passed on this lane's own
comparison merge `729386c56` (run `31876977043`, job `quality`).

No merge, publish, readiness flip, runtime lease, relabel, or self-certification performed. Lane
remains EXHAUSTED / PARKED with allocation `[1551]`.
