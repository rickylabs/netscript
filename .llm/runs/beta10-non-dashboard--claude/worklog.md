# Worklog — beta.10 non-dashboard stream

## Slice 1 — P0(a): `run-deno-lint.ts` swallowed batch failures (PR #715 `quality` job)

**Status:** implemented, gates green locally. Awaiting IMPL-EVAL (separate session).

### Reproduction

`deno task lint` at PR #715 head (`5b1a9877`) reproduced CI run `29202385340` / job `86675839110`
byte-for-byte:

```json
{"source":{"mode":"command","exitCode":1},"selection":{"filesSelected":1685,"batches":9},
 "summary":{"totalOccurrences":0,...},"groups":[]}
```

Exit 1, nine batches, zero occurrences, **no diagnostics**.

### Bug 1 — the wrapper (tooling)

`runLint()` concatenated each batch's stdout+stderr into a single `text` blob that was only ever fed
to `parseOccurrences()`. A batch that exits non-zero *without* emitting a parseable lint occurrence
— i.e. a **crash**, not a finding — had its exit code propagated while its stderr was discarded by
the parser. Result: exit 1 with an empty `groups[]` and nothing in the log.

Fix (`.llm/tools/run-deno-lint.ts`):

- Modelled the crash class as `BatchFailure` (`batchIndex`, `exitCode`, `fileCount`, `files`,
  `stderr`, `stdout`).
- `runLint()` classifies each non-zero batch: parseable occurrence ⇒ ordinary lint finding; zero
  parseable occurrences ⇒ `BatchFailure`.
- `BatchFailure[]` is surfaced on the JSON report (`failures`) **and** rendered to stderr via
  `formatFailures()`.
- Added the never-silent invariant: non-zero exit + empty `groups[]` + no captured failure now
  prints an explicit "re-run with `--batch-size 1`" diagnostic rather than exiting silently.
- Made `runLint` injectable (`BatchRunner`) and guarded `main()` behind `import.meta.main` so the
  behaviour is testable without shelling out.

Cross-check: `run-deno-check.ts` (`failedBatches`) and `run-deno-fmt.ts`
(`failedWithoutParsedFindings`) already model failed batches. `run-deno-lint.ts` was the only
sibling missing it — this fix aligns it with them rather than inventing a new shape.

### Bug 2 — the real failure the wrapper was hiding

With the wrapper fixed, the underlying error surfaced immediately:

```text
--- batch 2 — exit 1 — 200 file(s)
stderr:
error: Failed to parse "workspace" configuration.
Caused by:
    invalid type: string "packages/*", expected struct WorkspaceConfig
```

Source: `packages/mcp/tests/fixtures/doctor/broken/deno.json` — `{ "workspace": "packages/*" }`, an
**intentionally malformed** fixture for the MCP doctor's broken-project test. The lint selection was
picking up `packages/mcp/tests/fixtures/doctor/broken/netscript.config.ts`; `deno lint` walks up
from each file to discover a config, finds the deliberately-broken `deno.json`, and aborts before it
ever lints anything.

Fix: the doctor fixtures are synthetic **projects** (each carries its own `deno.json`), not library
source, and were never meaningful lint targets. Excluded `packages/mcp/tests/fixtures/` from the
root `lint` task selection and from `lint.exclude` in `deno.json`.

Blast radius was checked before choosing the exclusion: a blanket `tests/fixtures` exclusion would
have silently dropped real lint coverage on `packages/ai`, `packages/cli`, and `packages/fresh`
fixture code, so the exclusion is scoped to the one fixture tree that is a nested Deno project.

### Regression test

`.llm/tools/run-deno-lint_test.ts` — 4 cases, all pinning the distinction the bug turned on:

1. a batch failing with **no** occurrences is captured, and `formatFailures()` renders exit code,
   file set, and stderr;
2. a batch failing **with** occurrences is a lint finding, not a `BatchFailure`;
3. the `No target files found.` empty-batch exit is still tolerated;
4. every failing batch is reported, not just the first.

