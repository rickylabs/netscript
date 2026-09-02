# IMPL-EVAL (delta): #1751 / PR #1802 — sender-lease recovery at `0c938c3e6`

| Field | Value |
| --- | --- |
| Run ID | `fix-agentic-sender-lease-recovery--1751` |
| Evaluated head | `0c938c3e605d6cfb7a28396486701a173e0da3a4` (verified via `git rev-parse HEAD`) |
| Head attested by `impl-eval.md` | `5ac0275c79f62f0e0201b6fa159225bde8e693ec` — `PASS` there; **not an exact-head attestation for this delta** |
| Delta commits since `5ac0275c7` | `5aea6b287` (prior eval sign-off, run artifact only) · `7d20e852f` (merge of `main`, real conflict in `codex-resume.ts`) · `3a01add4b` (unsafe-cast repair) · `0c938c3e6` (merge of `main` `82a2527e2`) |
| Scope | the delta only. The substantive review of the flake repair, the profile-provenance work and the `blocked`/`repair-required` vocabulary is already done in `impl-eval.md` and is not repeated |
| Evaluator (this session) | `z-ai/glm-5.3-flash` (OpenRouter IMPL preset) — separate opposite-family session; read-only over source; only this artifact written |
| Evidence standard | every exit below is a real captured `out=$(cmd 2>&1); rc=$?`; no pipeline used for any verdict |
| Scratch | `.llm/tmp/eval-1802-delta/` (git-ignored, uncommitted): pre-repair shadow adapter, probe script, observation files |

All supervisor claims were treated as claims to falsify and re-derived from captured evidence; none
was inherited.

## V1 — `3a01add4b` unsafe-cast repair is behaviour-preserving (highest-risk item)

The repair replaces two unsafe casts in `runtime/adapters/local-sender-ownership-adapter.ts`
(`!SENDER_OWNERSHIP_STATES.includes(entry.state as never)` and
`return entry as unknown as SenderOwnershipRecord`) with `isMember<T>` and the type predicate
`isSenderOwnershipRecord` (blob `2654d3fb6` → `e64bd212f`). Verified statically and differentially:

- **Static equivalence.** Every old disjunct is the exact negation of the corresponding new
  conjunct (schemaVersion, worktree string + `/` prefix, ownerPid number/safe-integer/`> 0`,
  leaseToken string + truthy, state membership, acquiredAt/updatedAt strings, and
  undefined-or-typed `sessionId`/`profileHome`). The new `isMember` (`===`) versus the old
  `Array.includes` (SameValueZero) can differ only for `NaN` membership in the array; the state
  union is the string tuple `['launching', 'active', 'idle']`, so no input discriminates them. The
  three throw sites keep identical messages and identical order: `sender record invalid` (non-object
  / array), `sender record contains unknown field`, `sender record invalid`.
- **Differential probe, 47 cases × both modules.** The pre-repair module was extracted from the
  repair's parent `7d20e852f` (`git show` → blob `2654d3fb6`, matching the diff pre-image) with its
  `'../sender-ownership.ts'` import rewritten to the head file; `sender-ownership.ts` is
  byte-identical across the repair (`git diff --stat 7d20e852f HEAD -- …` empty, rc=0), so both
  versions validate against identical constants. `deno run --allow-read probe.ts <module>` against
  each version: both rc=0, and the normalized observation documents diff **rc=0** — **47/47
  identical accept/reject/message/key observations**:
  - 11 accepted / 36 rejected; rejections carry exactly 2× `sender record contains unknown field`
    (unknown field, and a `__proto__` own key from `JSON.parse`) and 34× `sender record invalid`.
  - **Previously-valid records still accepted**: the minimal record and a full record with
    `sessionId` + `profileHome` are accepted by both.
  - **Optional-field semantics unchanged (the highest-risk sub-claim).** The accepted minimal
    record has `Object.keys` = exactly the 7 base fields, `'sessionId' in rec === false`,
    `'profileHome' in rec === false`, its JSON serialization contains neither key, and the JSON
    round-trip (stringify → parse → re-parse) keeps exactly the 7 keys with
    `reParseSessionPresent: false` and `reParseHomePresent: false` — **absent stays absent, never
    present-with-`undefined`**.
  - Explicit `sessionId: undefined` / `profileHome: undefined` remain *accepted* by both versions
    (a pre-existing tolerance; `JSON.stringify` drops the keys) — identical behaviour, unchanged by
    the repair.
