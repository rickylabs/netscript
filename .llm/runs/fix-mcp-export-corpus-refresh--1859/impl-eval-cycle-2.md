# IMPL-EVAL — cycle 2 — colour-invariant export-surface corpus (#1859 / PR #1862)

Fresh-cycle evaluation. **No conclusion is inherited from cycle 1**; its `impl-eval.md` (PASS) is
retained in this run directory, unmodified, as a record of a mistake (a reproducibility verdict that
never varied the colour environment). This file is the only artifact written by this session; no
other file under `.llm/runs/**` or the source tree was touched.

| Field | Value |
| --- | --- |
| Run ID | `fix-mcp-export-corpus-refresh--1859` |
| Evaluated head | `4dec2407cd1e979295eaf9affe673b46526fba97` (fix commit under evaluation) |
| Remote PR tip at eval time | `429f1a0a9ec93fd38d67e1b753c0b1516f843fa2` = merge of evaluated head with `origin/main` `8e01a347a`; diff `4dec2407c..429f1a0a9` over the four fix files is empty and the corpus blob is identical (`bc3f6a2c2…`), so all conclusions hold at the tip |
| Base | merge-base(`origin/main`, head) = `b66e52cbc` |
| PR | rickylabs/netscript#1862 — OPEN, **non-draft** (`isDraft:false` observed; transition not acted on by this session) |
| Evaluator | `z-ai/glm-5.3-flash` (OpenRouter) on Claude Code — fresh session, opposite family to the cycle's Claude/Opus generator; no shared context with the cycle-1 evaluator beyond reading its artifact as voided history |
| Toolchain | deno 2.9.5 (stable, linux-x86_64); `rtk` unavailable on this host (disclosed) |
| Method | Every command captured as `out=$(cmd 2>&1); rc=$?` or stream-separated `>/out 2>/err; rc=$?` — no exit code ever taken from a pipeline. Generation matrix and test mutations ran in throwaway detached worktrees `/tmp/nseval-1862-c2/{h,w2}`; both ended with `git status --porcelain` empty. The eval worktree was never mutated. |

## Why cycle 2 exists — and confirmation that cycle 1's PASS was wrong

Cycle 1 proved the corpus *reproducible* under one colour environment. Decoding the blob cycle 1
verified (`19cdf3783…`, committed at `4dec2407c^`) shows it was contaminated: **6 JSON-encoded ANSI
escape sequences** (`[0m` ×4, `[36m` ×2), 0 raw `0x1b` bytes — a byte-level scan finds
nothing because the escapes are JSON-encoded inside the gzip+base64 payload. That false-negative is
exactly how the defect shipped with a green freshness check and a green eval.

Mechanism ground truth, measured directly on `deno doc --json packages/sdk/mod.ts` (piped stdout,
deno 2.9.5, `rc=0` in all cases):

| Child env | `u001b` occurrences | Output bytes | Note |
| --- | --- | --- | --- |
| bare (`env -i PATH HOME`) | 6 | 960642 | **colour is on by default** — no colour vars at all |
| `FORCE_COLOR=1` | 6 | 960642 | byte-identical to bare (`cmp` rc=0) |
| `CLICOLOR_FORCE=1` | 6 | 960641 | same escape content |
| `NO_COLOR=1` | 0 | 960586 | the only suppressor |
| `NO_COLOR=1` + `FORCE_COLOR=0` | 6 | 960641 | **even `FORCE_COLOR=0` forces colour**, overriding `NO_COLOR` |
| `NO_COLOR=1` + `CLICOLOR_FORCE=1` | 0 | 960585 | `CLICOLOR_FORCE` does **not** override `NO_COLOR` in 2.9.5 |

Consequences: the defect triggered under **default, CI-like conditions** (any environment without
`NO_COLOR=1`), which is worse than "depends on the caller's terminal"; and because `FORCE_COLOR=0`
forces colour, the fix must **delete** `FORCE_COLOR` rather than set it — exactly what the
implementation does.

## Verification matrix (brief items)

