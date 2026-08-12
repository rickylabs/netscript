# Wave plan — 0.0.6 fixes lane

Intent record. `cut-trace.md` is the record of what actually happened; neither is rewritten to
match the other.

## PR clusters

Clustered by **shared file surface + shared acceptance**, then checked both ways per the
`agent-milestone-orchestrator` too-big / mislabelled / unimplementable tests.

### PR A — release tooling truth (`#1438` + `#1430`)

| | |
| --- | --- |
| Surface | `.llm/tools/release/github-release.ts` (both issues, one file) |
| Branch | `fix/1438-release-cut-canary-pair-inheritance` |
| Lane | `normal_implementation` — Codex · Sol · **medium** |
| IMPL-EVAL | **Required**, focused, separate session (Fable 5 · medium) |
| Closes | `Closes #1438`, `Closes #1430` |

**#1438** — `isVersionOnlyReleaseDiff` (line ~132) allows only `deno.json` manifests, but a real
`release:cut` writes 62 files (38 manifests **plus** `deno.lock`, `.llm/assets/agent-docs/*`,
`*.generated.ts` barrels, six `plugins/*/scaffold.plugin.json` pins). The documented inheritance
path is therefore dead code and 0.0.5 paid an extra canary cycle for it. Fix: derive the allowed
set from the **same code that writes the bump**, so generator and verifier cannot disagree by
construction. `isExactVersionReplacement` (line ~151) is the per-file byte check that keeps a
widened path set honest — it must stay in force.

**#1430** — at line ~522, `--prev-tag` sets `since: ''`, which is falsy, so `fetchClosedIssues` is
never called and the closed-issues list is silently always empty. Fix: resolve the tag's release
(or tag commit) date into `since`, and make "previous tag known but `since` empty" a loud failure
rather than a plausible zero.

*Clustering justification:* one file, one contract family (release-notes/identity truth), and the
two edits are in disjoint functions. Splitting would force a rebase of the second PR onto the first
for no reviewer benefit. Not "too big": neither issue touches framework source.

### PR B — publish dry-run tree integrity (`#1417`)

| | |
| --- | --- |
| Surface | `.llm/tools/release/run-publish-dry-run.ts` + root `publish:dry-run` task |
| Branch | `fix/1417-publish-dry-run-no-mutation` |
| Lane | `normal_implementation` — Codex · Sol · **medium** (approach choice is real) |
| IMPL-EVAL | **Required**, focused, separate session (Fable 5 · medium) |
| Closes | `Closes #1417` |

Root `deno task publish:dry-run` exits 0 while rewriting 18–19 manifests, expanding `catalog:` to
pinned `npm:` specifiers and opting those packages out of central version control. The issue ranks
three approaches (throwaway copy **preferred**, snapshot/restore, fail-loud). Five acceptance boxes,
including a proven clean-tree assertion and a regression check.

*Kept separate from PR A* despite both being "release tooling": different file, different failure
class, and both are p1 — pairing them would put two release-critical changes behind one review.

### PR C — E2E gate-set truth (`#1397` then `#1399`)

| | |
| --- | --- |
| Surface | `packages/cli/e2e/` — `suites/scaffold/capability-suites.ts`, `src/domain/`, `tests/presentation/suite-registry_test.ts` |
| Branch | `fix/1397-1399-e2e-gate-set-truth` |
| Lane | `light_implementation` — Codex · Sol · **low** |
| IMPL-EVAL | Owner-waiver candidate, conditional on strong negative tests |
| Closes | `Closes #1397`, `Closes #1399` |

**#1397** (first) — `GATE.BEHAVIOR_SERVICE_HEALTH` sits in `POSTGRES_ONLY_RUNTIME_GATES`
(`capability-suites.ts:155-161`), so `runtimeGateIds` (line ~299) drops it for mysql/mssql while the
aggregate still reports green. Four acceptance boxes; the postgres set must be unchanged.

**#1399** (second, depends on #1397's final gate sets) — only the two runtime tiers pin their
deferred-gate set in `suite-registry_test.ts`; a deferral added to any other suite fails no test.
Four acceptance boxes; every suite pinned, empty set pinned explicitly, each deferral naming its
owning issue.

*Owner-given ordering.* Same worktree, two commits, #1397 first so #1399's pins are written against
the corrected sets rather than against sets that change under them.

### PR D — DB-backed island emitted-import guard (`#1428`)

| | |
| --- | --- |
| Surface | `packages/cli/src/public/features/root/public-command-tree_test.ts` |
| Branch | `fix/1428-db-island-emitted-imports` |
| Lane | `light_implementation` — Codex · Sol · **low** |
| IMPL-EVAL | Owner-waiver candidate, conditional on strong negative tests |
| Closes | `Closes #1428` |

The fixture scaffolds `--db none` (lines 166-167), emitting only the memory island, so a broken
specifier in `ServiceShowcaseLab.tsx.template` leaves the suite green. Also: the guard's regex only
matches `./` and `../` forms, so a broken non-relative specifier evades it.

*Independent:* different source tree from PR C (`packages/cli/src/**` vs `packages/cli/e2e/**`), so
C and D can run concurrently without conflict.

## Wave sequence

Waves are **dispatch** units and are kept small — a wide fan-out is what froze the host in 0.0.4.

| Wave | PRs | Concurrency | Rationale |
| --- | --- | --- | --- |
| **1** | A (#1438+#1430), B (#1417) | 2 Codex slices | The two release blockers, per the owner's priority. Disjoint files, no shared surface. |
| **2** | C (#1397+#1399), D (#1428) | 2 Codex slices | CLI/E2E truth. Disjoint trees. Dispatched at the wave-1 boundary. |

No dependency runs *inside* a wave; the only ordering constraint (#1397 → #1399) is internal to
PR C and is expressed as commit order, not as a wave edge.

## Canary points

**None declared by this lane.** Root owns canary cadence and the stable cut (`supervisor.md`
§ Scope). This lane's obligation is to preserve canary evidence, immutable versions, and lock
hygiene so that root's cadence is not corrupted — and to report each landing immediately so root
can compute payload from merge history.

## Pre-merge gate

`milestone-run.md`'s seven-check gate, run per PR, recorded per PR in `worklog.md`. Two checks are
load-bearing for this lane in particular:

- **Check 4 (named expensive gates report SUCCESS, not SKIPPED)** — this lane's entire subject
  matter *is* the did-not-run failure class. A gate record for PR C or D that cannot distinguish
  pass from did-not-run is self-refuting.
- **Check 3 (no new `deno-lint-ignore` / `as unknown as` / `@ts-ignore`, excluding `.llm/runs/**`)**
  — PR C and D add test machinery, the usual site for these.

Serialisation: any slice needing `scaffold.runtime` waits for exclusive use. No two runs concurrent.

## Dispatch preconditions (stage B)

Recorded in `worklog.md` before wave 1 dispatch — quota and paid-transport verification are
procedural gates whose proof is the recorded check output, not a claim.