### Gates

| Gate | Command | Verdict |
| --- | --- | --- |
| Regression test | `deno test --allow-all .llm/tools/run-deno-lint_test.ts` | **PASS** — 4 passed, 0 failed |
| Lint (the failing CI job) | `deno task lint` | **PASS** — exit 0, 1682 files, 9 batches |

File count moved 1685 → 1682: exactly the three `.ts` files under the excluded doctor fixture tree.

**Self-certification:** none. These are generator-session results only; the verdict is IMPL-EVAL's.

---

## Slice 2 — P0(b): README rewrite (`packages/cli`, `packages/mcp`)

**Status:** implemented, gates green locally. Awaiting IMPL-EVAL (separate session).
**Commit:** `394f9223`

### House style, established from the exemplars first

Read `packages/telemetry`, `packages/service`, and `packages/ai` before writing. The repo has two
README shapes: the **majority/emoji** style (telemetry, service, aspire, fresh, cli, plugin-\*-core)
and a plain-heading style used only by `packages/ai`. Since `cli` and `mcp` ship together as the
agentic combo and `cli` was already emoji-styled, both targets follow the majority style. No new
shape invented.

### `packages/cli/README.md`

Was deploy-skewed to the point of misrepresenting the package: **~110 of 198 lines** were deployment
targets, the Quick Start led with the `createPublicCli` *embedding* API rather than the command
surface, and there was **no command map at all** — a reader could not learn what verbs exist.

Rewritten around what the CLI is: scaffold a workspace, then grow it with verbs that regenerate the
derived layers (Aspire helpers, plugin registries, contract aggregates). Added a command map for
every top-level group — **generated from the live `netscript --help` tree, not from memory** — kept
the embedding API as a real but secondary capability, and compressed deployment into one target table
plus the permissions matrix.

### `packages/mcp/README.md`

Was a 128-line API stub for a brand-new published package. Rewritten to the depth of the strongest
siblings: why the package exists, the mental model, the 13-tool catalog, recipes, configuration
seams, command policy, data boundary, observability, and layering.

An uncommitted ~313-line draft existed in the stale orchestrator worktree (see drift D1). It was
treated as **input to review, not landed work** — and reviewing it caught two factual errors that
would otherwise have shipped:

| Draft claim | Reality |
| --- | --- |
| Layered `domain → ports → application → adapters` with `ports/` and `adapters/` folders | Actual layout is `src/domain/`, `src/application/`, `src/infrastructure/` — no such folders exist |
| `truncation` is an `McpCliOptions` composition seam | `truncation` is a `createMcpServer` (`McpServerOptions`) seam; `McpCliOptions` has no such field |

Every other claim was re-verified against source rather than carried over: the 13 tool names from
`TOOL_NAMES`; the 50-item / 2,000-UTF-16-code-unit bounds from `DEFAULT_TRUNCATION_POLICY`; the
allow/deny lists from `DEFAULT_COMMAND_POLICY`; protocol version `2025-11-25` from
`MCP_PROTOCOL_VERSION`.

### `docs/site/reference/mcp/index.md` (new)

`@netscript/mcp` is a new published package and was the **only one without a reference page** — every
sibling has `docs/site/reference/<pkg>/index.md`. The README's reference link would have shipped as a
404. Added the page in the established shape. Reference pages are hand-authored (no generator), so
this is not generated output.

### Gates

| Gate | Command | Verdict |
| --- | --- | --- |
| Format | `deno fmt --check` (3 files) | **PASS** |
| Internal doc links | `deno task docs:links` | **PASS** — 96 docs, 0 broken links/anchors |
| Public-docs wording | grep for issue/PR numbers, harness/evaluator/slice/orchestrator terms | **PASS** — clean |

### Finding (not fixed here) — `docs:readme:check` is a dead gate

