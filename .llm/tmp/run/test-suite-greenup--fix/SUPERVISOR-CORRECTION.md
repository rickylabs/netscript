# SUPERVISOR CORRECTION — RESTORE THE CATALOG (maintainer directive)

**Authority:** maintainer (Rickylabs), relayed by supervisor. This overrides any
prior decision recorded in your worklog/drift. Execute it fully and exclusively
before doing anything else, then re-run the gate, commit, and push.

## What you got wrong

The repo uses a **Deno workspace catalog** for **centralized dependency
management** — that is intentional, load-bearing, and confirmed-working by the
maintainer. It must NOT be altered to make tests pass.

You made TWO rejected changes:

1. `103f9a8` — materialized member `catalog:` imports into per-member
   `npm:<spec>@<version>` (maintainer rejected: wrong model).
2. Current head `30ed34b6` — stripped **all 67 `catalog:` references across 18
   member `deno.json` files** and dumped concrete `npm:…@version` specifiers into
   the **root `deno.json` `imports`** map. The root `catalog` block still exists
   but is now **orphaned/dead** (referenced nowhere). **This is also rejected.**

This destroys centralized deps management and breaks JSR publishability (each
published package must declare its own imports via `catalog:`, not lean on a
workspace-root flat `imports` map).

## Required end state (restore to base, byte-for-byte on catalog wiring)

Base commit = `733388f` (this branch's merge-base / PR #46 base).

1. **Revert root `deno.json` `imports` back to `{}`** (exactly as `733388f`).
   Do NOT keep the flat npm dump there.
2. **Restore all 67 `catalog:` references** across the 18 member `deno.json`
   files (packages + plugins) exactly as they are at `733388f`.
3. **Keep the root `catalog: { … }` block** (it is the single source of truth).
   If the green-up legitimately added a NEW shared dependency, add it as a new
   key in the root `catalog` and reference it with `catalog:` from the member —
   never as a flat root `imports` entry, never as a per-member pinned `npm:`.

Verification (must hold before you commit):

```
# no catalog refs may be missing vs base — this diff must be EMPTY for catalog wiring
git diff 733388f -- '**/deno.json' 'deno.json' | grep -E '^[-+].*catalog:' ; echo "exit=$?"
# member catalog: ref count must be back to 67 across 18 files
git grep -c 'catalog:' -- '**/deno.json' | awk -F: '{s+=$NF} END{print s" refs across "NR" files"}'
# root imports must be empty again
```

## About the real blocker: `Unsupported scheme "catalog"`

`deno task test` exited 1 with `Unsupported scheme "catalog"` while resolving
member graphs. Removing the catalog is NOT the fix. Diagnose the real cause while
keeping the catalog intact. Investigate, in order:

1. **Deno version actually used by the failing resolution.** Catalog support
   needs Deno ≥ 2.8. You report 2.8.3 — confirm `deno --version` is 2.8.3 in the
   exact shell/process that runs `deno task test`, and that no stale/older Deno is
   shadowing it.
2. **Workspace membership.** Every member `deno.json` that uses `catalog:` MUST be
   listed in the root `deno.json` `workspace` array, and `deno task test` MUST run
   from the **workspace root** so member graphs resolve through the root `catalog`.
   A member resolved outside the workspace context is exactly what raises
   `Unsupported scheme "catalog"`.
3. **Catalog completeness.** Every `catalog:` key referenced by a member must
   exist in the root `catalog` map.
4. **Lock state.** Re-resolve via `deno install` / normal task run so `deno.lock`
   reflects the catalog. Do NOT delete the lock or run `deno cache --reload`
   without approval.

## Hard stop / escalation

If, after genuine investigation, you cannot get `deno task test` to exit 0 with
the catalog wiring restored to base, **STOP**. Do NOT remove, flatten, or
materialize the catalog as a workaround. Record the precise failing command,
output, and your root-cause hypothesis in `drift.md`, leave the catalog intact,
and report to the supervisor. Escalate, don't deviate.

## Commit cadence

One commit for the catalog restoration (message must state: "revert de-catalog;
restore 67 catalog: refs + root imports {}; maintainer directive"), push, then
continue green-up only via catalog-preserving fixes. Run uninterrupted to
completion; commit + push per logical step.
