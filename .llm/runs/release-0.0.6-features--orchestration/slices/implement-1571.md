use harness

# Slice brief — #1571 regenerate the `deno.lock` closure blocking canary.3

**Codex · GPT-5.6 Sol · low** (`light_implementation`). This is a **release blocker (p0)**: it failed
`v0.0.6-canary.3` before any tag or publish. The diagnosis is already complete — implement the
repair and **prove** it. Do not re-diagnose.

| Field | Value |
| --- | --- |
| Issue | **#1571** (`priority:p0`) |
| Worktree | `/home/codex/repos/ns006-1571` |
| Branch | `fix/1571-plugin-vite-lock-closure` |
| Base | **`main@5705aeb1985a109f63d693f077b7efa37b28f755`** — exact, already checked out |
| Deno | **repo-pinned 2.9.5** — `release-canary.yml:41` pins `deno-version: '2.9.5'`. Confirm `deno --version` before you start. |

## SKILL

- `netscript-deno-toolchain` — **read this first.** Lock semantics, `deno ci --prod`, and why
  hand-tuning a lock is wrong.
- `netscript-tools` — validation wrappers and gate evidence.
- `netscript-pr` — PR body, closing keyword, labels.
- `netscript-release` — context only: why `deno ci --prod` gates the release cut.

## The defect

`packages/fresh/deno.json` declares a direct dependency:

```json
"@fresh/plugin-vite": "jsr:@fresh/plugin-vite@^1.1.2"
```

`deno.lock` on `main` contains **only** the workspace-member dependency line
(`"jsr:@fresh/plugin-vite@^1.1.2",` under `packages/fresh`) and **none of the resolution closure**.
The lock is internally inconsistent, so `deno ci --prod` fails frozen:

```
error: The lockfile is out of date. Run `deno install --frozen=false`, or rerun with `--frozen=false` to update it.
error: deno ci --prod failed with exit 1.
```

Canary.3 (`release-canary.yml` run `31600415045`) died at step 6 on exactly this. Steps 7–19 skipped:
**nothing published, no version minted, no JSR attempt consumed.**

**How it happened, so you do not repeat it:** this closure first appeared as uncommitted churn during
#1459 and was misdiagnosed as incidental build-toolchain noise, then reduced by hand to the single
workspace-member line. It was never noise — it is the required closure of the declared dependency.
**Do not hand-tune the lock toward "minimal".** The correct delta is whatever Deno deterministically
produces.

## What to do

1. **Regenerate the lock deterministically** with the repo-pinned Deno 2.9.5 — `deno install
   --frozen=false` (or the equivalent the toolchain skill prescribes). Do **not** delete `deno.lock`,
   do **not** run `deno cache --reload`.
2. **Prove the delta is solely the closure of that one declared dependency.** The expected shape,
   measured on this exact base: **386 insertions, 9 deletions**, adding the direct specifiers
   `jsr:@fresh/plugin-vite@^1.1.2`, `npm:@babel/core`, `npm:@prefresh/vite`,
   `npm:@remix-run/node-fetch-server`, `npm:@types/babel__core`, `npm:rollup`, `npm:vite`, plus
   `jsr:@fresh/core@2`, `jsr:@deno/loader@0.4`, `@std/dotenv`, `@std/fmt`, `@std/media-types` and the
   derived Babel/Vite transitive graph.
   **If your delta differs from that shape, stop and report** — a larger delta means unrelated
   dependency movement crept in, which is exactly what must not land in a p0 release fix.
   **No source file changes.** This PR should touch `deno.lock` and nothing else.
3. **Prove `deno ci --prod` passes frozen** (no `--frozen=false`). Paste the output.
4. **Prove second-run lock neutrality.** Run the release-preparation gates, then run them **again**,
   and show `git diff --stat deno.lock` is **empty** after the second run. A lock that keeps moving is
   not fixed. Paste both checks.
5. **Run the standard gates** and paste real output:
   ```bash
   deno task publish:readiness
   deno task check
   deno task lint
   ```

## Commit trail

Open a **draft PR against `main`** in the same session as your first commit. Title:
`fix(release): regenerate the deno.lock closure for the packages/fresh plugin-vite dependency`.
Body per `netscript-pr` with **`Closes #1571`** in `## Scope`, plus your pasted evidence for
frozen `deno ci --prod` and second-run neutrality. Labels `type:fix`, `area:deps`, `priority:p0`,
`status:impl`, milestone `0.0.6`.

**Do not emit an `acceptance-evidence` block with an empty entry list** — the mirror throws on it
(#1561). #1571 has real checkboxes, so map them with `box-index` entries.

Push by explicit refspec and post a `[PHASE: IMPL]` comment with the commit hash and gate output.

## Reporting contract

Report: the exact lock delta stat, the specifier list you added, verbatim frozen `deno ci --prod`
output, the second-run neutrality proof, and **anything that surprised you**. If the regenerated
delta does not match the expected shape, that is a **stop-and-report**, not something to reconcile
by editing the lock.

Do **not** flip the PR to ready (that fires the automatic IMPL-EVAL, which is the orchestrator's
trigger) and do **not** merge. The orchestrator owns merge and the canary re-cut.
