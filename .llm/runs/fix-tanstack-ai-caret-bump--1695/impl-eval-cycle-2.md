# IMPL-EVAL — cycle 2 (delta) — TanStack AI family move (#1695 / PR #1832)

| Field | Value |
| --- | --- |
| Evaluator | Separate opposite-family session (Claude Code / GLM 5.3 Flash); author of the delta is the implementation session (OpenAI GPT-5.6-Sol) |
| Evaluated head | `af2abed22ee7d468c6f005effa7401592a8fb187` (verified `git rev-parse HEAD`, detached) |
| Cycle-1 head | `220f4b503` (verdict `FAIL_IMPL`, two findings) |
| `main` | `8f1fcb2b` (per brief) |
| PR state | #1832 OPEN, draft, base `main`, `MERGEABLE`/`CLEAN`; origin branch tip == evaluated head |
| Scope | Delta only (`220f4b503..af2abed22`); cycle-1 pass set is not re-litigated |

## Delta containment — verified

`git diff --name-status 220f4b503..af2abed22` → RC 0, exactly five files: `packages/fresh-ui/deno.lock`,
`docs/architecture/zod-dependency-boundary.md`, and three run artifacts
(`worklog.md`, `drift.md`, `context-pack.md` under `.llm/runs/fix-tanstack-ai-caret-bump--1695/`).
No other tracked file changed. The run-artifact deltas are in-place state updates, not appended
contradictions (the context-pack's stale "integration stopped" state is replaced, worklog repair
section is new, drift entry is new). Scope containment: **PASS**.

## F1 — private Fresh UI lock — disposition: FIXED (verified, not papered over)

1. **No pre-bump resolution survives.** Independent key enumeration of
   `packages/fresh-ui/deno.lock` (both the `specifiers` mapping and the `npm` section):
   `@tanstack/ai@0.52.0`, `ai-anthropic@0.18.3`, `ai-mcp@0.3.8`, `ai-openai@0.22.3`,
   `ai-preact@0.14.4`, `ai-client@0.29.2`, `ai-event-client@0.11.2`, `ai-utils@0.4.0`,
   `openai-base@0.10.8`, `@ag-ui/core@0.1.1-canary.beta.0` — the full post-bump family. No 0.39-era
   key remains in any section (the diff replaces the old specifier keys `~0.15.13`/`0.2.1`/
   `~0.15.10`/`~0.10.1`/`0.39` outright).
2. **Frozen check RC 0 at this head.** `out=$(deno task --cwd packages/fresh-ui check 2>&1); rc=$?`
   → **CAPTURED_RC=0**; the task is verifiably the `--lock=deno.lock --frozen` path
   (`packages/fresh-ui/deno.json` `check` task), 150 files, 2 batches, 0 failed batches.
3. **Regenerated, not hand-edited.** Three independent signatures: (a) the diff is a wholesale
   re-resolution — it moves unrelated transitive entries a TanStack-targeted hand-patch would not
   touch (`@hono/node-server@1.19.14 → 2.1.1`, `@modelcontextprotocol/sdk@1.29.0 → 1.30.0`) and adds
   the `optionalPeers` zod-4 edge AG-UI gained upstream; (b) integrity hashes of the shared TanStack
   and AG-UI entries are byte-identical to the root lock's independent resolutions (`ai`, `ai-anthropic`,
   `ai-mcp`, `@ag-ui/core` cross-checked); (c) the `--frozen` check re-derives the full graph against
   the lock, so any internally inconsistent patch could not have returned RC 0.

## F2 — Zod boundary prose — disposition: FIXED (rewrite verified, correct against the lock)

The diff deletes the old-graph statements outright — the `@ag-ui/core@0.0.52` v3-parent bullet, the
"two upstream hard dependencies" framing, the obsolete "do not upgrade the TanStack cluster to 0.43"
sentence, and the "two exact dependencies" guard-list line are all **removed**, not contradicted
below a surviving claim. A stale-reference grep over the live doc
(`0.0.52|@tanstack/ai@0.39|0.43|two exact|two npm`) returns zero matches.

