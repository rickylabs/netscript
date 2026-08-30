# PLAN-EVAL — fix-claude-hook-log-cwd--1774

- Plan evaluator session: native Claude / Fable 5 · medium, separate session, 2026-08-30 (evaluator
  worktree `worktrees/007-eval-1774-plan`, detached; generator was Codex GPT-5.6 Sol medium per
  `supervisor.md`)
- Run: `fix-claude-hook-log-cwd--1774` — PR #1775, cycle 1
- Evaluated head: `261029431e1fd32d3f94cd9faa219738d7d9761e` (local == remote branch, verified with
  `git ls-remote`); base `main` `3e5cbabfcd0a8c1aea5383fa7e1c4f111386dc3c` (== remote `main`)
- Surface / archetype: `.claude/settings.json` + `.llm/tools/agentic/claude/**` repository tooling;
  archetype N/A (agreed — not a `packages/`/`plugins/` publish unit)
- Scope overlays: none

## Checklist results

| Plan-Gate item                          | Result   | Evidence / location                                                                                                                                                                                                                                                                                                        |
| --------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS     | `research.md` re-baselined at `3e5cbabf`; RED independently reproduced by this evaluator in its own worktree: nested cwd exit 1 `Module not found`, root exit 0 (both with the exact checked-in command). Findings 1, 2, 5, 6, 8 spot-checked against the tree — all hold.                                                 |
| Decisions locked                        | PASS     | `plan.md` D1–D10 with rationale. D1/D2 premise verified against the official hooks reference (see Attack narrative §1). D5 grants verified to work on a fresh project with no `.llm/tmp` (§7).                                                                                                                             |
| Open-decision sweep                     | **FAIL** | Two decisions the plan does not flag would force rework under D7 (byte-frozen RED fixture): (a) `${CLAUDE_PROJECT_DIR}` semantics after `EnterWorktree` — see §1; (b) the sibling-decoy RED expectation/placement — see §2. Per `gates/plan-gate.md`, an evaluator-found rework-forcing open decision is an unchecked box. |
| Commit slices (< 30, gate + files each) | PASS     | S0–S5 enumerated, ordered, each with proof, gate, files. S3 RED is its own commit before S4. S3/S4 file lists exclude `agentic-lib.ts`, launcher tests, and `.github/workflows/**`.                                                                                                                                        |
| Risk register                           | PASS     | Present with mitigations. Missing rows are listed as required fixes 2–4 below, none of which invalidates the register as a whole.                                                                                                                                                                                          |
| Gate set selected                       | PASS     | Fitness/validation tables select `agentic:check-claude` (the `CLAUDE.md` mandatory gate) as required, focused + launcher tests, scoped check/lint/fmt, root `deno task test`, raw git/lock hygiene; expensive leased gates correctly `N/A`. `run-deno-fmt.ts --file` flag confirmed to exist.                              |
| Deferred scope explicit                 | PASS     | `wslHome()`, wrapper/framework, CI wiring, schema/retention. Deferral of `wslHome()` judged correct (§6) but needs a tracking pointer (fix 4).                                                                                                                                                                             |
| jsr-audit surface scan (pkg/plugin)     | N/A      | No published package/plugin surface. Agreed.                                                                                                                                                                                                                                                                               |

## Attack narrative (brief items 1–8)

### 1. D1 premise — `${CLAUDE_PROJECT_DIR}` (verified, with one documented caveat the plan omits)

Checked against the official hooks reference (`code.claude.com/docs/en/hooks`) and the worktrees
page, installed CLI `2.1.251`:

- **Exec form exists.** A command hook with an `args` array is spawned directly, no shell; path
  placeholders are substituted into `command` and into **each `args` element** as plain strings. So
  `--allow-write=${CLAUDE_PROJECT_DIR}/.llm/tmp/claude/hooks` mid-string substitution is in
  contract. D2 holds.
- **Exported, not just substituted.** Both forms export `CLAUDE_PROJECT_DIR` on the spawned process,
  so D3's `Deno.env.get('CLAUDE_PROJECT_DIR')` is in contract. Applies to every hook event;
  `PreToolUse` and `Stop` are both listed with no per-event exception. D1 holds for the
  false-positive defect this issue describes.
- **Absent variable.** Outside Claude the env is unset and D3 falls back to `Deno.cwd()`. Verified:
  direct run with the env absent from a project root writes to `<cwd>/.llm/tmp/...`, exit 0. Inside
  a Claude hook the variable is always exported (2.1.251 documents it), so the fallback cannot
  reintroduce the nested-cwd defect in a Claude hook; it only re-creates the old behaviour for a
  hand-run `deno task agentic:claude-hook-log` from a nested cwd, which is not a hook.
