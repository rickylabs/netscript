# IMPL-EVAL — #1827 CLI/E2E compiler-lib parity

| Field | Value |
| --- | --- |
| Run ID | `fix-cli-e2e-unstable-parity--1827` |
| Evaluated head | `1c08b8b0afe74c479bd0770c956204e7cad3a5bd` (detached, matches `origin/fix/cli-e2e-unstable-parity` at eval time and PR #1828 `headRefOid`) |
| Base used for leaf scope | `a3e0a5aa8beebbd1f7a488d564d31980a7d74619` (newer main snapshot merged in `fef770b18`) |
| `origin/main` at eval time | `eaea940bea4c19593b97b9895b09f512039f4e13` (matches the brief's base) |
| Evaluator | Separate session, opposite family to the GPT-5.6-Sol author (GLM 5.3 Flash / max route) |
| Mode | Read-only over source; only this artifact written; no labels flipped, no merge |

All exits below are real captured codes (`out=$(cmd 2>&1); rc=$?`), never pipeline-derived.
Destructive probes ran in throwaway worktrees (`/tmp/eval1827-red`, `/tmp/eval1827-f1762`),
both removed after the run.

## Attack narrative

### 1. RED falsification (the blocking check) — genuinely red

`git worktree add /tmp/eval1827-red 4c0db7fea`. Verified before running anything:

- `git rev-parse HEAD` → `4c0db7feab16ecf504631ad43866c68a82eee1e5`; `git status --short` → empty
  (no dirty working tree — the false-RED failure mode from history cannot recur here).
- Config on disk read programmatically → `["deno.ns","dom"]`, matching the commit; pre-fix for real.

Focused run (same command shape as the worklog receipt):

- `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all
  packages/cli/e2e/tests/config-lib-parity_test.ts` → **exit 1**, summary `0 passed / 1 failed`,
  1 unique failure.
- The assertion diff shows exactly the missing middle element:
  actual `["deno.ns","dom"]` vs expected `["deno.ns","deno.unstable","dom"]` — and the expected
  side carries the **CLI-oracle** order (`deno.ns` first), not the repo-root order
  (`["dom","deno.ns","deno.unstable"]`). This simultaneously proves the test resolves
  `../../deno.json` → `packages/cli/deno.json` and that a root-oracle GREEN would have failed here.

RED is genuine. The prior false RED (passing against a fixed working tree) is not reproducible:
the tree was clean and the config on disk pre-fix at capture time.

### 2. GREEN from the config fix alone — confirmed

- Same focused command at `1c08b8b0a` → **exit 0**, `1 passed / 0 failed`.
- Test blob byte-identity: `git rev-parse 4c0db7fea:packages/cli/e2e/tests/config-lib-parity_test.ts`
  and `27285b72a:…` both → `9581e7514fcb1793b46632fe7a631e4ba285cbae`. **Byte-identical.**
- `git diff --name-only 4c0db7fea 27285b72a` → only `packages/cli/e2e/deno.json` (1 insertion).
  Green is attributable to the config line alone; the test was not loosened.
- Independent compile validation at the evaluated head: scoped
  `run-deno-check.ts --root packages/cli/e2e --ext ts,tsx` → **exit 0**, 185 files / 2 batches,
  0 failed batches, 0 diagnostics.

### 3. Invalid history genuinely absent

- `bbed08071` (wrong root-derived-order GREEN) and `86443f47a` (false RED): both objects exist as
  unreachable reflog entries, but `git merge-base --is-ancestor <c> 1c08b8b0a` is false for both.
  Neither is reachable from the evaluated head.
- `git ls-remote origin refs/heads/fix/cli-e2e-unstable-parity` → `1c08b8b0a…`, equal to the PR
  `headRefOid`. The force-with-lease repair landed; the remote carries only the corrected history.

### 4. Is the parity test meaningful? — yes for the defect class, with one real vacuous path

Empirical probes in the throwaway RED worktree (both configs then restored):

| Probe | Mutation (disposable copy only) | Exit | Result |
| --- | --- | --- | --- |
| Content drift | RED state (missing `deno.unstable`) | 1 | caught (§1) |
| Order-only drift | same members, order `["deno.unstable","deno.ns","dom"]` | 1 | caught — order-sensitive |
| Missing oracle | `packages/cli/deno.json` renamed away | 1 | caught — `readTextFile` rejects; not vacuous |
| Both sides lose `lib` | `lib` key removed from **both** configs | **0** | **NOT caught — false green** |

The last row confirms the brief's hypothesis: with the `DenoConfig` optional-chaining path,
`assertEquals(e2e.compilerOptions?.lib, production.compilerOptions?.lib)` passes as
`undefined === undefined` when `lib` (or all of `compilerOptions`) disappears from both files
simultaneously. The test enforces member↔production parity — the defect class this leaf fixes —
and is robust against missing/unreadable files and order drift, but it does **not** anchor the
existence of `deno.unstable` in production itself. If a future refactor dropped `deno.unstable`
from both configs in the same sweep, the guard stays green. Severity: **Low** (see findings);
the failing direction that motivated #1827 (E2E drifting from production) is fully caught, and
production is the config owners actively edit, so a synchronized two-file drop is the less likely
drift. A one-line hardening (out of this leaf's scope) closes it: assert
`production.compilerOptions?.lib?.includes('deno.unstable')` before comparing.

Enforcement wiring (verified, not assumed): `packages/cli/e2e` is a root workspace member
(`deno.json` workspace line 5). Root `deno test --allow-all --filter "compiler libs match"`
(no path, workspace root) **discovered and executed** the guard — `1 failed / 3795 filtered out`
in the RED tree — so the repo-wide test gate (CI `check-test` job, `--gate test`) enforces it;
the guard is not orphaned.

### 5. Scope discipline — clean, with one diff-vs-older-base artifact to read correctly

- Leaf-authored diff (`a3e0a5aa8… → 1c08b8b0a`, outside `.llm/runs/`) → exactly
  `packages/cli/e2e/deno.json` + `packages/cli/e2e/tests/config-lib-parity_test.ts`. Nothing else.
- Forbidden paths: `git diff eaea940bea… 1c08b8b0a -- packages/service/src/primitives/health.ts
  .llm/tools/run-deno-check.ts` → empty. `deno.lock` diff base→head → **empty (byte-unchanged)**;
  also byte-identical against the leaf's own base.
- #1762-owned roots: `git diff a3e0a5aa8… 1c08b8b0a -- packages/contracts packages/plugin
  packages/service packages/sdk packages/mcp` → empty.
- **Observation (not a violation):** the brief's literal scope command,
  `git diff --name-only eaea940bea 1c08b8b0a`, additionally surfaces modifications in
  `packages/ai` (3 files), `packages/fresh` (2 files), the `packages/mcp` export-surface corpus,
  and deleted `.llm/runs/feat-*` artifact dirs. All of that rides in through main-side history:
  `origin/main` is `eaea940bea`, the leaf's merge `fef770b18` (parents `27285b72a` + `a3e0a5aa8`)
  integrated the newer main snapshot `a3e0a5aa8`, and `git diff eaea940bea… a3e0a5aa8` shows the
  identical ai/fresh/mcp paths. None are leaf-authored; the leaf's base already contained them.
  Anyone auditing the brief's command should attribute those files to the main merge, not to #1827.
- The merge commit `fef770b18` is a pure two-parent merge of the leaf GREEN and main; the evidence
  commit `1c08b8b0a` adds only `.llm/runs/fix-cli-e2e-unstable-parity--1827/` artifacts.

### 6. The #1762 unblock claim — reproduced independently; claim holds at the compile-gate level

I did not accept the worklog's #1762 receipts on trust. Reproduction at the actual feature head
`686eedb62db189907936dee8a0edc5acf295529a` (present locally; disposable detached worktree):

- That tree's checked-in `packages/cli/e2e/deno.json` is pre-fix `["deno.ns","dom"]` (verified on disk).
- `deno info packages/cli/e2e/tests/agent/agent-mcp-stdio_test.ts` reaches
  `packages/service/src/primitives/health.ts` (4 references) — the originating
  plugin-root → service runtime/KV path is real in that graph.
- Pre-fix: `deno check --unstable-kv packages/cli/e2e/tests/agent/agent-mcp-stdio_test.ts`
  → **exit 1** with the **sole** diagnostic
  `TS2551 at packages/service/src/primitives/health.ts:184:29` (`Deno.openKv` is an unstable API;
  add `deno.unstable` to `lib`) — exactly the worklog's claimed diagnostic.
- After: inserting only `"deno.unstable"` between `deno.ns` and `dom` in that disposable copy →
  **exit 0**, 0 errors.
- Negative control at this leaf's own base `4c0db7fea`: the same root check exits 0 even though
  `health.ts:184` already calls `Deno.openKv()` — the older graph does not reach it. This is the
  worklog's own recorded caveat, and it is honest: the unblock claim rests on the `686eedb62`
  proof, which I reproduced, not on the leaf-base probes.

Honest scope of the unblock: what I verified end-to-end is the **compile-gate failure path**
(the TS2551 diagnostic that fails `deno task check`/repo-wide check at the #1762 head) and that
the one-line E2E config fix removes it. The worklog additionally reports the full 2,974-file
`deno task check` at `686eedb62` failing with that sole diagnostic and passing after the fix; I
did not rerun the full-tree check myself (cost), but my focused-root before/after is
mechanism-equivalent for the one failing root and consistent with those receipts. I found no
evidence of overclaim: the run and PR comments state exactly this mechanism and no more.

### 7. Evidence hygiene — no live root-order claim

- Run artifacts (`plan.md`, `research.md`, `drift.md`, `worklog.md`, `context-pack.md`,
  `supervisor.md`, `codex-thread-ids.md`): every mention of the root-derived order
  (`["dom","deno.ns","deno.unstable"]`) is either a correction record, an explicit rejection
  ("must not determine this member's order"), or the marked-invalid `86443f47a` receipt. No live
  assertion of root order as canonical.
- PR #1828 comments (2, both by the author): the corrected RED record explicitly states it
  "replaces the invalid `86443f47a` receipt, which used repository-root `deno.json` as the wrong
  oracle. It is not evidence for GREEN." The PR body contains no lib-order or oracle claims at all.
- Gate receipts: this run captured gates as inline `out=$(…); rc=$?` captures in `worklog.md`
  rather than `.llm/runs/…/receipts/*.json` gate receipts. My independently rerun checks
  (focused RED/GREEN, scoped check, #1762 before/after) reproduce the load-bearing ones, so the
  narrative receipts are corroborated; noted as an observation only.

## Findings by severity

| Severity | Finding | Disposition |
| --- | --- | --- |
| Low | The parity test has one vacuous-pass path: `lib` absent from **both** configs yields `undefined === undefined` → exit 0 (empirically demonstrated). It enforces member↔production parity but does not anchor `deno.unstable`'s existence in production. Suggested follow-up hardening (one line, outside this leaf): assert `production.compilerOptions?.lib?.includes('deno.unstable')` (and/or non-empty) before comparing. | Non-blocking; do not gate this leaf on it. |
| Info | The brief's scope command (`eaea940bea → 1c08b8b0a`) surfaces main-side ai/fresh/mcp changes that predate the leaf's base (`a3e0a5aa8`, merged in `fef770b18`). Leaf-authored scope is exactly the two intended files; attribution artifact only. | No action; recorded for auditors. |
| Info | Guard enforcement confirmed via workspace membership + root-suite discovery probe (1 selected / 3795 filtered); CI `check-test` runs the repo-wide test gate. | No action. |
| Info | Gates were captured as inline worklog receipts, not `.llm/tmp/gate-receipts/` JSON. Independent reruns here corroborate the load-bearing ones. | No action for this leaf. |
| Info | `rtk` unavailable on this host (matches the run's recorded tooling-fallback drift); raw git/gh used. | No action. |

## What was independently verified (summary)

1. Genuine RED at `4c0db7fea` (exit 1, clean tree, pre-fix config on disk, CLI-oracle diff).
2. Green at `1c08b8b0a` from the config fix alone (byte-identical test blob `9581e751…`).
3. Correct oracle and production order `["deno.ns","deno.unstable","dom"]`; one-line config diff.
4. Invalid commits `bbed08071`/`86443f47a` unreachable from the evaluated head; remote tip == PR head.
5. No live root-order claim in any artifact, PR comment, or PR body.
6. Scope: leaf-authored diff is exactly the two intended files; `deno.lock` byte-unchanged;
   `health.ts` / `run-deno-check.ts` / #1762-owned roots untouched.
7. #1762 unblock mechanism reproduced at `686eedb62`: TS2551 `health.ts:184:29` pre-fix → exit 0
   after the one-line insertion (both directions, real exits).
8. Guard is enforced by the repo-wide suite (workspace member discovery), not just manual runs.

## Verdict

The leaf does what it claims, the RED→GREEN history is honest, the history repair is real, the
scope is clean, and the P0 unblock claim is supported by independently reproduced mechanism
evidence. The single Low finding is a hardening opportunity for the guard, not a defect in this
change.

VERDICT: PASS