`deno task docs:readme:check` is **not wired into any CI workflow** and currently **fails for nearly
every README in the repo**: it enforces the `docs/site/_includes/readme-template.md` shape (`##
Install` / `## Quick example` / `## Docs` as literal H2 text), which the shipped house style diverged
from long ago (emoji H2s, `### Installation` nested under `## 🚀 Quick Start`). Conforming `cli` and
`mcp` to the checker would have made them the only two packages that look nothing like their
siblings.

Chose consistency with the shipped house style, per the brief ("match the existing best-in-class
READMEs; do not invent a new shape"). The checker/template/house-style three-way divergence should be
reconciled repo-wide as its own item — it is CI-gate hygiene and pairs naturally with #762. Raised to
the orchestrator rather than fixed inside #715.

---

# COLD-START STATE (for the owner, morning pickup)

Written at the end of the beta.10 non-dashboard stream session. **Nothing was merged, published,
released, or closed.** Per orchestrator stop-line.

## PR #715 — `feat/netscript-mcp-skills` — MERGE-READY, awaiting IMPL-EVAL + owner

**All CI checks green** (check-test, quality, scaffold-static, scaffold-runtime, close-gate,
surface-diff, code-quality, deps-report). Already carries `Closes #725 … Closes #733`.

Commits added by this stream (on top of `5b1a9877`):

| Commit | What |
| --- | --- |
| `907423d0` | lint wrapper: surface crashed batches + regression test; exclude the malformed mcp doctor fixture |
| `394f9223` | `packages/cli` + `packages/mcp` README rewrite; new `docs/site/reference/mcp/index.md` |
| `25a986e7` | worklog evidence |
| `97eed9b1` | JSR preview descriptions fit the 250-**byte** cap; false Node/Bun compat claim corrected |
| `9a2be44d` | fmt wrapper: same silent-failure fix + regression test; same fixture exclusion |

**IMPL-EVAL dispatched** to OpenHands (Qwen 3.7, opposite family) — verdict not yet returned.
**Owner action needed:** merge decision after IMPL-EVAL. Nothing self-certified.

### The headline finding

The `quality` job had **two** silent-failure bugs, not one. Fixing the lint wrapper moved the failure
to the Format check step, exposing the identical bug in `run-deno-fmt.ts`. Both wrappers exited 1
while swallowing the real error. The error both were hiding was the same:
`packages/mcp/tests/fixtures/doctor/broken/deno.json` (an intentionally malformed
`{"workspace":"packages/*"}` fixture) makes `deno lint` **and** `deno fmt` abort during config
discovery. Both wrappers are now silent-failure-proof and regression-tested.

## In flight — two WSL Codex slices (launched, unattended)

| Issue | Branch / worktree | Codex thread | Route |
| --- | --- | --- | --- |
| **#763** | `fix/763-pin-plugin-cli-specifier` @ `/home/codex/repos/b10-763-pluginspec` | `019f588f-44df-7013-842c-be28f1bb1a56` | openai · gpt-5.6-luna · max (matched) |
| **#762** | `quality/762-ts-ignore-sweep` @ `/home/codex/repos/b10-762-tssweep` | `019f5891-881b-77d1-b348-9556bb76e4fa` | openai · gpt-5.6-sol · medium (matched) |

Both worktrees are **upstream-free** by design; push is explicit-refspec only. Briefs are in
`slices/<id>/implement.md`. Neither is reviewed yet — **read the actual diffs, not just their
verdicts** (a sibling stream had a slice pass every gate while writing NUL bytes into a `.ts` file).

Steering (same thread only — never a second `send-message-v2` at the same worktree):

```bash
codex exec resume 019f588f-44df-7013-842c-be28f1bb1a56 -- "<follow-up>"
codex exec resume 019f5891-881b-77d1-b348-9556bb76e4fa -- "<follow-up>"
```

### #763 — root cause corrected (the filed hypothesis was wrong)

The issue guessed "barrel re-emit / JSR module resolution". **Actual cause:** the E2E gate
(`packages/cli/e2e/src/application/gates/scaffold/plugin-install-gates.ts:114`) hardcodes
`jsr:@netscript/plugin-ai/cli` with **no version**. Deno resolves that to `*`, and **semver `*` does
not match pre-releases**. Every `@netscript/plugin-ai` version is a `0.0.1-beta.x` pre-release, so
JSR reports `latest: null` and resolution fails outright. Deterministic, not a race; published-mode
only because the local import map short-circuits JSR.

**Nothing was skipped from the beta.9 publish** — `plugin-ai@0.0.1-beta.9` *is* in `meta.json`. The
specifier simply cannot select it.

**Wider than the test:** `resolvePluginCliSpecifier()`
(`packages/cli/src/public/features/plugins/dispatch/dispatch-plugin-verb.ts:69`) emits the same
unpinned spec, so **real users** dispatching any plugin verb against a published pre-release plugin
hit the identical wall. The slice fixes both. Root cause posted to #763; issue relabelled
`status:in-progress`.

## Deferred

**#695** (tutorial checkpoint validation) → milestone `Backlog / Triage`, with rationale comment. Not
started; nothing stranded.

## Open items needing an owner decision

1. **Merge #715** after the IMPL-EVAL verdict lands.
2. **`docs:readme:check` is a dead gate.** It is wired into **no CI workflow** and currently fails for
   nearly every README: it enforces the `docs/site/_includes/readme-template.md` shape (`## Install` /
   `## Quick example` / `## Docs` as literal H2 text), which the shipped house style abandoned long
   ago (emoji H2s, `### Installation` nested under `## 🚀 Quick Start`). `packages/ai` follows the
   template; everything else follows the house style. Three-way divergence between checker, template,
   and reality. Not fixed here (out of #715's scope) — needs a repo-wide decision on which shape wins.
   Pairs naturally with #762 as CI-gate hygiene.
3. **JSR descriptions of already-published packages are truncated mid-sentence** (`@netscript/telemetry`,
   `@netscript/service`, and others) because their README taglines exceed the 250-byte cap. Fixed for
   `cli` and `mcp`; the rest would need a tagline pass + a `jsr-settings` re-run. Cosmetic but public.

---

## Session end — slice status at handoff

### Slice review performed (Tier-A duty, per the NUL-byte warning)

**#762** — reviewed the 3 landed commits directly, not the verdict:

- No binary/NUL corruption: `git diff --numstat` shows no binary files; no `\x00` in any changed file.
- **22 suppressions removed, 0 new suppressions introduced** — grepped every `+` line for
  `quality-allow` / `deno-lint-ignore` / `@ts-ignore` / `as never` / `as unknown as` / `: any`:
  **empty**. No laundering.
- Spot-checked `packages/fresh/src/application/query/hooks.ts`: it imported the real upstream types
  (`Context` from `@tanstack/react-db`, `IslandLiveQueryData`) and **deleted** the `as never` casts so
  the calls type-check naturally. That is the brief's bar — typed, not annotated away.

Verdict so far: on track. Still running; final review pending its completion.

### Live slice state

| Slice | Branch | Commits | State |
| --- | --- | --- | --- |
| **#762** | `quality/762-ts-ignore-sweep` | 3 (+6 dirty) | Working — fresh, sagas-core, streams-core done |
| **JSR taglines** | `docs/jsr-tagline-byte-cap` | 1 seed (+16 dirty) | Working — editing the 16 over-cap READMEs |
| **#763** | `fix/763-pin-plugin-cli-specifier` | 0 | **Thread alive but no writes yet** — gpt-5.6-luna at `max` effort; last reasoning event 01:08. Watch it; if it stays silent, relaunch with `send-message-v2` (do **not** `codex exec resume` a dead thread) and release the sender lease first if it reports `duplicate_sender_risk`. |

None of the three has pushed. **None is reviewed-and-signed-off. Nothing may merge.**

### New this session

- **#767 filed** (`Backlog / Triage`) — `docs:readme:check` is a dead gate; checker ⇄ template ⇄
  house-style three-way divergence; resolution recorded as "house style wins". Not started.
- **`deno task docs:tagline:check`** — new gate (`.llm/tools/validation/check-jsr-tagline-length.ts`)
  that extracts the tagline exactly as the release tool does and measures it in **bytes**. Currently
  `checked=35 over=16`. It is committed on the `docs/jsr-tagline-byte-cap` branch, not on #715.

### JSR registry — untouched, deliberately

`jsr-set-package-settings.ts` / `jsr-provision-packages.ts` were **not run**, and no call that writes
to jsr.io was made. The tagline slice prepares README fixes only. **The descriptions on jsr.io will
not change when that branch merges** — the registry re-sync is a publish action and happens later
under owner supervision.

---

## IMPL-EVAL — re-routed to Codex (OpenHands transport is down)

OpenHands failed **twice** on the same infrastructure fault (`No module named 'fastapi'`), on two
different open models — model-independent, so it is the agent image, not the route. Filed as **#768**.

The harness invariant is *generator session ≠ evaluator session, opposite family*. OpenHands is a
**transport**, not the requirement, and `lane-policy.md` already binds *Review of Claude
implementation → Codex · OpenAI · GPT-5.6 Sol · xhigh*. So the IMPL-EVAL was re-dispatched on that
route rather than leaving a merge-ready PR ungated.

| | |
| --- | --- |
| **Thread** | `019f58a1-c152-7c93-bbc3-53d93b1c07dd` |
| **Route** | openai · `gpt-5.6-sol` · **xhigh** (route verdict: matched) |
| **Worktree** | `/home/codex/repos/b10-715-eval` (branch `eval/715-impl-eval` @ `f41e33b9`) |
| **Brief** | `slices/715-impl-eval/implement.md` |
| **Deliverable** | `evaluate.md` + a verdict token. Read-only: it reviews, it does not fix. |

### Review-coverage split (PR #715 is mixed authorship)

| Authored by | Content | Reviewed by |
| --- | --- | --- |
| **Claude** (this session) | both wrapper fixes + their tests, the `deno.json` task/exclude changes, `packages/cli` + `packages/mcp` READMEs, `docs/site/reference/mcp/index.md` | **Codex `gpt-5.6-sol` xhigh** (opposite family) — thread above |
| **Codex** (#762, #763) | framework source, on **other branches** — not in #715 | **Claude supervisor** (this session), reading the diffs |

Both halves are covered by an opposite family. Neither lane self-certifies.

## Slice 3 — JSR tagline byte cap — COMPLETE (reviewed, not pushed)

**Branch:** `docs/jsr-tagline-byte-cap` · **Thread:** `019f5897-8e2c-7fa1-8ea0-bd23a97a25e3`

| Commit | What |
| --- | --- |
| `952afca1` | new gate `.llm/tools/validation/check-jsr-tagline-length.ts` + `deno task docs:tagline:check` |
| `822453f6` | 16 over-cap taglines fitted |
| `458879fb` | gate wired into CI (`quality` job, after Format check) |

**Supervisor review (Tier-A, performed — not taken on trust):**

- `deno task docs:tagline:check` → **`checked=35 over=0`**. Was `over=16`.
- CI step verified present in `.github/workflows/ci.yml` at line 122, **and it is the last commit** —
  the gate is only made blocking *after* the branch makes it green, which is the correct order.
- No binary/NUL corruption in any changed file.
- Spot-checked the `plugins/ai` outlier (760 B → in-cap): it had **no bold tagline at all**, which is
  why extraction swallowed its whole 9-line lead paragraph. The slice *added* a proper tagline and
  demoted the rest to following prose — **no claim dropped**. That is the right fix, not a truncation.

**The JSR registry was NOT touched** — `jsr-set-package-settings.ts` / `jsr-provision-packages.ts` were
never run. Confirmed by the slice in its own report. **The descriptions on jsr.io will not change when
this merges**; the registry re-sync is a publish action, owner-supervised, at the next publish.

This turns a one-off #715 fix into a standing guard: an over-cap tagline now fails CI instead of
appearing truncated on jsr.io.

## Slice 4 — #763 pin plugin CLI JSR specifier — COMPLETE (reviewed, pushed)

**Branch:** `fix/763-pin-plugin-cli-specifier` · **Commit:** `40ecc87c` · **Thread:** `019f589e`
(gpt-5.6-sol · high — after the luna/max thread stalled; see drift D4)

**Supervisor review (Tier-A, Claude-family review of Codex-authored code — performed, not trusted):**

The fix is exactly the shape the brief specified, and it fixed the *framework* bug, not just the test:

```ts
export function resolvePluginCliSpecifier(pkg: string): string {
  let spec = pkg.startsWith('jsr:') ? pkg : `jsr:${pkg}`;
  const netscriptPackage = /^(jsr:@netscript\/[^/@]+)(@[^/]+)?(\/.*)?$/.exec(spec);
  if (netscriptPackage && !netscriptPackage[2]) {
    spec = `${netscriptPackage[1]}@${NETSCRIPT_RELEASE_VERSION}${netscriptPackage[3] ?? ''}`;
  }
  return spec.endsWith('/cli') ? spec : `${spec}/cli`;
}
```

- Pins **only** an unpinned `@netscript/*` spec. Group 2 (`@version`) present ⇒ untouched.
- Third-party packages are untouched (the regex only matches the `@netscript/` scope) — correct, since
  we cannot know their versions and they are not lockstep with us.
- `NETSCRIPT_RELEASE_VERSION` is imported from the CLI's own `deno.json` via a JSON import — the
  existing lockstep source of truth. It did **not** invent a second version source, as instructed.
- The E2E gate (`plugin-install-gates.ts`) is fixed too, so the originally-failing
  `scaffold.plugin.ai.lifecycle` path is corrected at both layers.

**Tests** — 4 files, +126 lines. `dispatch-plugin-verb_test.ts` asserts the full matrix: unpinned →
pinned; `jsr:` prefix + `/cli` → pinned; already-pinned (`@1.2.3`) → untouched; already-pinned with
`jsr:`+`/cli` → untouched. It also added the regression guard I asked for:

> `Deno.test('no version-less NetScript JSR specifiers in CLI command sources')`

— a repo-wide guard, so this class of bug cannot silently return while we are on a pre-release line.

**Gates:** `packages/cli` suite **371 passed (407 steps), 0 failed**. No new suppressions (grepped
every `+` line for `as never` / `as unknown as` / `@ts-*` / `deno-lint-ignore` / `: any`: **0**). No
binary/NUL corruption.

**Not proven:** the published-mode E2E (`e2e:cli:prod`) has **not** been re-run — it needs the
published artifact. The fix is verified by unit tests and by direct reproduction of the root cause
against live JSR, not by the prod gate. That gap is deliberate and must be stated at merge.

**Verdict (supervisor):** on track, high quality. Not merged. Not self-certified — this is a
Claude-family review of Codex-authored code, which is the required opposite-family direction.

---

# HANDOFF — what is still moving

| Item | State | Where |
| --- | --- | --- |
| **#715 IMPL-EVAL** | **RUNNING** — Codex `gpt-5.6-sol` xhigh, thread `019f58a1-c152-7c93-bbc3-53d93b1c07dd` | verdict → `/home/codex/repos/b10-715-eval/.llm/runs/beta10-non-dashboard--claude/evaluate.md` |
| **#762** | **RUNNING** — 3 of ~5 packages done (fresh, sagas-core, streams-core); triggers-core + `plugins/*` + the CI flip remain | `/home/codex/repos/b10-762-tssweep`, thread `019f5891` |
| **#763** | **DONE, pushed, reviewed** | `fix/763-pin-plugin-cli-specifier` @ `40ecc87c` |
| **JSR taglines** | **DONE, pushed, reviewed** | `docs/jsr-tagline-byte-cap` @ `458879fb` |

## What an owner does next, in order

1. **Read the IMPL-EVAL verdict** in `b10-715-eval/.llm/runs/.../evaluate.md`. It covers the
   **Claude-authored** half of #715 (both wrapper fixes, the `deno.json` excludes, the two READMEs,
   the mcp reference page). The Codex-authored slices (#762/#763) are reviewed by the Claude
   supervisor instead — that split is recorded above, and both halves have opposite-family cover.
2. **#715** — all CI green, `Closes #725 … Closes #733` already in the body. Merge is an **owner**
   decision, gated on that verdict. Not merged tonight by design.
3. **#763** and **taglines** — pushed, reviewed, **no PRs opened** (deliberate). They need PRs raised
   with closing keywords (`Closes #763`) + labels + milestone before merge.
4. **#762** — let it finish, then review the remaining commits the same way (grep every `+` line for
   new suppressions; the bar is *typed, not laundered*).

## Stop-lines held tonight

No merges. No publish. No release. No milestone closed. **No writes to the JSR registry** — the
tagline branch fixes READMEs only; jsr.io descriptions will **not** change when it merges, and the
registry re-sync remains a separate, owner-supervised publish action.

## Issues filed

- **#767** — `docs:readme:check` is a dead gate (checker ⇄ template ⇄ house-style divergence).
  Resolution recorded: house style wins. `Backlog / Triage`.
- **#768** — OpenHands agent runtime cannot bootstrap (`No module named 'fastapi'`); the open-model
  evaluator lane is down. `Backlog / Triage`.

---

## Slice 5 — #769 / F4: pin every emitted JSR specifier + repo-wide guard

**Branch:** `fix/715-f4-pin-agent-specifiers` · **Thread:** `019f58b4` (gpt-5.6-sol · high)

### The guard is verified — by me, not by its author

`.llm/tools/validation/check-netscript-jsr-specifiers.ts` (`deno task check:netscript-jsr-specifiers`),
wired **blocking** into the `quality` CI job.

I did not accept "the guard passes" as evidence. Per the lesson this run promoted — *a guard never
seen to fail is not a guard* — I seeded a violation myself and measured it:

| Tree | Guard exit | Output |
| --- | --- | --- |
| clean | **0** | `scanned=2147 allowances=1 failures=0` |
| version-less `jsr:@netscript/cli` seeded into `init-agent.ts` | **1** | `FAIL … init-agent.ts:122 jsr:@netscript/cli — framework-emitted or executed jsr:@netscript/* specifier must include a version` |

It names the file and line, and it **fails the build**. (My first measurement read `exit=0` — that was
`tail`'s exit code through a pipe, not the guard's. Worth recording: even the verification of a gate
can silently measure the wrong thing.)

### What it caught that the brief did not know about

The scaffolded **GitHub Actions deploy workflows** (`deploy-bare-metal`, `deploy-compose-ghcr`,
`deploy-deno-deploy`) ran `deno x -A jsr:@netscript/cli deploy …` **unversioned**. So every project
NetScript scaffolds shipped a deploy pipeline that fails on first run — a far larger blast radius than
"`agent init` emits a dead config". #769 was rewritten to lead with that.

Fixed by **templatizing**: `jsr:@netscript/cli` → `{{netscriptCliSpecifier}}`, substituted with the
pinned version at scaffold time. `embedded.generated.ts` regenerated; it now carries no raw
unversioned specifier. That is the right shape — the version is injected when the project is
generated, not frozen into the template.

### Supervisor review — one contamination rejected

`packages/fresh-ui/registry.generated.ts` was modified. It is **unrelated to #769**: a stale generated
artifact being re-synced, carrying a real **behaviour change**
(`renderNode(child, depth, context)` → `depth + 1`, a recursion-depth fix, plus `VNode` →
`RenderUiNode` and added `key` props).

Unrelated executable scope riding silently in a p0 specifier PR is precisely the F5 mistake this run
already made once. **Rejected from the slice** and sent back to be reverted.

**New finding, recorded not fixed:** `packages/fresh-ui/registry.generated.ts` is **stale on the
branch** — regenerating it produces a diff, and that diff contains a recursion-depth bug fix that has
never been reviewed. Worth its own issue; deliberately not fixed here.
