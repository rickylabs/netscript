# IMPL-EVAL — refresh the MCP export-surface corpus (#1859 / PR #1862)

Proportionate IMPL-EVAL, per the coordinator brief. Output file is `impl-eval.md` (brief-mandated
name; the protocol default `evaluate.md` is not used for this run). Read-only over source; this
file is the only artifact written by this session. Nothing else under `.llm/runs/**` was touched.

| Field | Value |
| --- | --- |
| Run ID | `fix-mcp-export-corpus-refresh--1859` |
| Evaluated head | `c3a9d8bff27e967699336b6699be5b974c0f9b9d` (parent = base) |
| Base | `3b6386e14bd2176de795dad16fe523f5cd1fbcff` (`main`) |
| PR | rickylabs/netscript#1862 — draft, OPEN, head `fix/mcp-export-corpus-refresh` = `c3a9d8bff` |
| Evaluator | `z-ai/glm-5.3-flash` (OpenRouter) on Claude Code — opposite family to the GPT-5.6 Sol generator/supervisor; separate session, no self-certification (harness ref `9f05b15b-371f-401b-9ac1-283e239c0ad2`) |
| Toolchain | deno 2.9.5 (stable, x86_64-unknown-linux-gnu); `rtk` unavailable on this host (disclosed) |
| Method | All commands captured as `out=$(cmd 2>&1); rc=$?` — no exit ever taken from a pipeline. Generation and checks ran in throwaway detached worktrees (`/tmp/nseval-1862/{base,head,leafbase}`), each removed after evidence capture; the eval worktree was never mutated. |

## Why this eval exists

The final commit was authored by the supervisor (GPT-5.6 Sol) after the leaf's push failed the
freshness check, so the run could not self-certify. This evaluation is therefore reproduction, not
opinion: regenerate independently and compare blobs.

## Verification matrix

| # | Brief item | Result | Evidence (real exits) |
| - | --- | --- | --- |
| 1 | Reproduce the artifact at base `3b6386e14` | **CONFIRMED** | Clean detached worktree at `3b6386e14` (`git status --porcelain` empty, `rc=0`). `deno task gen:mcp-export-corpus` → `rc=0`; `git hash-object` on `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts` → `19cdf3783807efbfd092cb857bbb85f296de86a3`, identical to the blob committed at head (`git rev-parse HEAD:<path>` → same). Post-gen status shows only the corpus file modified. |
| 2 | Determinism | **CONFIRMED — 5/5 identical** | Three generations at `3b6386e14`, one at head `c3a9d8bff`, one at `78be0e032` — all `rc=0`, all byte-identical (same git blob `19cdf3783…`, same provenance `sha256=eb07868a60f91d5d48fdb27836625b02b917654850af6130b12c42af5a45e81a`, uncompressed 2,177,267, compressed 315,313, 35 packages / 271 subpaths / 7,782 symbols). The generator is genuinely deterministic on a clean tree: discovery order is sorted, entries are sorted by (package, subpath, symbol, kind), payload is canonical JSON → gzip → base64, then `deno fmt`-normalized. The earlier "non-deterministic-looking" result is explained, and proven, as unclean-tree generation (finding F-1). |
| 3 | RED at base, GREEN at head | **CONFIRMED** | Base worktree, pristine corpus (`e2631931…`): `deno task check:mcp-export-corpus` → `rc=1`, error `MCP export-surface corpus is stale; run deno task gen:mcp-export-corpus`. Head worktree, pristine corpus (`19cdf3783…`): same command → `rc=0`. |
| 4 | No hand-editing | **CONFIRMED** | Proven by regeneration identity, not inspection: generation at head `c3a9d8bff` rewrote the file and `git status --porcelain` came back **empty** — the committed blob is byte-identical to generator output. Additionally the leaf's pushed blob `bc3f6a2c27869f82f0a695d72fcac1baa4acc324` carries provenance `sha256=f8cc689d…` / 2,177,211 / 315,294, exactly matching the leaf worklog's recorded generation output — so the leaf did not hand-edit either; its generation environment was dirty (F-1). |
| 5 | Scope | **CONFIRMED** | `git diff --name-status 3b6386e14..c3a9d8bff`: exactly one product file (`M export-surface-corpus.generated.ts`, 4+/4−) plus 7 added files under `.llm/runs/fix-mcp-export-corpus-refresh--1859/` — nothing else. Exit-checked `git diff --exit-code` over `deno.lock` (`rc=0`), `packages/sdk` (`rc=0`), `.github` (`rc=0`), and `.llm/tools`+`packages/ai`+`deno.json` (`rc=0`). No CI/merge-gate wiring added (and none exists to begin with, F-2). |
| 6 | Is regeneration the right fix? | **YES — correct bounded response** | The corpus is a generated artifact whose freshness check is the protecting fitness function (AP-18 avoidance is exactly "use the generator, never hand-patch"). Regenerating — and never editing source or generator logic to make the check pass — is the only correct fix at this altitude. It does not, and per the coordinator ruling should not, address the process root cause here (F-2/F-3). |

