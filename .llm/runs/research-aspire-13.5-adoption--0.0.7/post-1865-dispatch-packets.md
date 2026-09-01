# Post-#1865 dispatch packets — exact, ready to fire

Everything below is **staged and verified at `origin/main 102ef8a10`**, where all seven Aspire slices
sit at `behind=0`. The only missing input is **#1865's exact merge SHA**. Nothing here needs a decision;
it needs a SHA.

**Do not fire any of this before that SHA is on `main`.** Aspire e2e runs triggered earlier occupy the
global Postgres/SQLite concurrency lanes that #1865's own combined proof needs, and four such runs were
already cancelled for that reason.

## 0. Consume — the first three commands

```
git fetch origin main
git rev-parse origin/main                     # must contain #1865's merge SHA
git log --oneline <PREV_MAIN>..origin/main    # confirm the merge is present, not just a newer main
```

Then, **before rebasing anything**, measure overlap against S8's evaluated set — this is what protects
the carried IMPL-EVAL PASS:

```
comm -12 <(git diff --name-only <PREV_MAIN> origin/main | sort) \
         <(git diff --name-only <PREV_MAIN> <S8_HEAD>   | sort)
```

**Zero overlap → the 72/72 carry survives the rebase.** Non-zero → the touched files need a bounded
delta evaluation before the PASS may be carried.

## 1. Convergence order — S8 alone first

S9/S10 are based on S8's branch and S11/S13 on S10's, so any other order either duplicates S8's commits
onto `main` or strands the stack.

| # | Slice | Worktree | Command |
| - | ----- | -------- | ------- |
| 1 | **S8** | `007-s8-recon` | `git rebase origin/main` |
| 2 | S9 | `007-aspire-s9` | `git rebase --onto <S8_NEW> <S8_PREV>` |
| 3 | S10 | `007-aspire-s10` | `git rebase --onto <S8_NEW> <S8_PREV>` |
| 4 | S11 | `007-aspire-s11` | `git rebase --onto <S10_NEW> <S10_PREV>` |
| 5 | S13 | `007-aspire-s13` | `git rebase --onto <S10_NEW> <S10_PREV>` |
| — | S7 | `007-aspire-s7` | `git rebase origin/main` (independent) |
| — | #1747 | `007-1747-conv` | `git rebase origin/main` (independent) |

Current heads to substitute as `<*_PREV>`: S8 `d0d274c59`, S9 `0f2e81516`, S10 `854543df2`,
S11 `433ef7469`, S13 `3be6c7753`, S7 `4c40cff2c`, #1747 `c741574bb`.

**Conflict rules — pre-ruled, do not improvise:**
- `*.generated.ts` → take upstream (`git checkout --ours`), regenerate **once** at the end via
  `deno task gen:assets-barrel`.
- D-101 listener path (S10) → canonical `./verify-listener-readiness.ts` wins.
- #1840 `parseArgs` (S7) → keep **both** sides: S7's `forcePersistent` field **and** main's
  `args = normalizeTaskArguments(args)`.
- Formatter-equivalent regex (S13, `route-templates_test.ts`) → take the shipped form.
- **Any other non-generated conflict → abort and report.**

## 2. Carry re-proof — use the corrected comparison

`git rev-parse <sha>:<missing-path>` **echoes the literal `<sha>:<path>` to stdout**, so a deleted file
compares unequal and reads as changed forever. Existence must be tested separately:

```bash
for p in $(git diff --name-only "$BASE" "$OLD"); do
  ea=$(git cat-file -e "$OLD:$p" 2>/dev/null && echo y || echo n)
  eb=$(git cat-file -e "$NEW:$p" 2>/dev/null && echo y || echo n)
  if [ "$ea" = n ] && [ "$eb" = n ]; then continue            # absent on both = identical
  elif [ "$(git rev-parse "$OLD:$p")" = "$(git rev-parse "$NEW:$p")" ]; then continue
  else echo "Δ $p"; fi
done
```

Expected at the last convergence: S8 **72/72**, S9 **120/120**, S10 **39/39**, S11 **24/24**,
S13 **64/64**, S7 **112/112**, #1747 **19/19**.

## 3. Static gates per slice — run before any push

| Slice | Gates |
| ----- | ----- |
| S8 | A6 grep (`PROCESS_COMMANDS_FLAG` → 0 in `packages/cli/src`, `maybeWithProcessCommand` → 0 in `packages/cli`); A3 `.excludeFromMcp()` exact-count + placement; `check:assets-barrel`; scoped `deno check` |
| S9 | `check:assets-barrel`; repo-wide `deno check`; `task-separator_test.ts`; `git grep '13\.4\.6'` over skills/`.agents/skills`/`.claude/skills`/CLI assets → **0** |
| S10 | scoped `deno check` |
| S11 | root-scoped `doc:lint` `--root packages/cli` (0) and `--root packages/aspire` (`totalErrors: 0`; process exit 1 is **pre-existing main debt**, byte-identical on `origin/main`) |
| S13 | surface-manifest re-run → no diff; `check:assets-barrel` (0); `agentic:sync-claude:check` (**fails on `origin/main` too** — pre-existing, not S13's) |
| S7 | `deno check` on `teardown.ts` + `leak-check.ts`; confirm `'--'` hand-skips = **0** |
| #1747 | scoped `deno check` |

## 4. Phase B — only after the convergence is green

Four receipts for #1720 (**A1, A2, A4, A5**); A3 and A6 are already satisfied statically. Plus
**#1719 A1/A2** (S7 — must be **re-taken**, its head has moved) and **#1747's** hosted
`scaffold.runtime` DoD box.

Run it per **§4a** of `phase-b-execution-manifest.md`: A5 stays on hosted CI; the AppHost is started
`setsid nohup … & disown` and verified `ppid=1` **before** probing; A1/A2/A4 are separate short
foreground calls; the AppHost is **stopped explicitly**; every step tees to a log.

Release proof: `aspire ps` `[]`, `docker ps -aq` 0, the known foreign volume **unchanged**, default
networks only, `agentic:leak-check` output pasted. **Never remove a foreign or unknown-owner
resource** — see #1855.

## 5. Merge packets — what each slice still needs

| Slice | Outstanding |
| ----- | ----------- |
| **S8** | Phase-B A1/A2/A4/A5; then `status:blocked` → `status:ready-merge`. IMPL-EVAL **PASS carried**; keep `impl-eval:skip`. |
| S9 | bounded delta eval over its product Δ; D-12 MCP smoke receipt + `receipts/aspire-13.5-mcp-smoke.json` (lease-produced) |
| S10 | bounded delta eval; dual-tier runtime receipts; **post-restack** head-refresh comment on #1372 |
| S11 | **nothing but S10** — carry proven 24/24, CI clean, DoD 0 unchecked, no lease needed; 8 close-gate boxes across **#1642 + #1723** |
| S13 | S10 **and S9** (boxes 1–2 need S9's skills corpus on main); coordinator close-gate work |
| S7 | #1719 A1/A2 re-taken under the lease |
| #1747 | its single hosted-runtime DoD box |

**#863 does not close with S8.** S8 delivers **gate 1 only**; gates 2 and 3 are #1880 and #1881, and
#863 closes by hand when all three are evidenced — never by a closing keyword on a PR delivering one.
