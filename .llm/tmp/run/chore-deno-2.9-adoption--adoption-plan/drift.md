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

No `significant` or `architectural` drift. Scope matches the PASSed plan (C0–C4).
