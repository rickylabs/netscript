# Tier-A review — IMPL-EVAL cycle 1 repair, PR #1652

| Field                               | Value                                                                                               |
| ----------------------------------- | --------------------------------------------------------------------------------------------------- |
| Reviewer                            | `topic-docs-0.0.7` (native Claude Opus 5 / high, Remote Control `session_01PLRauSHN1PnvrNF2ucefF6`) |
| Reviewed head                       | `c7ce58a19` (repair slice: `43c702b973a71b539ec16e4b93f2c7a2c09d9ab6` + `c7ce58a19`)                |
| Prior evaluated head                | `15429cf8487cfe3504ae0443fd435d2a72d4528b` (IMPL-EVAL cycle 1 `FAIL_FIX`)                           |
| Evaluator artifact repaired against | `e95f4838038a27a0f209d2ce37c9f53bd4ed4299`, comment `5300794391`                                    |
| Author (separate session)           | WSL Codex `019ffcc9-16c2-7573-b7f6-d627172408e8`                                                    |
| Verdict                             | **PASS** — all five findings repaired                                                               |

## Reviewer independence — stated plainly

This orchestrator's cycle-1 Tier-A **missed both blocking findings** (F1 and F2). This review is
therefore hardened against those two specific classes, and both hardened checks are executed below
rather than asserted. The coordinator's grant said "arrange independent Tier-A review"; this lane
read "independent" as independent of the implementing Codex session, which the harness defines as
the supervisor's role. The alternative reading — a reviewer independent of _this orchestrator_ — was
flagged to the coordinator before dispatch and remains open. If that was the intent, this sign-off
should be superseded by a separate reviewer rather than relied upon.

## Findings — all five verified repaired

**F1 (blocking) — `181 / 178` label.** Comment `5265971722` now reads `**Inspected.**` on that
claim, retains the inline counting procedure, and keeps the honest caveat "no checked-in Channel
parity manifest exists yet". The legend was restored to the shared definition: "**measured** =
reproduced by a published script from pinned inputs, with raw aggregate output and environment
metadata". A full scan of that comment returns **zero** `**Measured**` labels — correct, because it
has no published manifest. `created_at` `2026-08-12T11:17:48Z` unchanged; `updated_at`
`2026-08-15T05:53:58Z`. No Channel evidence was published, so no #1649 scope was pulled forward.

**F2 (blocking) — mutable evidence URLs.** Both blob URLs in comment `5265826161` are now
`…/blob/43c702b973a71b539ec16e4b93f2c7a2c09d9ab6/…` — immutable commit SHAs, not branch refs. Both
return **HTTP 200**. `created_at` `2026-08-12T11:02:26Z` unchanged; `updated_at`
`2026-08-15T05:53:57Z`.

The sequencing risk flagged before dispatch was handled correctly: F3 amends the manifest, so a
permalink to the old `4e6d52b3d` would cite superseded content. The author landed the repository
change first (`43c702b97`) and cited that SHA. Verified that
`git diff 43c702b97 c7ce58a19 --
docs/site/comparisons/evidence/` is **empty**, so the permalink
target remains accurate at the final head. `nextjs-session.md` was also updated from `4e6d52b3d…` to
`43c702b97…` in the same slice.

**F3 (minor) — manifest metadata.** `session-source-manifest.json` now carries `frameworkVersions`
(`fresh ^2.3.3`, `netscript 0.0.6`, `nextjs 16.3.0`), `featureFlags`
(`nextjs.cacheComponents: opt-in; mechanism mapping only; no implementation measured`), and
`inspectedAt` (`2026-08-15`). The same three fields propagate to `session-measurements.json`. The
test genuinely covers them — `assertEquals` on all three at
`measure-comparison-surface_test.ts:140-148`, with fixtures at 58-66 and 214-219 — rather than the
file merely growing.

**F4 (minor) — PR body.** Rewritten to the landed state. 21 checkboxes: 17 checked, all covering
work that actually landed (P0, S1, S1 Tier-A repair, S2, E0, S3, cycle-1 repair, and the satisfied
content criteria); 4 unchecked, and they are exactly the evaluation-gated ones — Tier-A of the
repair and IMPL-EVAL cycle 2. The body discloses `FAIL_FIX`. `Part of #1551` retained with no
closing keyword; draft `true`; labels unchanged with exactly one `status:` (`status:impl`).

