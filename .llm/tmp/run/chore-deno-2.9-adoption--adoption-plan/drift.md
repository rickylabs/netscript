# Drift — chore/deno-2.9-adoption

Append-only. Severity: `minor` | `significant` | `architectural`.

## D-1 (minor) — C0 commit bundled the run-parallel-tasks.ts deletion

The C0 commit (eb4229cb) was made without an explicit pathspec and so absorbed the already-staged
deletion of `.llm/tools/run-parallel-tasks.ts`, which logically belongs to C1. The C0 message names
only the toolchain-pin files. No history rewrite was performed (push-safety). No scope change — the
deletion was always in-plan for C1. Recorded for commit/worklog honesty; see `commits.md`.

## D-2 (minor) — F-3 resolved by filing arch-debt rather than rephrasing D5

PLAN-EVAL F-3 flagged the plan's `aspire/package.json` "pre-existing arch-debt" citation as
unverifiable (no matching `arch-debt.md` entry). Chose option (a): filed the entry
(`scaffold-aspire-npm-island-no-lock`) rather than option (b) rephrasing D5. The gap is real and
grounded (`render-ts-apphost.ts:51-77` + e2e scaffold output), so a verifiable registry entry is the
more accurate resolution. No scope change to C0–C4.

## D-3 (minor) — local gate run used a side-by-side 2.9.0 binary

The repo's global Deno is still 2.8.3 (Win + WSL); the slice's local gate evidence was produced with
a side-by-side `deno29\deno.exe` (v2.9.0) so the 2.9 behavior could be exercised before CI. The
authoritative 2.9.0 verdict is the GitHub Actions CI run after push (which uses the pinned 2.9.0 via
`setup-deno`). No drift in behavior was observed between the side-by-side binary and the documented
2.9 semantics.

## D-4 (minor) — C3 missed AGENTS.md:13 (caught by IMPL-EVAL)

The C3 docs-refresh slice (3d18cd13) updated the `netscript-deno-toolchain` SKILL + regenerated
`.claude` mirror + `AGENTS.md`-adjacent docs, but the C3 plan also listed `AGENTS.md:13`
("native Deno 2.8 toolchain") which was not edited. IMPL-EVAL (run 28191642204) returned FAIL_FIX
on this single cosmetic line — every functional gate, `deno task ci`, `publish:dry-run`, the C2
cache SKIP path, and CI on `f4bded73` were all green; `deno.lock` unchanged (D6 not triggered).
Resolved by a one-line follow-up edit (Deno 2.8 → 2.9). No scope change to C0–C4. Re-dispatching a
minimal IMPL-EVAL re-confirmation (generator does not self-certify).

## D-5 (minor) — C0 toolchain pin extended to e2e-cli-prod.yml (post-#127 merge)

After PR #127 merged to main it added a NEW workflow `.github/workflows/e2e-cli-prod.yml` pinned to
`deno-version: '2.8.3'` — a file that did not exist when C0 was authored, so C0 never covered it.
Merged main into the branch (forward merge, no rebase) and pinned the new workflow to `'2.9.0'` so
main is not left with a split toolchain after #128 lands. Repo-wide grep confirms zero remaining
`2.8.3` under `.github`. In-scope extension of the C0 toolchain-pin slice (supervisor lane: CI config
only). No `packages/` source touched by this slice's own changes.

No `significant` or `architectural` drift. Scope matches the PASSed plan (C0–C4).