- **The caveat the plan omits — this is the blocking finding.** The reference states verbatim: _"If
  Claude enters a worktree during the session, Claude Code keeps `${CLAUDE_PROJECT_DIR}` where it
  was … it still points at the project root where the session started, so a hook command such as
  `${CLAUDE_PROJECT_DIR}/.claude/hooks/check-style.sh` still runs the script in the main checkout.
  `cwd` follows Claude: the `cwd` field in the hook's input JSON is the worktree root, and it moves
  again when Claude runs `cd`."_ D1's rationale "follows each worktree" is therefore only true for
  sessions **launched** inside the worktree (this evaluator session, the Codex leaf). For a session
  launched in the main checkout that then uses `EnterWorktree` — the mechanism this repository's
  Claude background jobs are instructed to use, with worktrees under `.claude/worktrees/` — the
  repaired hook executes the **main checkout's** `claude-hook-log.ts` and writes into the **main
  checkout's** `.llm/tmp`. That does not reproduce the `Module not
  found` false positive (so
  #1774's headline symptom is still fixed), but it contradicts the plan's Goal ("this active
  worktree's logger … this worktree's hook log"), D8's premise ("the active project root remains
  this worktree"), and acceptance gate 3 as literally worded ("not a global or sibling checkout" —
  the main checkout is a sibling checkout from a worktree's point of view). The plan must lock this
  contract before S3 because D7 freezes the fixture at RED; discovering it at IMPL-EVAL forces a
  second RED→GREEN cycle.
- Empirical env capture of a live hook process via `/proc` polling was attempted in this session and
  was inconclusive (hook lifetime shorter than a fork-per-pid scan); the documentary evidence above
  is the verdict source, and it is the same source `research.md` finding 3 cites.

### 2. D8 sibling decoy — attackable as specified

- **Can the decoy pass while the defect persists?** As written, yes, vacuously. Case 3 puts cwd at
  "a nested path inside a temporary sibling-shaped project containing a decoy logger". A relative
  `.llm/tools/agentic/claude/claude-hook-log.ts` resolved from a _nested_ decoy path yields
  `Module not found`, never the decoy marker — the marker is unreachable in RED, so "marker absent"
  in GREEN discriminates nothing. The plan states a RED expectation only for case 2. For the decoy
  to be evidence, RED must **positively** show the current relative command reaching the decoy from
  the chosen cwd (marker present / distinctive exit), and GREEN must show marker absent +
  active-root record present. That requires the decoy logger to sit exactly where the relative path
  resolves from the test cwd (cwd = decoy root, or decoy planted at
  `<cwd>/.llm/tools/agentic/claude/`). The plan must specify placement and the case-3 RED
  expectation.
- **Direction.** The decoy models "cwd in a foreign checkout, `CLAUDE_PROJECT_DIR` = this worktree".
  The documented real-world divergence (§1) is the inverse: `CLAUDE_PROJECT_DIR` = launch checkout,
  cwd = this worktree. The fixture as designed cannot observe the case that actually occurs; the
  plan should say so and record the fixture's own placeholder substitution as a model of Claude, not
  Claude itself.
- **Cleanup.** "Temporary sibling-shaped" is not pinned to `Deno.makeTempDir` + `try/finally`. If it
  were created as a real sibling under `worktrees/` and a mid-fixture failure left it behind, a
  later RED run from that cwd would hit the stale decoy. Pin it to a temp dir with finally-cleanup.

### 3. RED obligation — genuine

S3 commits and pushes the fixture failing, before any config/script change; S4 is prohibited from
editing it; validation row 1 names the expected failure. This is a real committed RED, not a
retrospective claim. Reproduced independently (see checklist row 1).

### 4. Both events — covered

The fixture enumerates handlers under the exact constants `PreToolUse` and `Stop` from live settings
and runs each case per event. Research recorded raw RED for each event separately.

### 5. Host-neutrality — feasible, but the assertion set is not enumerated

`.llm/tools/agentic/README.md`, `.claude/settings.json`, `deno.json`, `claude-hook-log.ts`,
`validate-claude-surface.ts` contain neither `/home/agent` nor `/home/codex` today (grep verified),
so an assertion over the owned set will pass. But the plan says "owned product/config/doc files"
without listing them; `.llm/tools/agentic/**` elsewhere legitimately contains `/home/codex`
(`ownership.ts`, `wsl-foundation.ts`, `codex-watch.ts`), so an unenumerated scan is either
under-scoped or false-red. Enumerate the set (fix 3). `/home/codex` confirmed absent on this host.

### 6. D9 `wslHome()` deferral — correct

Hook resolution via `CLAUDE_PROJECT_DIR` has no dependency on `wslUser()`/`wslHome()`
(`agentic-lib.ts:231-243`); the two defects share only the word "path". Fixing `wslHome()` would
touch `agentic-lib_test.ts`'s historical-default test and launcher behaviour — different contract,
different reviewers. Deferring is right. Gap: the plan "names it" but records no tracking issue; an
unfiled known-broken default is how it gets lost (fix 4).

### 7. Permissions — "required" is stated and verified

The plan defines required precisely: env `CLAUDE_PROJECT_DIR,NETSCRIPT_RUN_ID,CLAUDE_SESSION_ID`,
write `${CLAUDE_PROJECT_DIR}/.llm/tmp/claude/hooks`, no read/net/run/sys/ffi. Evaluator probes (Deno
2.9.5): (C) fresh project with **no** `.llm/tmp` at all, D3-style output path, exact D5 grants →
exit 0, subtree created (recursive mkdir under a not-yet-existing `--allow-write` root is
permitted); (E) env absent → cwd fallback, exit 0; (F/G) misrooted write outside the grant with
piped stdin → immediate `NotCapable`, exit 1, **no interactive prompt hang** with or without
`--no-prompt`. `--no-prompt` is therefore optional hardening, not required. `deno.json:107` already
omits `--allow-read`; the validator's lock check (`validate-claude-surface.ts:85-93`) still uses
broad flags and a root-relative path — S4 correctly lists it for alignment.

### 8. Scope discipline and receipts

- `git diff --stat 3e5cbabf..26102943 -- . ':!.llm/runs'` is empty. Only run artifacts changed.
- Every cited SHA resolves: `23c3bdb0…`, `1eee4538…`, `a002fbf2…`, `26102943…`, `3e5cbabf…` are all
  commits in this history.
- No `.github/workflows/**` edit is planned; the `repo`-scope PAT boundary is not engaged.
- PR #1775: draft, base `main`, `Closes #1774`, milestone `0.0.7`, labels
  `type:fix area:tooling
  area:agentic status:plan-eval` (exactly one `status:`).
  Labels/milestone/draft state untouched by this evaluation.

## Open-decision sweep (evaluator-run)

1. **Project-root contract after `EnterWorktree`** — must resolve now (rework-forcing under D7).
   Recommended lock: the contract is _session launch root_ (`CLAUDE_PROJECT_DIR`);
   worktree-following semantics via the stdin `cwd` field are explicitly out of scope for #1774
   (would require a root-discovery helper the plan rejects under D4). Record the limitation in
   `plan.md` Non-Scope + `drift.md`, narrow gate 3's evidence wording to "the checkout named by
   `CLAUDE_PROJECT_DIR`", and correct D1's rationale.
2. **Decoy placement and case-3 RED expectation** — must resolve now (same reason).

Deferrable, agreed: `wslHome()`, CI wiring, expensive gates.

## Verdict

`FAIL_PLAN`

### Required fixes

1. **Lock the `CLAUDE_PROJECT_DIR` worktree semantics** (D1/Goal/D8/gate 3). State that
   `${CLAUDE_PROJECT_DIR}` is the session launch root and does **not** follow `EnterWorktree`;
   decide and record that #1774 fixes resolution against the launch root only; correct D1's
   rationale; reword the gate-3 acceptance evidence so it claims what the fixture can prove; add a
   drift entry and a Non-Scope line for worktree-following output.
2. **Pin the decoy contract** (D8, Fixture Contract case 3): where the decoy logger lives relative
   to the test cwd so the current relative command actually reaches it; the case-3 **RED**
   expectation (marker present / distinctive exit) alongside the GREEN expectation (marker absent,
   active-root record present); creation via `Deno.makeTempDir` with `try/finally` cleanup, never
   under `worktrees/`. Add a risk-register row that the fixture's placeholder substitution models
   Claude.
3. **Enumerate the host-path assertion file set** (gate 5): list the exact owned files scanned for
   `/home/agent` and `/home/codex` so the assertion is neither under-scoped nor false-red against
   the pre-existing `/home/codex` text elsewhere in `.llm/tools/agentic/**`.
4. **Record where the `wslHome()` defect is tracked** (D9): an issue number, or an explicit
   instruction for the supervisor to file one before S3.

Everything else in the plan stands; cycle 2 should be a plan-text amendment, not a redesign.

## Notes

- `NOT_RUN` (coordinator-owned lease, correctly excluded by the plan): Aspire, Docker, browser,
  `e2e:cli`, `scaffold.runtime`. Not needed to judge this plan.
- Optional, not required: add `--no-prompt` to the exec-form args as belt-and-braces against any
  future TTY-attached hook invocation.
- Residual, not blocking: `CLAUDE_PROJECT_DIR` is "the project root where the session started"; a
  session launched from a subdirectory of a worktree is outside #1774's scenario and this plan.
- Evaluator boundary respected: this session wrote only this file; no source, test, plan, research,
  PR body, label, milestone, draft state, or issue change.