Correctness, checked against the locks rather than the prose: kvdex is the sole v3 parent (my own
JSON scan of both locks' `npm` sections finds **zero** npm packages pulling `zod@3.25.76`; the sole
v3 consumer is the JSR entry `@olli/kvdex@3.6.7`, whose dependencies carry `npm:zod@^3.24.0`);
`@ag-ui/core@0.1.1-canary.beta.0` binds `zod@4.4.3` in both locks (`dependencies` and
`optionalPeers`); `@anthropic-ai/sdk`, `@modelcontextprotocol/sdk`, `openai`, `zod-to-json-schema`
each resolve exactly one key, every one suffixed `_zod@4.4.3`, none v3-bound. Enforcement is aligned
with prose, not just changed: `deno task deps:check:zod` → **CAPTURED_RC=0**,
`instances=zod@3.25.76,zod@4.4.3 residual-v3=@olli/kvdex@3.6.7`, and the checker's fail-closed
residual list (`DOCUMENTED_V3_JSR_PARENT = '@olli/kvdex@3.6.7'`, any other v3 parent fails) now
asserts the same graph the doc documents, including the rewritten #1320 unblock condition.

## Fifth lock — disposition: agree, leave frozen (independently confirmed)

I re-derived the judgement instead of inheriting it. The fixture lock
(`.llm/runs/docs-rfc-runtime-versioned-automation--supervisor/evidence/current-state-probes/schema-fixture/deno.lock`)
is tracked, and my sweep confirms **exactly five** tracked `deno.lock` files, matching the
implementer's enumeration. Findings:

- The pre-bump strings live **only** in `workspace.links` — a frozen record of the 0.0.5-era member
  dependency edges. The sections that drive resolution (`specifiers`, `npm`) contain **no** TanStack
  entry at all; the lock resolves no pre-bump package even on its own terms.
- It is not a graph input: root workspace members are `packages/*`, `packages/cli/e2e`, `plugins/*`,
  `examples/*`, `apps/*` — nothing under `.llm/` — and a reference sweep over `deno.json`,
  `.llm/tools/`, `packages/`, `docs/`, `.github/` finds no consumer of `schema-fixture`.
- It is not merely historical — it is **unresolvable here**: its own `deno.json` imports
  `file:///home/codex/repos/ns-rfc-runtime-versioned-automation/...`, absolute paths into a foreign
  Codex checkout. It records probe-time state captured at RFC 0002 acceptance (`f3eb957ec`).
- Rewriting it would corrupt another run's recorded evidence while changing no executable graph —
  the exact defect cycle 1's F1 framing guards against ("no *executable* graph resolves the 0.39
  family"). Bumping it would be the error, not the fix. The remaining two locks are also clean:
  `docs/site/deno.lock` and the `wasmbuild-lcg` benchmark fixture contain zero `@tanstack` strings;
  the root lock carries only the 0.52 family.

## #1829 preservation — holds after the delta

- The test file is untouched by the delta (`git diff --name-only 220f4b503..af2abed22` omits it).
- Byte-identity re-derived at this head with my own extraction (marker → next `Deno.test(` boundary,
  both revisions): block 1 351 B `64c7bf70…`, block 2 337 B `f03a5047…`, block 3 268 B
  `ca9f37ad…` — all three **equal** base↔head. The byte counts coincide with the worklog's extraction
  (351/337/268) and differ from cycle-1's only by boundary convention, which was expected.
- Live run: `deno test --unstable-kv --allow-all --filter 'TanStack usage:'` → **CAPTURED_RC=0**,
  **3 passed / 0 failed**, 2 filtered out (the two 0.52 bridge regressions, consistent with cycle 1).

## What carries from cycle 1 without re-litigation

The dependency move, fail-closed zod-checker edit, adapter minimality, gate-carry, and sibling
boundary passed cycle 1 and are untouched by the delta except as verified above. The delta
introduces no surface outside the two gates re-run here: the lock is governed by the fresh-ui frozen
check (RC 0), the doc by the zod checker (RC 0). For that reason the verdict does **not** require the
repo-wide `deno task test` re-run; cycle-1's green result carries to this head by file identity.

## Findings by severity

- **MINOR / accepted (evidence nit).** The worklog records the private-lock delta as
  "74 insertions(+), 70 deletions(-)"; actual `git diff --stat 220f4b503..af2abed22 --` on the lock
  is 67 insertions / 62 deletions. The discrepancy is in a reported stat line only — every load-bearing
  claim (key set, gates, byte-identity) verified independently. No action required.
- **No blocking findings.** F1 and F2 are fixed with real captured exits; the fifth-lock call is
  correct and preserved; #1829 holds; scope is contained.

VERDICT: PASS
