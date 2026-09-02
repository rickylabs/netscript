use harness

# Slice brief S3 — #1093 / PR #1850 · move the official axes out of plugin core, and guard it

**Lane:** Fixes (`orchestrator:fixes`) · **Priority:** p2 · **Milestone:** 0.0.7 (coordinator ruled:
implement **fully in 0.0.7**, no split to 0.0.8)
**Route:** Codex · OpenAI · GPT-5.6 Sol · **high** (`complex_implementation`)
**Worktree:** `/home/agent/projects/netscript/worktrees/007-leaf-1093`
**Branch:** `fix/plugin-discovery-contribution-seam`, already integrated with `origin/main`
`38f2ce735` at merge `7d1026a03` — clean, `deno.lock` byte-identical to main.
**Run dir:** `.llm/runs/fix-plugin-discovery-contribution-seam--0.0.7/`

## SKILL

Activate the harness workflow per `.agents/skills/netscript-harness` and `.llm/harness/`. This slice
changes **framework source** in `packages/` and `plugins/`, so the following are mandatory, not
optional:

- `.agents/skills/netscript-doctrine` — you are moving a responsibility across a package boundary.
  Identify archetype, public surface, layering, and the anti-pattern you are removing before writing
  code. **The doctrine rule at issue is that a host/core package must not carry plugin-specific
  branches or hardcoded plugin names.**
- `.agents/skills/netscript-tools` — structured wrappers are the verdict source; `quality:gate` is
  **required** for any `packages/**` / `plugins/**` change and catches what the scoped wrappers do
  not (`any`, `as unknown as`, host-side hardcoded plugin names).
- `.agents/skills/netscript-deno-toolchain` — `deno doc` before broad source reads; lock hygiene.
- `.agents/skills/netscript-pr` — closing keyword, labels, milestone.

## What already shipped and must not regress

PR #1850 already delivers the **extension seam**, and it has an independent `PASS_IMPL`:

- `AstExtractor` takes `AstExtractorOptions.additionalBuilders` at construction; `startWalker`
  forwards them. A third-party factory is discovered end to end without editing core defaults,
  proven against a real temp dir emitting `.netscript/generated/channel-syncs.registry.ts`.
- `DEFAULT_CONTRIBUTION_BUILDERS` stays exactly 3 entries; malformed/duplicate callees throw.

Acceptance boxes 1, 3 and 4 are satisfied. **Do not rework them.**

## What is missing — this slice

`packages/plugin/src/sdk/discovery/ast-extractor.ts:10-14` still hardcodes, in **plugin core**:

```ts
const DEFAULT_CONTRIBUTION_BUILDERS = Object.freeze([
  Object.freeze({ callee: 'defineJob', axis: 'jobs' }),
  Object.freeze({ callee: 'defineSaga', axis: 'sagas' }),
  Object.freeze({ callee: 'defineWebhook', axis: 'triggers' }),
]);
```

- **Box 2** — `defineSaga` → `sagas` and `defineWebhook` → `triggers` must be **declared by
  `plugins/sagas` and `plugins/triggers`**, not by plugin core.
- **Box 5** — a doctrine check or guard test must **fail** when a core package gains a
  plugin-specific branch. The duplicate-callee throw does *not* satisfy this: it prevents a duplicate
  row, which is a different thing entirely. A previous packet claimed box 5 on that basis and the
  claim was wrong — do not repeat it.

Also required by the coordinator audit:

- **Regenerate the MCP export corpus.** `deno task check:mcp-export-corpus` is currently red. Note
  it is *also* red on clean `main` (filed as **#1873**, deterministic, +224 uncompressed bytes, and
  the check runs in no workflow) — so regenerating here fixes both. Reference #1873 in the PR body
  and state that this PR incidentally clears it; do **not** claim the CI-gating half of #1873.
- **No unrelated lock churn.** `deno.lock` is byte-identical to main right now. If it moves, stop and
  report.

## The one real design decision — resolve it explicitly, in writing, first

The two CLI consumers construct the extractor with **no arguments**:

- `packages/cli/src/public/features/plugins/list/list-plugins-command.ts:73` — `new AstExtractor()`
- `packages/cli/src/public/features/root/public-command-dependencies.ts:351` — `extractor: new AstExtractor()`

So if you simply delete the two rows from core, official discovery breaks. The question this slice
must answer is **how the declarations reach the extractor**.

The trap: importing `plugins/sagas` and `plugins/triggers` from `packages/cli` and passing their
constants explicitly **relocates** the hardcoding rather than removing it — the host would still name
specific plugins, which is the exact anti-pattern box 5 is supposed to guard. If you do that, your own
box-5 guard should fail, and if it does not, the guard is vacuous.

**Deliverable order:**

1. Write `plan-s3.md` in the run dir with numbered decisions (D1…): the transport for plugin-owned
   declarations, whether `defineJob`/`jobs` moves too or stays (the acceptance names only
   sagas/triggers — decide and justify, do not silently leave an inconsistency), what the box-5 guard
   actually asserts and where it lives (`arch:check` rule vs guard test), and the backward-compat
   story for no-arg consumers.
2. **Report the plan and stop.** The supervisor reviews before implementation. This is a core-layering
   change; a wrong transport is expensive to unwind.
3. On greenlight: RED → GREEN commits, gates, PR update.

**Hard stop and report** — do not decide these alone: if the transport requires a **plugin manifest
schema change** (the original plan's D4 explicitly avoided one), or a change to
`packages/config` path constants, or any new cross-package dependency edge that doctrine forbids.

## Ceiling (expected — confirm in the plan, expand only by reporting first)

```
packages/plugin/src/sdk/discovery/ast-extractor.ts
packages/plugin/src/sdk/presets/start-walker.ts
plugins/sagas/**            (axis declaration)
plugins/triggers/**         (axis declaration)
packages/cli/src/public/features/plugins/list/list-plugins-command.ts
packages/cli/src/public/features/root/public-command-dependencies.ts
packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts   (regenerated only)
<the box-5 guard: an arch:check rule or a guard test>
.llm/runs/fix-plugin-discovery-contribution-seam--0.0.7/**
```

## Gates (record exit codes)

```
deno task quality:gate                       # REQUIRED — packages/** and plugins/**
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin --ext ts
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/plugin
deno task arch:check
deno task check:mcp-export-corpus            # must be exit 0 after regeneration
```

Plus the non-increase contracts already recorded in `plan.md`'s Gate Table (doc-lint ≤15 private
refs, JSR audit exact non-increase, publish dry-run same two warnings, doctrine scan non-increase).
Those are contracts, not promised greens — report them exactly.

## PR

PR **#1850** already exists. Update it in place; do not open a new one. Its body must stay truthful:
the correction section recording that boxes 2 and 5 were previously **overstated** stays, with a new
section recording that they are now genuinely implemented. Keep `Closes #1093`. Leave the DoD boxes
unticked — the supervisor mirrors acceptance; **never hand-tick acceptance boxes**.

The issue #1093 body is already truthful; an **older mirror comment on it is stale**. Do not edit the
issue body — report the stale comment to the supervisor instead.

After implementation the PR needs a fresh exact-head **separate-session IMPL-EVAL**. Do not
self-certify, do not mark ready-for-review, and do not merge.
