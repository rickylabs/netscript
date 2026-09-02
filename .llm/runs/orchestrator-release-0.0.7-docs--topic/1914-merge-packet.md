# MERGE PACKET — #1914 · immutable head `a8bb620a367c8cfa66a6b703b868a3ccaabc3f1c`

Closes #1892 · base `main` `77ad823dc` · **MERGEABLE / CLEAN** · milestone 0.0.7 ·
`status:ready-merge` · `orchestrator:docs`

## All CI green

| Check | Result |
| --- | --- |
| `check-test` | **success** |
| `quality` · `code-quality` · `build` | success |
| `close-gate` | **success** — 4/4 #1892 boxes mirrored |
| `classify changes` · docs-site · Fresh UI · core lane visibility | success |
| review threads | 0 |

Local at the same head: `docs:jsdoc-examples` exit 0, `deferredCensus={"unboundName":116,"typeError":14}`
against **unchanged** ceilings `116`/`14`; compiler suite **16/16**; repo suite **4860 / 0**.

## What it fixes

`declare global` symbol injection was program-global across the single `deno check` run, so it both
**leaked** (an example could use a documented value it never imported and still pass) and
**collided** (a symbol documented twice produced TS2451 in `preamble.ts`, which no example owns).
Those collisions were then **dropped**, because attribution matches module paths and
`unclassifiedCompilerFailure` only fires when *zero* diagnostics classified — never true with a
non-empty deferred corpus.

**Base `77ad823dc` was silently dropping 7 TS2451s while the gate exited 0** —
`resolveWorkspacePath` (documented by two packages), `createParallelQueue` (two examples),
`defineService` (three). Symbols now bind by a real import in the example module; any diagnostic no
module owns is counted and fails the gate. Unattributed **7 → 0**.

Removing the leak exposed five examples relying on it, all repaired to import what they use.

## IMPL-EVAL — PASS, separate session

GLM 5.3 Flash · effort `max` · evaluated head `b00ff6f5f`. It reproduced every number rather than
accepting it: the 7 base diagnostics with the base gate exiting 0, the enforcement probe printing
`unattributed compiler diagnostics: 7`, its own leak probe passing at base and failing at head, zero
non-comment `packages/` change, ceilings untouched. It caught and corrected its own artifact (a first
capture read 9 because it had inserted its probe concurrently).

It judged the #1892 acceptance self-edits **legitimate** — the stale `116/20` was factually wrong
after #1756's tightening, and hard-wrapped boxes truncate at the wrap in `acceptanceCheckboxes`, so
unwrapping restored evidence fidelity rather than relaxing anything. It noted it could not diff the
pre-edit body via the API, and rested on the body's self-note plus externally verified facts.

**Its one substantive criticism, acted on rather than argued with:** the box-4 tests asserted the
*binding string*, which would still pass if the import stopped being injected into the example
module — a proxy, not a proof, for a box that claims a test proves the property. I added the test it
specified (two synthetic blocks through the real `compileJsdocExamples` path, asserting the borrowing
example is classified `unboundName`/TS2304) and **verified it is not another proxy**: restoring the
old `declare global` preamble makes it fail. That is the only delta over the evaluated head — one
test file, additive, no production path touched, asserted by diff.

## Carried caveats, not buried

- Box 4's "fails" is satisfied via the **zero-slack ratchet**, not an enforced error: a new leaking
  example fails because `unboundName` sits at exactly its ceiling. Both mechanisms together close the
  hole, but they are different mechanisms.
- `unattributedDiagnostics` requires the `at path:line:col` shape, so a fatal diagnostic without it
  still evades that specific check. The zero-classified case remains covered by
  `unclassifiedCompilerFailure`.

Neither changed the verdict; both are worth knowing before the next change to this tool.

## Adjacent work delivered this cycle

**S9 (#1721) adjunct documentation audit**, reported on #1759, **Aspire ownership untouched**: both
of my earlier findings are fixed, and one new one — `SKILL.md` presents the 14-tool MCP table for
both modes while the PR's own fixture records `dashboardTools` as **3**, and the code already
distinguishes them in four places. It matters because that section's "if these tools are absent, use
the CLI" explains away exactly the symptom of dashboard-only mode.

## Docs queue after this

Empty for 0.0.7. The two remaining docs-surface 0.0.7 issues are `orchestrator:aspire` (#1721) and
`orchestrator:fixes` (#1360); there are no unowned 0.0.7 issues. Next Docs work is the audit lane
unless you want something claimed.

This lane does not merge.