- **File stability since the repair**: `git diff 3a01add4b HEAD -- <adapter>` empty, rc=0 — the
  merge `0c938c3e6` did not touch the file.

The repair is behaviour-preserving; the two casts were cosmetic, and the type predicate now carries
the same checks type-safely.

## V2 — `7d20e852f` conflict resolution preserves both intents

Bidirectional parent diffs of the merge for `codex-resume.ts` (both rc=0):

- vs main-side parent `1b7effaf9`: **exactly** the leaf's exit-mapping change — the
  `codex-resume-result.ts` import plus `Deno.exit(codexResumeExitCode(classifyCodexResumeOutcome(r)))`.
  Nothing else.
- vs leaf-side parent `5aea6b287`: **exactly** #1750's normalizer wiring — the `task-arguments`
  import plus `args = normalizeTaskArguments(args)` as the first line of `parseArgs`. Nothing else.
- The normalizer itself is unchanged since #1750 authored it (`git diff 3b6386e14 HEAD --
  .llm/tools/agentic/lib/task-arguments.ts` empty, rc=0). The `+10` lines seen when diffing the
  branch point are #1750's file creation arriving through the merge — main's content, not a leaf edit.

Direct contract probes at this head (real captured exits; the host has no `codex` Linux user, so
success-path probes pass `--user node` — an identity adjustment, not a parse change):

| Probe | Exit | Observation |
| --- | --- | --- |
| Plain form, no separator (control) | 0 | dry-run JSON `ok:true` |
| Documented task form `deno task agentic:codex-resume -- --help` | 0 | help printed |
| Documented task form with full args | 0 | dry-run JSON `ok:true` |
| Exactly one leading `--`, script form (`--` is the first script arg) | 0 | dry-run JSON `ok:true` — separator accepted and discarded |
| Unknown later argument (`… --bogus-flag`) | 2 | `Unknown argument: --bogus-flag` |
| Non-leading `--` (`--thread-id <uuid> --`) | 2 | `Unknown argument: --` |
| `--` after a leading one (`-- --thread-id <uuid> -- x …`) | 2 | `Unknown argument: --` |

The #1750 normalizer contract holds in both directions and the leaf's D8 exit-mapping line is
intact: both intents survived the resolution.

## V3 — protected ceilings

`git hash-object` at this head (rc=0) — all four exact full-blob matches to the frozen baselines:

| File | Observed blob | Status |
| --- | --- | --- |
| `runtime/sender-lease-repair_test.ts` | `7be38302ac6ed20f29571213d18172283e1aded5` | byte-identical ✓ |
| `codex/codex-thread-read_test.ts` | `d3ca0b51fcb87aeee81e4202e5f527ed569fba12` | byte-identical ✓ |
| `runtime/cli/agentic-runtime_test.ts` | `7113e271dfa15e9f2dc53b6922c4d5055e086430` | byte-identical ✓ |
| `codex/codex-resume_test.ts` | `546b5f0185876fd51c9b5ee28b57a19fe37562b7` | byte-identical ✓ |

The two authorized exceptions were also re-checked and are unchanged from their recorded amended
baselines: `sender-ownership_test.ts` = `978cd23d073035e1d578193a299806a0fe9b77fb` ✓ and
`local-sender-lease-repair-adapter_test.ts` = `e12c023b90b8debc66d2f6ad720f3a9b9cdd9f14` ✓. The
delta touched neither.

## V4 — scope and hygiene at this head

- **`deno.lock`**: leaf-authored change **none**. HEAD blob `ac2ee042566bc6b03502c40961c10d624416b061`
  is byte-identical to main tip `82a2527e2`'s blob; the only commit touching `deno.lock` in
  `5ac0275c7..HEAD` is main's `233828f0f` (deps #1832) arriving through the merge. The prior eval
  head and the branch point both hold the recorded `a1522e6e…`. See O-1 for the wording nuance.
- **`deno.json`**: leaf contributed nothing (`git diff 82a2527e2 HEAD -- deno.json` empty, rc=0).
- **`packages/**` / `plugins/**`**: `git diff --name-only 82a2527e2 HEAD -- packages plugins`
  empty, rc=0 — the leaf contributes zero package/plugin content. The 19 package/plugin files in
  the full delta range are main's own commits (#1832/#1861/#1864/#1862) brought in by the two
  merges. First merge vs its main parent for those roots: empty, rc=0.
- **`quality:scan` over the changed set**: run in the scanner's `--changed-file` mode over the
  leaf's complete changed source list (23 source/test files + README) → **rc=0, `ok:true`,
  `findings: []`**. A repository-mode scan over the whole `.llm/tools/agentic` root returns rc=1
  with 2 findings, both pre-existing and outside the leaf's files — see O-2.

## V5 — suites re-derived at this head (structured wrapper, real captured exits)

| Suite | Exit | Result |
| --- | ---: | --- |
| runtime — `deno test --allow-all .llm/tools/agentic/runtime` (via `.llm/tools/run-deno-test.ts`) | 0 | **210 passed / 0 failed / 0 ignored** (2572 ms) |
| codex — `deno test --allow-all .llm/tools/agentic/codex` (same wrapper) | 0 | **43 passed / 0 failed / 0 ignored** (1395 ms) |
| **Total** | | **253 passed / 0 failed** — independently reproduces the supervisor's 253/0 claim |

## Findings by severity (all non-blocking)

- **O-1 (minor, claim precision)** The claim "`deno.lock` byte-unchanged" is false in the literal
  sense at this head: the blob advanced `a1522e6e…` → `ac2ee042…`. The advance is exactly main's own
  #1832 dependency lock change arriving through the required merge `7d20e852f`; HEAD's lock is
  byte-identical to main's tip; and no leaf-authored commit touches the lock. **Disposition:**
  accepted — the invariant that matters (the leaf contributes no lock content) holds; the
  supervisor's wording should be read as "no leaf-authored lock change". Not merge-blocking.
- **O-2 (minor, upstream drift)** `quality:scan` in repository mode over the whole
  `.llm/tools/agentic` root fails (rc=1) with 2 pre-existing `unsafe-cast` findings:
  `github/publication-body.ts:60` and `runtime/adapters/provider-adapter.ts:59`. Both files are
  absent from the leaf's contribution list (byte-identical to main's tip), and both cast lines are
  present verbatim at the prior eval head `5ac0275c7` — so the delta did not introduce them.
  **Disposition:** not a delta failure. The changed-set scan (the scanner's own `--changed-file`
  mode over the leaf's files) is clean, and the leaf's repair commit removed exactly the two casts
  in the one file it touched. Recorded as upstream agentic-tree drift for supervisor disposition,
  same class as prior eval O-5.
- **O-3 (process observation)** Evaluator identity observed this session is the OpenRouter GLM 5.3
  Flash IMPL preset — the same sanctioned opposite-family route as the prior eval's O-4 — a separate
  session from the generator with a verified agentic turn; gates were run for real, and no gate was
  skipped. **Disposition:** recorded requested-vs-observed per `evaluator/protocol.md`; supervisor
  to note the lane in its close-out.
- **O-4 (note)** Evaluation scratch (pre-repair shadow module, probe, observation JSONs) lives under
  git-ignored `.llm/tmp/eval-1802-delta/` and is intentionally uncommitted. No run artifact was
  modified or removed; this file is the only write, and the working tree is otherwise clean.

## Close-out notes

- PR #1802 remains OPEN/draft at `0c938c3e6`; labels, milestones, readiness transitions, the
  close-gate and any merge decision belong to the supervisor. All prior run artifacts
  (`impl-eval.md`, `plan-eval.md`, `plan-eval-cycle-2.md`, `worklog.md`, `drift.md`,
  `context-pack.md`, `supervisor.md`, `research.md`, `plan.md`, `codex-thread-ids.md`) are preserved
  untouched.
- Process: PLAN-EVAL cycle-2 `PASS`, the design checkpoint, and the per-slice RED/GREEN evidence
  stand from the existing artifacts; this delta was evaluated strictly within its brief, and every
  supervisor claim above was re-derived from captured exits rather than inherited.

VERDICT: PASS