| # | Brief item | Result | Evidence (real exits) |
| - | --- | --- | --- |
| 1 | Invariance, not reproducibility | **CONFIRMED** | Four generations of `deno task gen:mcp-export-corpus` in a clean detached worktree at `4dec2407c`, callers `NO_COLOR=1`, `FORCE_COLOR=1`, `CLICOLOR_FORCE=1`, and bare (`env -i PATH HOME`): all `rc=0`, all produced git blob `bc3f6a2c27869f82f0a695d72fcac1baa4acc324` — identical to each other and to the blob committed at head and at remote tip `429f1a0a9`. All four carried identical provenance `sha256=f8cc689d…`, 2,177,211 uncompressed / 315,294 compressed, 35 packages / 271 subpaths / 7,782 symbols. Post-gen `git status --porcelain` empty each time (exit checked, not inferred). Runtime ~6–7 s each. |
| 2 | Committed corpus is escape-free | **CONFIRMED** | Payload decoded (base64 → gunzip → JSON text) from the committed file: `jsonU001bEscapes: 0`, `rawEscBytes: 0`. SHA-256 recomputed over the compressed bytes = `f8cc689d7b82e9a96a582808a48e87b024ca28445644749f1e67b8236dc463e3` = the metadata `sha256` (payload self-consistent, not hand-edited). The cycle-1-era blob decoded to 6 escapes (see above) — the delta between old and new payloads is **exactly** those 6 sequences (56 bytes; old ≡ new after removing precisely `[0m`/`[36m` occurrences), all inside the `signature` of one symbol, `SdkClientContributionId` (a template-literal type rendered through `repr`). |
| 3 | Fix is the right shape (delete, don't override) | **CONFIRMED** | `colorInvariantChildEnv()` deletes `FORCE_COLOR`/`CLICOLOR_FORCE` from a copy of the parent env, sets `NO_COLOR='1'`, and both `deno doc` and `deno fmt` children run with `env: colorInvariantChildEnv(), clearEnv: true`. The `FORCE_COLOR=0`-forces-colour claim was verified directly (table above), not trusted. |
| 4 | Regression has teeth | **CONFIRMED** | `deno test --no-lock --allow-all .llm/tools/docs/generate-export-surface-corpus_test.ts` at head: `rc=0`, 5/5 pass. In a scratch copy with the guard **removed** (V1: return `Deno.env.toObject()`), both the integration test (`rc=1`) and the unit test (`rc=1`) fail. With the **wrong shape** (V2: `{...env, NO_COLOR:'1', FORCE_COLOR:'0', CLICOLOR_FORCE:'0'}`), the integration test also fails (`rc=1`) — the test distinguishes deletion from falsy override. The control assertion genuinely proves the unguarded child emits escapes: the test passes only when `unguarded.includes('\\u001b')` holds, and my direct probes independently show the unguarded child emitting 6 escapes. |
| 5 | `--allow-env` justified and minimal | **CONFIRMED** | Necessity: running the generator with the old task permissions (no `--allow-env`) → `rc=1`, `NotCapable: Requires env access`. Both tasks need the grant because `--check` mode also runs `buildExportSurfaceCorpus()` (it rebuilds and compares, so it spawns the same children). Minimality: scoped `--allow-env=NO_COLOR` also fails (`rc=1`, same `NotCapable`) because `Deno.env.toObject()` requires full env access — unscoped `--allow-env` is the least privilege compatible with the inherit-then-delete design. A from-scratch child env (allowlisting `PATH`/`HOME`/`DENO_DIR`) would be narrower but silently drops proxy/token/DENO_DIR context and re-introduces environment-dependence of a subtler kind; the chosen trade is right for a dev-tooling task. |
| 6 | Scope | **CONFIRMED** | `git diff --name-status b66e52cbc 4dec2407c` (true merge-base): exactly 4 product files — generator, test, `deno.json`, regenerated corpus. Exit-checked unchanged: `deno.lock` (`rc=0`), `packages/sdk` (`rc=0`), `.github` (`rc=0`), `packages/ai` + `.llm/tools/agentic` (`rc=0`). No CI/merge-gate wiring added. The `deno.json` hunk changes only the two corpus task lines (each gaining `--allow-env`). |

## Open question handed to this cycle: is generator-level invariance the right altitude?

**Yes — judged correct, with one hardening recommendation.** The corpus's purpose is to mirror the
exact rendered public signatures of the workspace packages for MCP discovery; removing rendered
signatures would gut the artifact (the signatures are the payload). The contamination is a property
of the *producer* (`deno doc`'s `repr` field under colour), not of the data model, and `repr` is
unavoidable for template-literal types where `deno doc` emits no structured form — so sanitizing or
omitting repr would lose real signature content while leaving the producer untrusted. Canonicalizing
the producer's environment at the spawn boundary is total, self-documenting, and keeps the data
model clean. Recorded residual risk: the property is currently enforced by the regression test (a
different file) and by nothing in CI (see F-7); a generator-side escape-free assertion (scan the
serialized payload for `` before writing) would make the invariant self-enforcing at the
point of production. Recommendation only; not a blocker for this slice.

## Findings by severity

| ID | Severity | Finding | Disposition |
| --- | --- | --- | --- |
| F-1 | info | Root cause is broader than the commit message states: `deno doc --json` colourises `repr` **by default** on deno 2.9.5 (bare env output is byte-identical to `FORCE_COLOR=1` output), so the defect fired in any environment without `NO_COLOR=1`, including plain CI — not only under explicit colour-forcing callers. | Recorded. The fix (always set `NO_COLOR=1`, delete forcers) covers all measured cases, including the default. |
| F-2 | info | `CLICOLOR_FORCE` deletion is defensive, not load-bearing, on 2.9.5: `NO_COLOR=1 CLICOLOR_FORCE=1` yields 0 escapes, so `CLICOLOR_FORCE` does not override `NO_COLOR` here. `FORCE_COLOR` deletion **is** load-bearing (`FORCE_COLOR=0` overrides `NO_COLOR`, verified). | No action. Deleting both is cheap hardening against deno changing override semantics; the doc comment's precedence claim is accurate for `FORCE_COLOR` and does not over-claim for `CLICOLOR_FORCE`. |
| F-3 | minor | Regression coverage is `deno doc`-only. The `deno fmt` child also receives the guard, and `deno fmt --ext ts -` under `FORCE_COLOR=1 CLICOLOR_FORCE=1` emitted 0 escapes on stdout and stderr (verified) — the guard there is defensive belt-and-braces. A hypothetical future `deno fmt` colour regression would not be caught by this test. | No current vector exists (fmt stdout is plain formatted code). Recorded as a coverage boundary; the generator-level assertion recommended above would cover both children if ever needed. |
| F-4 | minor, pre-existing | `check:mcp-export-corpus` still has no CI wiring (`.github` unchanged, `rc=0` vs base) — the gap that let the contaminated corpus ship green. | Out of scope for this slice by the brief; carried forward from cycle-1 F-2. Recommend a follow-up issue. |
| F-5 | info | One unreproduced observation: the very first bare-env `deno doc` run, captured with combined streams, carried 454 extra bytes with 43 raw ESC bytes (961,096 vs 960,642); re-runs reproduce 0 raw ESC, and stream-separated runs show stderr empty. It is disclosed for capture-discipline completeness; it cannot affect the corpus because the generator pipes the child's stdout separately and discards stderr. | No action; the generation matrix (including the bare case) produced identical blobs with `rc=0`. |
| F-6 | info | Process: cycle-1's `impl-eval.md` is preserved byte-identical in the run directory and at the remote tip; this session adds only `impl-eval-cycle-2.md`. PR #1862 is OPEN and **non-draft**; its head (`429f1a0a9`) is a merge of the evaluated head with current `main` that leaves all four fix files and the corpus blob unchanged. | Recorded, not acted on. The non-draft transition and merge were made outside this session; this cycle's verdict is unaffected (evidence re-anchored to the tip where relevant). |
| F-7 | info | Scratch disclosure: experiments ran in throwaway detached worktrees `/tmp/nseval-1862-c2/{h,w2}` (both clean at close; no cache or lock touched); the decode/dump helpers live in `/tmp/nseval-1862-c2/decode/`. `rtk` is not installed on this host, so git inspection ran unprefixed. | No action. |

## Verdict basis

Every brief item was established with real captured exits and independent measurement: the corpus is
now **invariant** across the four caller colour environments (identical blob, identical provenance,
`rc=0` each), the committed payload is **escape-free and self-consistent** with its pinned SHA, the
fix **deletes** rather than overrides the forcers (with `FORCE_COLOR=0` behaviour proven directly),
the regression **fails** for both the removed guard and the tempting wrong shape, the permission
grant is **required** (proven by `NotCapable` without it) and minimal for the chosen design, and the
product scope is exactly the four authorized files with `deno.lock`, `packages/sdk`, and `.github`
byte-unchanged. The one open question was judged in favour of the implemented altitude, with a
recorded hardening recommendation. No doctrine violation, no new debt, no inherited conclusions from
the voided cycle.

VERDICT: PASS
