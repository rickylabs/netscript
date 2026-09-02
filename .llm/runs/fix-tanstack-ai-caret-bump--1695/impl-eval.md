# IMPL-EVAL — TanStack AI coherent family bump (#1695 / PR #1832), cycle 1

| Field | Value |
| --- | --- |
| Evaluator | Separate opposite-family session (Claude Code / GLM 5.3 Flash), not the generator session |
| Evaluated head | `81339e24e7206abdac997d63b2b4bd9d394d03b5` (verified `git rev-parse HEAD`, RC 0) |
| Base used | merge-base with `origin/main` = `f59874abd2bc39446b21f5126323e0d2dcbce547` (the #1829-bearing main) |
| PR state | OPEN, draft, base `main`, `MERGEABLE` / `CLEAN`; PR checks: 0 failures (only `classify docs-site changes` and `build` ran, both pass) |
| Author/plan | `plan.md` (Archetype 4, `PLAN-EVAL: N/A`), worklog, context-pack, drift read in full |

Ref note: the brief's stated `main` (`58a4a10e`) is stale. Local `main` is `0274c0a7`;
`origin/main` is `62ea359b1`, one commit past the brief's SHA. The branch's merge-base with
`origin/main` is `f59874abd`; the two main commits beyond it (#1834, #1830) touch neither
`deno.lock` nor any `@tanstack/ai*` file (verified `git diff --name-only f59874abd origin/main`,
RC 0). Evaluation against the merge-base is therefore sound and the PR is CLEAN against `main`.

## Gate-carry claim — verified

`git diff --name-only 27967f366 81339e24e` → RC 0, exactly one file:
`.llm/runs/fix-tanstack-ai-caret-bump--1695/worklog.md`. The repo-wide gate result at `27967f366`
(4,444 passed / 0 failed / 19 ignored, REAL_EXIT=0) carries to the evaluated head by file identity.
Independently re-run at the head: #1829 filter 3/3, full focused file 5/5, `deps:check:zod` PASS
(captured RCs below).

## Sharp-question verdicts

### Q1 — Is the family move coherent, or is a pin left behind? → **Two surfaces left behind**

Independent enumeration (versioned-literal sweep over `*.ts/tsx/json/jsonc/md/js/mjs`, excluding
`.git`, `node_modules`, `.llm/runs` archives, `docs/site` generated output; plus every `deno.json`):

| Surface | Content | Status |
| --- | --- | --- |
| `packages/ai/deno.json:31-34` | `^0.52.0` / `^0.18.3` / `^0.3.8` / `^0.22.3` | current |
| `packages/fresh/deno.json:54-55` | ai `^0.52.0`, ai-preact `^0.14.4` | current |
| `packages/cli/src/kernel/adapters/scaffold/import-resolver.ts:18` + its test | `npm:@tanstack/ai-mcp@^0.3.8` emitted and asserted | current |
| root `deno.lock` | see Q2 | current |
| **`packages/fresh-ui/deno.lock`** | full private-workspace snapshot still on the 0.39 family | **stale — F1** |
| **`docs/architecture/zod-dependency-boundary.md:16`** | documents `@ag-ui/core@0.0.52` pulled by `@tanstack/ai@0.39` | **stale — F2** |

No other live versioned literal exists (run-dir archives and `docs/site` generated content are
historical/generated, not graph inputs). The leaf's own list (three beyond `packages/ai`) missed the
governed fresh-ui private lock and the prose half of the zod invariant.

### Q2 — Does `deno.lock` resolve one copy per package? → **Yes**

Root lock contains exactly one resolution per family name: `ai` 0.52.0 (specifier keys `0.52` and
`0.52.0` both map to the identical `0.52.0_@opentelemetry+api@1.9.1_zod@4.4.3` package), anthropic
0.18.3, mcp 0.3.8, openai 0.22.3, preact 0.14.4, client 0.29.2, event-client 0.11.2, utils 0.4.0,
openai-base 0.10.8. No 0.39-era key survives in the root lock. `deno why npm:@tanstack/ai`
(CAPTURED_RC=0) confirms every dependent — anthropic, mcp, openai, preact, ai-client, openai-base —
resolves against the single `@tanstack/ai@0.52.0`. The brief's "two versions in one graph" hazard is
**not** realized in any executable graph.

### Q3 — Is the zod-alignment edit fail-open? → **No; verified from the lock, not the diff**

Root lock at head: exactly one `@ag-ui/core` entry, `@ag-ui/core@0.1.1-canary.beta.0_zod@4.4.3`,
`dependencies: ["zod@4.4.3"]`, `optionalPeers: ["zod@4.4.3"]` — no v3. Zod v3 (`3.25.76`) remains
with exactly one consumer: `@olli/kvdex@3.6.7` (`npm:zod@^3.24.0`). The checker is fail-closed (its
PASS path requires exactly two instances, one v3 and one v4, and v3 parents ⊆ documented list), so
removing `@ag-ui/core@0.0.52` from the documented list cannot mask a still-present residual — had it
still pulled v3, `deps:check:zod` would fail, not pass. Captured: `deno task deps:check:zod`
CAPTURED_RC=0, `PASS instances=zod@3.25.76,zod@4.4.3 residual-v3=@olli/kvdex@3.6.7`; focused test
6 passed / 0 failed, CAPTURED_RC=0. **However** the prose half of the same invariant was not updated
(F2).

### Q4 — Is #1829's behavior genuinely preserved? → **Yes; re-derived independently**

- Byte-identity: extracted each complete `Deno.test('TanStack usage: …', …)` block from
  `f59874abd` and from the head with a string-aware balanced-paren scan and SHA-256'd both sides.
  All three EQUAL: fully-populated 350/350 bytes `f1c45440e28fb421…`; completeness-oracle 336/336
  `42f4d6ab23b16bc3…`; omitted-usage 267/267 `4b99129b2adc1ca9…`. (Hashes differ textually from the
  worklog's 352/338/269-byte hashes because the extraction byte-boundary differs by the closing
  characters; equality base↔head is method-invariant, which is the claim under test.)
- Runs at head: `--filter 'TanStack usage:'` → CAPTURED_RC=0, 3 passed / 0 failed; full
  `tanstack_chat_client_test.ts` → CAPTURED_RC=0, 5 passed / 0 failed (includes the leaf's two new
  regressions).
- Fallback judgement: `chunk.finishReason ?? chunk.metadata?.tanstack?.finishReason` is sound. In
  0.52's server-side `chat()` path the top-level field is absent and `metadata.tanstack.finishReason`
  is derived from the same source value by upstream normalization, so within-chunk divergence is not
  a shape 0.52 produces; top-level precedence only matters for malformed input, and the worklog
  already records that as a post-release verification item. Masking risk: accepted.
- The identity-preserving middleware is forced, not opportunistic: without it, 0.52's AG-UI
  reconstruction of canonical `TokenUsage` breaks #1829's object-identity oracle (the documented
  2-pass/1-fail intermediate state). Capture is scoped to object-form usage on `RUN_FINISHED`, the
  per-stream map entry is deleted after consumption, and array-form usage still goes through
  `fromSpecTokenUsage`.

### Q5 — Is the adapter rewrite minimal? → **Yes**

Every hunk maps to a documented 0.52 forcing function: non-null activity context (`context: request.context ?? {}`),
name-less `TOOL_CALL_END` (name now solely from the preceding `TOOL_CALL_START`; 0.52 removed the
END name fields, so the old expression could not compile), `SpecTokenUsage[]` union (handled with
TanStack's own `fromSpecTokenUsage` — wrap, not reinvent), and the identity middleware (Q4). No new
exports, modules, ports, or public-surface change; AP-9/AP-14/AP-25 respected. One accepted
behavior note: a `TOOL_CALL_END` with no preceding `START` now yields name `''` — 0.52 supplies no
name on END, so no better source exists; the focused regression covers the normal START→END path.

## Findings by severity

### F1 — SIGNIFICANT — `packages/fresh-ui/deno.lock` left stale; CI-gated frozen check now fails

The coherent family move changed specifier ranges that the governed private lock snapshots. At the
evaluated head, the exact command CI's `fresh-ui-quality` job runs (`deno task --cwd
packages/fresh-ui check`, the `--lock=deno.lock --frozen` path) fails:

- head: **CAPTURED_RC=1**, both check batches fail with `error: The lockfile is out of date`, diff
  showing precisely the family movement (`@tanstack/ai-anthropic@~0.15.13 → ~0.18.3`,
  `ai-mcp@0.2.1 → ~0.3.8`, `ai-openai@~0.15.10 → ~0.22.3`, `ai-preact@~0.10.1 → ~0.14.4`,
  `ai@0.39 → 0.52`, plus `@ag-ui/core@0.0.52 → 0.1.1-canary.beta.0`, `@hono/node-server`,
  `@modelcontextprotocol/sdk@1.29.0 → 1.30.0`). The frozen check did not rewrite the lock
  (`git status --porcelain packages/fresh-ui/deno.lock` empty).
- merge-base `f59874abd` (disposable worktree, removed afterwards): **CAPTURED_RC=0**, 0 failed
  batches — the breakage is attributable to this leaf.
- This PR's own CI is unaffected: `ci-classify-changes.ts` sets `freshUi` only for
  `packages/fresh-ui/**` and the fresh-ui workflow, neither of which this diff touches, so the job
  is skipped by policy (confirmed: PR checks show 0 failures). The next PR that touches
  `packages/fresh-ui/**` will hit the red gate.
- Mitigations: the failure is fail-closed with a precise, documented remediation in the gate's error
  message (`deno task --cwd packages/fresh-ui lock:update`); repo precedent exists for a dedicated
  regeneration PR (#1581); the plan explicitly scoped this file out. No executable graph resolves
  the 0.39 family — this is deferred gate breakage, not mixed-version execution.
- **Disposition: REQUIRED before merge** — either regenerate the private lock in this PR and verify
  the frozen check returns RC 0, or record an explicit owner-accepted deferral with a filed
  follow-up before merge. The worklog's consumer audit (workspace `deno.json` specifiers) is the
  process gap that missed this governed artifact; the "Forced Workspace Scope" method should name
  private locks for future family moves.

### F2 — MEDIUM — `docs/architecture/zod-dependency-boundary.md` now contradicts the checker and the lock

The leaf updated the enforcement half of the zod invariant (checker + fixture + test) but not its
canonical prose. The doc still says the 0.0.5 graph retains v3 "owned only by" **two** parents
including `@ag-ui/core@0.0.52` "pulled by `@tanstack/ai@0.39`" (line 16), and the guard list still
promises "the only remaining v3 parents are the two exact dependencies documented here" (line 29).
Post-change reality: one v3 parent (`@olli/kvdex@3.6.7`), and the AG-UI canary now accepts Zod 4 —
which also materially changes the doc's #1320 unblock condition (line 19-22). Checker and doc now
disagree on a CI-enforced invariant; the drift is unrecorded in worklog/drift. The worklog's own
framing ("the checker must stop documenting it as an allowed Zod-v3 residual parent") makes this
surface in-scope.
- **Disposition: REQUIRED before merge** — small prose update to the post-0.52 graph (single v3
  parent, ag-ui 0.1.1-canary on zod 4, guard-list line, #1320 condition), or an explicit recorded
  handoff to #1320's owner. Silent divergence is not acceptable given the fail-closed checker this
  leaf edited.

### F3 — MINOR / accepted

END-without-START tool calls yield an empty name under 0.52 (upstream no longer carries it) and
finish-reason top-level precedence could mask a conflicting metadata value only on malformed input.
Both are documented in the worklog with a post-release verification note. No action.

### F4 — MINOR / accepted (process note)

Implemented scope exceeded plan non-scope (`packages/fresh/deno.json`, `@tanstack/ai-preact`) as a
gate-forced consequence, documented as a rewrite in the worklog's "Forced Workspace Scope" (an
allowed drift/worklog home) but not as a `drift.md` entry. The worklog correction commit
(`81339e24e`) was verified to be in-place rewrites, not appended contradictions: the false claims
("Fresh untouched"; pre-fix FAIL as outcome) are gone, historical sections are relabeled
"(Superseded)"/"Historical", and no other stale claim survives in the worklog.

## What passes

Dependency move (Q1/Q2), zod checker edit (Q3, fail-closed, lock-verified), #1829 preservation
(Q4), adapter minimality (Q5), gate-carry by file identity, PR CI green (0 failures), sibling
boundary untouched (`packages/plugin-workers-core/deno.json`, `plugins/triggers/deno.json` absent
from the branch diff), arch-debt requires no delta (no related entry exists). PLAN-EVAL N/A
remains honest: every expansion was a mechanically evidenced consequence with objective gates.

## Required fixes for cycle 2

1. F2: update `docs/architecture/zod-dependency-boundary.md` to the post-0.52 graph.
2. F1: regenerate `packages/fresh-ui/deno.lock` (`deno task --cwd packages/fresh-ui lock:update`,
   then verify `deno task --cwd packages/fresh-ui check` returns RC 0) — or file the follow-up and
   record the owner-accepted deferral before merge.
3. Revalidate minimally: `deno task deps:check:zod`, the `TanStack usage:` filter, and the
   fresh-ui frozen check if F1 is fixed in-cycle.

VERDICT: FAIL_IMPL