## Process checks (proportionate)

- `PLAN-EVAL: N/A` was recorded before implementation (`plan.md`, `worklog.md`) with a locked
  contract/scope/gate set — justified for a mechanical regeneration. Process satisfied.
- Generator session (leaf, GPT-5.6 Sol) ≠ supervisor sign-off session (GPT-5.6 Sol) ≠ this
  evaluator session — separation honored; the supervisor-authored final commit is what triggered
  this independent verification.
- Commit trail: PR #1862 carries exactly one commit (`c3a9d8bff`) whose body states the RED→GREEN
  evidence and carries `Closes #1859`; the PR body repeats the bisection table, before/after
  provenance, and explicit non-scope. Consistent with my independent measurements.
- The worklog's other gate rows (repo check/test, quality scan, `arch:check`, JSR audit, scoped
  lint/fmt, sibling freshness checks, lock hygiene) were **not** re-run by this evaluator; the
  repo-wide test is supervisor-owned at this head per the brief. For a one-file generated-artifact
  regeneration, reproduction + freshness gate + scope audit is the proportionate gate set.

## Findings by severity

| ID | Severity | Finding | Disposition |
| --- | --- | --- | --- |
| F-1 | info | Root cause of the leaf's failed push is now established: the leaf's blob `bc3f6a2c2…` (`f8cc689d…`, 2,177,211 bytes) is **irreproducible from any clean tree** — clean generation at `78be0e032`, `233828f0f` (per the supervisor's own check), and `3b6386e14` all yield `19cdf3783…` / 2,177,267 bytes. Base drift was tested and **refuted** as the explanation (clean generation at the leaf's own base reproduces the head blob, not the leaf's). The leaf's generation ran against an unclean working tree. | Recorded here; no action on this PR. The shipped artifact is the correct one regardless of which unclean state produced the leaf's version. |
| F-2 | minor | `check:mcp-export-corpus` has **no CI wiring** (`grep -rn mcp-export-corpus .github/workflows/` → `rc=1`, no hits). That is the gap that let #1841 strand `main` red at `8f1fcb2bc` and every PR since. | Explicitly out of scope for this slice by coordinator ruling, and the PR body records that. Recommend a follow-up issue to gate the freshness check in CI. |
| F-3 | minor | `gen:mcp-export-corpus` has no clean-tree guard: it silently bakes whatever the working tree contains, which is precisely the F-1 failure mode (a stale/modified file under `packages/` or `plugins/` perturbs `deno doc` output and the generator overwrites the committed artifact with a plausible-looking but wrong corpus). | Out of scope here (generator behavior change). Recommend a follow-up: refuse generation when the tree is dirty, or at minimum warn on non-empty `git status --porcelain -- packages plugins`. |
| F-4 | info | `worklog.md`'s "Generate" row records `f8cc689d…` / 2,177,211 / 315,294 — the leaf's unclean-tree output, not the shipped corpus (`eb07868a…` / 2,177,267 / 315,313). A reader could mistake it for the final artifact's provenance. | No action: run artifacts are append-only records of what each session observed, and the leaf's row is an accurate record of its own run. This eval records the correct shipped provenance; the PR body already carries the correct final values. |
| F-5 | info | The `context-pack.md` drift note ("observed uncompressed increase was 168 bytes") is measured against the leaf's unclean output; the shipped increase versus the stale base corpus is +224 (2,177,043 → 2,177,267), matching the PR body. | No action; same reasoning as F-4. |
| F-6 | info | Run-artifact preservation verified: all 7 pre-existing run files are byte-identical between base and head (added, unmodified since), and this session added only `impl-eval.md`. | No action. |

## Verdict basis

All six brief items confirmed with real captured exits; scope is exactly the authorized artifact
plus run context; no doctrine violation introduced (the slice uses the generator, preserving the
AP-18 boundary); no debt created or deepened; the two process gaps found are pre-existing,
explicitly out of scope, and recorded as recommendations rather than blockers.

VERDICT: PASS
