# IMPL-EVAL — fix-1016-scaffold-tsconfig--project-boundary

Evaluator: Opus 5 supervisor (owner-waived open-model lane, 2026-08-01)

Implementation: Codex / GPT-5.6 Sol (low) at `4118eee7f`. Generator and evaluator are different
sessions and different model families.

Artefacts inspected directly (`git show`), not accepted from the slice's report.

## Commits verified

| SHA | What the diff actually does |
| --- | --- |
| `2032a4154` | Plan/research/context-pack/drift/worklog only. No source. |
| `09f80d220` | Harness bookkeeping; carries the supervisor `plan-eval.md`. No source. |
| `4118eee7f` | The fix. Two new Tier-1 generators, two writer call sites, two constants, four test files updated. 158 insertions across 12 files. |

## Change review

- `templates/workspace/tsconfig.ts` → `{ "files": [] }`. Matches locked decision D1 exactly.
- `adapters/templates/app/generate-app-tsconfig.ts` → the six D2 compiler options plus `files: []`.
  Matches D2 exactly. **Neither file contains `extends` or `include`** — the load-bearing property.
- `plan-init.ts` writes the root file through the same `writeFile(..., options.force)` create/skip
  bookkeeping as its peers, appending to `filesCreated`/`filesSkipped`. Correct.
- `write-app-files.ts` writes the app file through the existing `write()` helper, which does the
  same bookkeeping. Correct.
- No abstraction introduced, no template asset added, so no generated-asset regeneration is owed.
  Scope holds: nothing outside the two writers and their constants/tests changed.

Nit, not blocking: `TSCONFIG_ROOT` and `TSCONFIG_APP` are both `'tsconfig.json'`. Redundant as
data, but it documents that the two boundaries are independently owned, and a test pins both.

## Gates — re-run by me, not read from the report

| Gate | Command | Result |
| --- | --- | --- |
| Targeted tests | `deno test -A packages/cli/src/kernel/application/scaffold packages/cli/src/kernel/templates` | **66 passed (242 steps), 0 failed** |
| Scoped check | `run-deno-check.ts --root packages/cli --ext ts,tsx` | **744 files, 7 batches, 0 findings** |
| Scoped lint | `run-deno-lint.ts --root packages/cli --ext ts,tsx` | **744 files, 4 batches, 0 findings** |

These reproduce the PR's claimed numbers exactly, so the remaining reported gates
(fmt, `quality:gate`, doc-lint, publish dry-run) are credible by the same hand.

## Plan-Gate binding conditions — discharged?

1. **Verbatim A/B in the PR body, both halves.** MET. Before: Prisma `File 'astro/tsconfigs/strict'
   not found.` and Vite `failed to resolve "extends"` on the SSR request. After: Prisma exit 0 with
   generated client, and `HTTP/1.1 200` with an HTML body from a real `/` request. The slice
   explicitly refused to use Vite "ready" as evidence, which was condition 1's whole point.
2. **Box 3 reported as manual + unit property tests.** MET, stated in exactly those words in the PR
   and flagged in the worklog handoff note.
3. **Stop-and-drift if findings 6/7 did not reproduce.** Not triggered — both reproduced against
   real generated output.

## Acceptance criteria (issue #1016)

| Box | Verdict | Evidence |
| --- | --- | --- |
| 1 — root `tsconfig.json` terminates lookup | MET | Generator emits `{ "files": [] }`; written by `scaffoldRoot()`; bookkeeping + no-`extends` test; present in fresh generated output. |
| 2 — app-local tsconfig terminates lookup | MET | Generator emits the Vite/Preact options with `files: []`; written by `writeNormalizedAppFiles()`; semantic test. |
| 3 — parent poisoned `extends`, `db generate` **and** dev server both still succeed | **MET AS BEHAVIOUR, NOT AS AN AUTOMATED TEST** | The behaviour is proven by the verbatim A/B on both halves. The issue's wording asks for a *test*; what exists is a manual reproduction plus unit-level property tests. Ticked on behaviour, qualified in the PR. |

## The red gate — the reason this does not go to ready

`deno task e2e:cli run scaffold.runtime --cleanup --format pretty` returned exit 1,
`passed=16 failed=1`. `database.init` timed out starting the Aspire AppHost.

Attribution check I performed myself: `certutil` is **absent** from this environment (`which
certutil` → nothing; `dotnet` present). That independently corroborates the slice's claim that the
failure is Aspire certificate trust, and it is consistent with the manual `db generate` run having
needed `ASPIRE_DCP_USE_DEVELOPER_CERTIFICATE=false` to get past the same boundary. No tsconfig
resolution error appears anywhere in the failure.

I judge the attribution **probably correct but not proven**. Proving it requires the same expensive
gate on `origin/main` as a baseline, and it would fail for the same environmental reason here, so no
agent in this environment can turn this gate green either way.

That matters more than usual for this change specifically: `scaffold.runtime` is the canonical
merge-readiness gate **for scaffold output**, and this change *is* a scaffold-output change. Marking
ready would mean asserting a green gate I did not see and cannot produce.

## Verdict

**PASS on the code. HOLD AT DRAFT for a human.**

The fix is real, minimal, correctly wired, well-tested, and its behavioural claim is backed by a
genuine before/after reproduction on both halves. Two things a human should close out:

1. Run `scaffold.runtime` in an environment with working Aspire certificate trust and confirm
   `database.init` passes — or confirm the failure is pre-existing on `main`.
2. Accept, or reject, box 3 being evidenced by manual reproduction plus property tests rather than
   by the automated test its wording implies.
