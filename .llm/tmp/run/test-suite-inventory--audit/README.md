# Test-Suite Inventory — OpenHands Audit Brief

**Run id:** `test-suite-inventory--audit`
**Branch:** `chore/test-suite-green-up` (draft PR → `feat/package-quality`)
**Model:** `openrouter/minimax/minimax-m3` (MiniMax M3)
**Mode:** SCOPE-docs audit under Harness v2 — **inventory only, no test edits in this run.**

## Mission

Produce a complete, defensible inventory of **every** automated test in the NetScript
repository. The inventory is the authoritative input to a downstream **Codex test-fix
slice** that must make `deno task test` green — or delete obsolete failing tests with a
recorded rationale — **before any JSR publish (Phase P) may proceed.**

The hard bar this audit serves: **no JSR publish until all tests are green OR obsolete
failing tests are deleted with rationale.**

## Operating mode (Harness v2)

- **Use harness.** Follow `.agents/skills/netscript-harness/SKILL.md`. This is a
  `SCOPE-docs` audit; you may *run* tests read-only to determine status, but you do **not**
  modify, fix, or delete any test in this run. You only record verdicts.
- **Work incrementally by slices.** Pick one test-area slice, inventory it fully, then
  **write/grow `inventory.md` immediately** before moving on. Never defer writing to the
  end: your iteration budget is finite and the workflow commits whatever is on disk at
  cutoff. Write-early, grow-incrementally, so a budget-cut run still leaves usable output.
- Keep a **Slice progress** checklist at the top of `inventory.md` so a resumed run knows
  exactly what is already done and what remains.

## Skills to activate — state them explicitly

In your run summary, **list every skill you activate and why.** Expected candidates
(activate the ones that apply, name any others you find useful):

- `netscript-harness` — audit under the harness, artifacts, slice cadence.
- `netscript-doctrine` — `packages/` + `plugins/` test expectations, archetype gates.
- `deno-fresh` — `apps/frontend`, `apps/playground`, `fresh-ui` tests.
- `aspire` — apphost / `e2e:cli` / runtime tests.
- `jsr-audit` — publishability-gating tests.

## Discovery pass first

Before slicing, enumerate the real surface:

1. Every test file (`**/*_test.ts`, `**/*_test.tsx`, `**/*.test.ts`, xunit/`*Tests.cs`, etc.).
2. Every test task: scan `deno.json` for `test`, `test:*`, `e2e:*`, `check:*` tasks.
3. Map files → owning area (core, packages, plugins, services, apps, contracts,
   background, sagas/triggers/workers, dotnet, root e2e).

Record the discovered totals at the top of `inventory.md`, then proceed slice by slice.

## Suggested slices (adjust to the real surface)

- **S-A** `core/tests/**`
- **S-B** `packages/*/` (`**/*_test.ts`, `tests/`)
- **S-C** `plugins/*/`
- **S-D** `services/*/`
- **S-E** `apps/frontend`, `apps/playground`, `fresh-ui`
- **S-F** `contracts/`, `background/`, `sagas`/`triggers`/`workers`
- **S-G** `dotnet/` (.NET tests, if any)
- **S-H** root e2e: `e2e:cli`, `scaffold.runtime`, `scaffold.published.runtime`

## Per-test record (the core deliverable)

For each test file/suite, one row:

| Location (path) | Role (what it protects) | Quality (solid / thin / flaky / dead) | Status (pass / fail / ignored / skipped) | Verdict (keep / rewrite / refactor / relocate / delete / replace) | Rationale + evidence (command + result line) |

## Priority: the known failing set

`deno task test` was last reported **RED: 477 passed / 11 failed / 12 ignored**
(measured on `feat/package-quality-wave6-cli` @ `443d69f5`, reported by the Wave 6 Codex
generator as "outside CLI slice scope"). **Enumerate those 11 failures FIRST** — name +
file + failing assertion — and give each a verdict + rationale, classifying each as either:

- **stale / obsolete / superseded** → candidate `delete` (with rationale), or
- **doctrine-compliant and still valuable but broken** → `keep` + `rewrite`/`refactor` (the
  Codex slice will fix it).

This 11-failure focus table is the immediate driver of the Codex test-fix slice.

## Status determination rules

- Run the **smallest** command that proves pass/fail. Prefer `deno task test` for the
  global picture and targeted `deno test <path>` per slice. Use the narrowest valid
  `deno task check:<slice>` / test task where it exists.
- Targeted `deno` commands must pass `--unstable-kv`.
- Record the **exact command + the result line** as evidence for every status.
- **Do not fix anything.** Inventory only. The Codex slice executes the verdicts.

## Deliverables (write-early, grow incrementally)

- `inventory.md` (this run dir) — living inventory:
  - Slice-progress checklist (top),
  - discovered totals,
  - per-area tables,
  - the 11-failure focus table,
  - final roll-up: counts per verdict (keep / rewrite / refactor / relocate / delete / replace).
- Your run summary at `OPENHANDS_SUMMARY_PATH` before exit: Summary, Changes, Validation,
  Remaining risks, and the explicit **list of skills you activated**.

## Guardrails

- Do **not** post GitHub comments — the workflow owns GitHub comments.
- Preserve all existing files; no destructive git.
- Never delete lock files/caches or run `deno cache --reload`.
- Stay in scope: inventory + verdicts only; no test edits, no production code changes.