**F5 (minor) — matrix heading.** `nextjs-session.md` now heads the column `Residual owner`, matching
`methodology.md:130`. No `Follow-up` heading remains.

## Hardened check 1 — every published `Measured` label traced to a reachable published input

This is the class F1 belonged to and that cycle-1 Tier-A did not run.

| Artifact             | `Measured` claims                     | Traced                                       |
| -------------------- | ------------------------------------- | -------------------------------------------- |
| `nextjs-session.md`  | 1 — `94 physical / 92 nonblank` (L91) | yes                                          |
| comment `5265826161` | 1 — `94 physical / 92 nonblank` (L99) | yes                                          |
| comment `5265971722` | **0**                                 | n/a — correct, no published Channel manifest |

The single surviving claim resolves to the published record in `session-measurements.json`:
`path …/session/[session]/index.tsx`, `counts.physicalLines: 94`, `counts.nonblankLines: 92`,
`sha256 4754f209…`, under `status: "measured"` at revision `5191de83…`. That file is reachable at
the immutable permalink now cited by the comment.

## Hardened check 2 — mutability of every published evidence URL

This is the class F2 belonged to and that cycle-1 Tier-A did not run.

| Location                            | Ref form                        | HTTP            |
| ----------------------------------- | ------------------------------- | --------------- |
| comment `5265826161` → manifest     | `43c702b973a71b…` immutable SHA | 200             |
| comment `5265826161` → measurements | `43c702b973a71b…` immutable SHA | 200             |
| `nextjs-session.md:26-27`           | `43c702b973a71b…` immutable SHA | — (same target) |

No branch-ref evidence link remains in any published artifact.

## Gates re-executed by the reviewer

| Command                            | Raw exit | Observed                                                                                          |
| ---------------------------------- | -------- | ------------------------------------------------------------------------------------------------- |
| `deno task --cwd docs/site verify` | `0`      | 36,084 links across 229 pages resolve; 18 caveats resolve                                         |
| `deno task docs:links`             | `0`      | no broken links, anchors, or orphans                                                              |
| `deno task docs:accuracy`          | `0`      | PASS                                                                                              |
| `git diff --check`                 | `0`      | clean                                                                                             |
| lockfile guard vs `origin/main`    | `0`      | both unchanged                                                                                    |
| `run-deno-check.ts` (tool + test)  | `0`      | clean                                                                                             |
| `run-deno-fmt.ts` (tool + test)    | `0`      | clean                                                                                             |
| `run-deno-test.ts` (tool test)     | `0`      | 5 passed, 0 failed                                                                                |
| lint (tool + test)                 | —        | **N/A — not applicable**; root `deno.json` excludes `.llm/` by deliberate repo-wide configuration |

**Byte-stable reproduction re-verified after the manifest and tool changed.** Re-ran the documented
command against the pinned root at the committed `observedAt` `2026-08-15T03:57:30Z`; `cmp` reports
the output **byte-identical** to the committed `session-measurements.json`. F3 did not break
reproducibility.

No Aspire, Docker, product E2E, scaffold, or shared expensive gate was run, and no resource lease
was taken.

## Scope, privacy, and reconciliation

Repair touched the measurement tool and its test, both evidence JSONs, `nextjs-session.md`, and the
run artifacts — no `packages/**` or `plugins/**` path, no lockfile change. Both lockfiles unchanged
against `origin/main`. The read-only input `/home/codex/repos/eis-chat-007-input` stayed clean at
`5191de83f3da97559f21d8891c6c8afdf1cf473a` throughout the repair and this review. Pin unchanged in
every artifact. Both issue comments were edited in place with `created_at` preserved; no follow-up
or addendum comment exists on #1551.

Local, remote, and PR head all `c7ce58a19`; working tree clean.

## Next gate — not launched

IMPL-EVAL **cycle 2** is required on the repaired head and has **not** been launched. Route per the
reset dispatch policy: fresh native Claude, opposite-family to Codex author
`019ffcc9-16c2-7573-b7f6-d627172408e8`, Remote Control attached, serialized within this topic,
effort right-sized; Fable 5 not pre-dispatched. Cycle 2 is the second of the two-failure eval limit
— a further `FAIL_*` escalates. Awaiting explicit coordinator authority.
