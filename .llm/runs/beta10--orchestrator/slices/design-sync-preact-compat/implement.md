use harness

# Slice — design-sync converter: complete the preact-compat value surface

## SKILL

Activate all of these — under-listing is the failure mode:

- **`netscript-harness`** — always-on operating model; run artifacts, drift recording, evaluator
  protocol. You report into `.llm/runs/beta10--orchestrator/`.
- **`netscript-tools`** — the scoped `run-deno-check` / `run-deno-lint` / `run-deno-fmt` wrappers you
  must use for validation, and what counts as trustworthy gate evidence. Do not hand-roll raw root
  `deno fmt --check` as a verdict.
- **`netscript-doctrine`** — the tooling/archetype boundary. `tools/design-sync/` is **tier-2 repo
  tooling**, product-facing, not a workspace package; it is still code and held to the framework's
  bar. Consult before you reach into `packages/`.
- **`netscript-deno-toolchain`** — `deno doc` to learn the fresh-ui public surface cheaply instead of
  reading source broadly; `deno why`/`deno info` before touching any dependency. Do **not** hand-roll
  registry curls or version checks.
- **`deno-fresh`** — Fresh 2.x / Preact island semantics. The bug is exactly a Preact-value-import
  question (`h`, hooks, signals); this skill is the reference for what an island legitimately imports.
- **`rtk`** — prefix read-heavy `git`/`grep`/`ls` with `rtk`; wrap `deno task` runs in `rtk proxy`.
- **`codex-wsl-remote`** — you are a mobile-visible daemon-attached session; keep one active send per
  worktree, and steer via resume rather than a second send.
- **`netscript-pr`** — only if you end up needing to file a follow-up issue. You do **not** open a PR
  in this slice.

Read `AGENTS.md` first.

## Context

Run: `.llm/runs/beta10--orchestrator/` (beta.10 orchestrator, Stream A — dashboard design prototype).
Drift entry: `.llm/runs/beta10--orchestrator/drift.md` § **D-1** — read it.

Plan of record for the design-sync system:
`.llm/runs/feat-dashboard-design-prototype--design/plan.md` (see "Scope", the Risk Register row on
registry→React conversion edge cases, and the Fitness Gates table).

Worktree: `/home/codex/repos/ns-ds-sync`, branch `fix/design-sync-preact-compat` (cut from
`feat/beta10-integration` @ `6c0dd587`). The branch has **no upstream by design** — push only via an
explicit refspec (`git push origin HEAD:refs/heads/fix/design-sync-preact-compat`), never a bare
`git push`. The orchestrator's run artifacts live in the sibling worktree
`/home/codex/repos/netscript-beta10`; read them there, but do your work here.

## The bug

`deno task design:sync` fails hard on today's `fresh-ui` registry:

```
conversion errors:
  ! mcp-ui-widget: unmapped preact value import "h" in islands/McpUiWidget.tsx
error: deno bundle failed:
error: No matching export in "__ds/preact-compat.ts" for import "h"
    at file:///home/codex/repos/netscript-beta10/.ds-sync/pkg/islands/McpUiWidget.tsx:19:13
```

The converter rewrites registry `preact` imports onto a synthetic `__ds/preact-compat.ts` shim
(`tools/design-sync/src/convert.ts:192` emits the rewritten import; `:334` is where the shim's module
path is declared). The registry has since gained an `mcp-ui-widget` island that imports `h` from
`preact` as a **value**, and the shim has no `h` export — so the emitted synthetic package does not
bundle, and Stream A cannot seed the Claude Design system from real components.

## What to do

1. **Fix the shim, not the symptom.** Do not special-case `mcp-ui-widget` or `h` alone. Enumerate the
   preact/`preact/hooks`/`@preact/signals` **value** surface the fresh-ui registry actually imports
   (grep the registry sources), and make `preact-compat` export a correct React-backed equivalent for
   each. `h` maps to React's `createElement`; audit the rest rather than assuming.
2. **Make the failure mode loud.** The converter already reports `conversion errors:` and then
   proceeds into a bundle that cannot possibly succeed. An unmapped value import must fail the
   conversion step with a clear message naming the component, the file, and the symbol — before
   `deno bundle` is invoked. A bundle error is a worse diagnostic than the converter's own.
3. **Regression test.** Add a test that a registry unit importing a preact value symbol converts and
   bundles, and that an *unmappable* symbol fails at conversion with a useful message. Tests live next
   to what they test (`*_test.ts`).
4. **Prove it green.** `deno task design:sync` completes; the parity checklist and trap checks (a–f)
   in the converter report stay intact; a second run on the unchanged registry is a **zero-diff**
   re-sync (the plan's "Sync idempotence" fitness gate).

## Validation

```
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root tools/design-sync --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root tools/design-sync --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root tools/design-sync --ext ts,tsx
deno test tools/design-sync/
deno task design:sync          # must exit 0, twice, second run zero-diff
```

## Rules

- Do **not** touch `packages/` or `plugins/` source. If the correct fix genuinely requires a
  `fresh-ui` change, stop and report — that is a separate slice.
- Do not delete lock files or caches; no `deno cache --reload` without approval.
- Do not open or merge a PR. Commit on `fix/design-sync-preact-compat` and report back; the
  orchestrator gates and an opposite-family session evaluates. You do not self-certify.
- Record any divergence from this brief in `.llm/runs/beta10--orchestrator/drift.md`.

## Pre-existing partial work in the worktree (read before you start)

An earlier, interrupted turn left **uncommitted** edits on disk in this worktree:

- `tools/design-sync/mod.ts` (modified)
- `tools/design-sync/src/convert.ts` (modified)
- `tools/design-sync/src/convert_test.ts` (new, untracked)

Do **not** blindly trust them and do **not** blindly discard them. Read the diff first
(`rtk git diff`, plus the untracked file), judge it against this brief, then either complete it or
reset and redo it. Whatever you keep must satisfy the full Validation block above. Say in your report
which you chose and why.
