# IMPL-EVAL — comparison docs programme #1551 (PR #1652)

**VERDICT: FAIL_FIX**

Phase: IMPL-EVAL (formal, cycle 1). Scope overlay: `SCOPE-docs`. Archetype: `1-small-contract`
(docs overlay; no `packages/**` or `plugins/**` surface touched).

## Evaluated identity

| Field | Value |
| --- | --- |
| Evaluated head (immutable) | `15429cf8487cfe3504ae0443fd435d2a72d4528b` |
| Base (immutable) | `01e0960494c95ce56eb35892c211a095eb13e6ed` |
| Local `HEAD` | `15429cf8487cfe3504ae0443fd435d2a72d4528b` |
| `git ls-remote origin refs/heads/docs/comparison-docs-programme` | `15429cf8487cfe3504ae0443fd435d2a72d4528b` |
| PR #1652 `head.sha` | `15429cf8487cfe3504ae0443fd435d2a72d4528b` |
| Worktree | clean (`git status --porcelain` empty) |
| PR state | `open`, `draft: true`, `status:impl`, milestone `0.0.7` |

All three heads agree with the briefed immutable head. The gate is not refused.

## Route and attachment

| Field | Value |
| --- | --- |
| Claude session id | `c6950ed9-7405-4f28-9464-1e1977f2979c` |
| PID | `138125` |
| cwd | `/home/codex/repos/netscript-007-docs-comparison` |
| `bridgeSessionId` (authoritative, `~/.claude/sessions/138125.json`) | `session_01QjkTyGWr2HSHrLLVLdfhCR` |
| Remote Control URL | `https://claude.ai/code/session_01QjkTyGWr2HSHrLLVLdfhCR` |
| `bridgeSessionId` (jobs file, non-resolving `cse_` form) | `cse_01QjkTyGWr2HSHrLLVLdfhCR` |
| Observed route (`~/.claude/jobs/c6950ed9/state.json` → `respawnFlags`) | `--model claude-opus-5`, `--effort medium`, `--permission-mode bypassPermissions`, `--remote-control` |
| Requested route | native Claude Opus 5, effort medium, Remote Control attached, `bypassPermissions` |
| Requested vs observed | **matched** |

`/proc/138125/cmdline` is `claude bg-spare --bg-spare …` and carries no `--model`/`--effort`, as
expected for a daemon-claimed `--bg` session; `respawnFlags` is the observed route of record.
Generator independence: the generator is WSL Codex `019ffcc9-16c2-7573-b7f6-d627172408e8`
(gpt-5.6-sol). This session is opposite-family, was not resumed from it, and consulted no other
agent.

## Gate results (raw exit codes)

| Gate | Command | Raw exit |
| --- | --- | ---: |
| Docs site verify | `rtk proxy deno task --cwd docs/site verify` | `0` |
| Internal doc links | `rtk proxy deno task docs:links` | `0` |
| Docs accuracy | `rtk proxy deno task docs:accuracy` | `0` |
| Diff hygiene | `git diff --check` | `0` |
| Lock hygiene | `git diff --exit-code origin/main -- deno.lock docs/site/deno.lock` | `0` |

Verify substance: 644 files built; rendered-output check OK across 229 HTML files; **36,084 internal
links across 229 pages all resolve**; 18 caveat markers across 14 pages resolve. `docs:links`:
103 docs, 0 broken links/anchors/orphans. `docs:accuracy`: PASS (201 published source pages, 178
shipped corpus files, 91/91 root/direct public commands). No Aspire, Docker, E2E, scaffold, or
shared expensive gate was run; no resource lease was taken.

## Per-dimension judgement

### 1. Rewritten issue comments `5265826161` / `5265971722` — PASS with one finding (F1, F2)

Fetched live from the REST API:

| Comment | `created_at` | `updated_at` |
| --- | --- | --- |
| `5265826161` | `2026-08-12T11:02:26Z` | `2026-08-15T04:58:05Z` |
| `5265971722` | `2026-08-12T11:17:48Z` | `2026-08-15T04:58:11Z` |

`created_at` is unchanged on both while `updated_at` advanced — a true in-place replacement, not a
delete-and-repost. Both bodies open directly on a definitive case heading (`## EIS-Chat Session page
vs an equivalent Next.js 16.3.0 page` / `## EIS-Chat Channel dashboard and create-session form vs
Next.js 16.3.0`) with no "update", "correction", "previously", or changelog framing anywhere in the
prose. Unreproducible figures were removed, not restated: both carry an explicit "Next.js LOC, file
counts, ASC, dependency depth, feature scores, implementation effort, elapsed time, and percentage
advantage are **deferred**, not estimated" clause.

**No agent-authored follow-up or addendum exists.** Issue #1551 carries exactly three comments. The
third, `5300459514` (`2026-08-15T04:09:14Z`, 171 chars), is the **owner's own directive** that
ordered E0 — "Both above example have been significantly improved in eis-chat repository please
update the two comment to reflect the new surface and all improvements it gained !" — posted 49
minutes *before* the rewrites landed. It is the trigger, not an addendum from the run.

See F1 and F2 for the two defects inside these bodies.

### 2. 8×8 mechanism matrix — PASS

`docs/site/comparisons/nextjs-session.md:142-151`. Eight columns (Responsibility, NetScript
mechanism, Next.js `16.3.0` mechanism, Evidence, Loser overhead, Confidence, Version sensitivity,
Follow-up) × eight responsibility rows (dynamic route inputs, typed navigation construction, cached
projections, freshness clocks, loading and streaming, region failure isolation, navigation
transport, metadata). I read every cell: all six required columns are substantively populated in
all eight rows — no `n/a`, no empty cell, no placeholder. Rows that cannot select a loser say
"None established" or name the specific unrun experiment, which is what methodology §7 line 127
requires rather than an invented score. See F5 for a column-naming mismatch.

### 3. Counts, pins, and comment consistency — PASS (re-derived, not accepted)

I re-derived every aggregate from the 12 per-file records in `session-measurements.json` rather
than trusting `totalsByClassification`:

| Class | Physical | Nonblank | Comment | Tokens | Re-derived |
| --- | ---: | ---: | ---: | ---: | --- |
| Framework glue (4) | 143 | 135 | 8 | 1,349 | 94+17+16+16 / 92+15+14+14 / 7+1+0+0 / 823+187+168+171 ✓ |
| Consumer orchestration (1) | 182 | 172 | 6 | 1,320 | single file ✓ |
| **Included total (5)** | **325** | **307** | **14** | **2,669** | 143+182 / 135+172 / 8+6 / 1349+1320 ✓ |
| Presentation held constant (3) | 501 | 446 | 48 | 4,168 | 68+65+368 / 63+59+324 / 1+0+47 / 402+471+3295 ✓ |
| Generated (1) | 9 | 8 | 0 | 85 | ✓ |
| Excluded (3) | 275 | 271 | 10 | 3,214 | 73+118+84 / 69+118+84 / 10+0+0 / 838+1473+903 ✓ |

Every cell matches the page table at `nextjs-session.md:97-102` and the identical table in comment
`5265826161:104-111`. The **94 physical / 92 nonblank** primary-route figure is the `index.tsx`
record and is stated identically at `nextjs-session.md:92` and comment `5265826161:99`.
`includedTotals` correctly excludes generated and excluded classes per the declared
`measurementPolicy.includedTotals`.

Pin `5191de83f3da97559f21d8891c6c8afdf1cf473a` agrees across all four artifacts:
`nextjs-session.md:25`, `methodology.md:66`, `session-source-manifest.json:22`,
`session-measurements.json` source record, and both comments (line 10 each). All 12 file paths,
classifications, and `sha256` values are byte-identical between manifest and measurements.
`tool.version 1.0.0` matches the page's "measurement tool `1.0.0`"; `observedAt
2026-08-15T03:57:30Z` matches the page's freshness date `2026-08-15`.

The one number that does **not** trace to `docs/site/comparisons/evidence/` is F1.

### 4. Migration scope — PASS

`docs/site/migration/nextjs.md` is a seven-row concept map. Each row maps to a responsibility the
Session case actually established (dynamic segment, `use cache`, `cacheLife`, Suspense/loading,
parallel-route slot, `Link`/RSC, `generateMetadata`) and each carries an explicit evidence boundary
naming what is **inspected** versus **deferred**. It is a strict subset of the matrix — the "typed
navigation construction" row is deliberately not carried over. Line 11 states "Status: **roadmap /
deferred**. This page is not a complete migration guide." Lines 29-31 enumerate what is *not*
covered (runnable counterpart, runtime results, forms, middleware, image/font, deployment, testing,
auth, broader parity) and forbid inference. Line 33 assigns the complete guide to #1650. No
over-claim found.

### 5. Navigation and xrefs — PASS

`docs/site/_data.ts:106` sets Concepts `roots: ["/explanation/", "/comparisons/", "/migration/"]`.
Both roots therefore render under Concepts, satisfying the assertion S1 deferred to S3. `xref.ts`
adds the `compare:` and `migration:` namespaces with five keys, all of which resolve — the rendered
link check found 0 unresolved targets across 36,084 links, and `docs:links` found 0 broken links,
anchors, or orphans across 103 sources. `explain:compared` → `/explanation/compared/` was added and
resolves. No xref points at a missing target.

### 6. Journaled `_data.ts` divergence — PASS

The net diff is exactly one line (`roots` gains `/comparisons/` and `/migration/`). Git history
confirms the drift narrative rather than merely restating it: `3a8c73841` (S1) added both roots,
`98fc58997` (S1 Tier-A fix) reduced it to `["/explanation/", "/comparisons/"]`, and `15429cf84`
(S3) re-added `/migration/` alongside the pages that make the route resolve. The drift entry
(`drift.md:154-169`) names the file, states why the inherited two-root assertion is unsatisfiable
without it, records that topic-orchestrator authority anticipated and required the disclosure, and
asserts no IA/milestone/lockfile growth — all of which I verified. This is the minimum file needed
and the record is adequate.

### 7. Private-source and secret leakage — PASS

Highest-stakes check, run across all seven surfaces:

- **Measurement tool** (`.llm/tools/docs/measure-comparison-surface.ts:532`):
  `files.push({ ...manifestFile, counts: countText(text) })` — `manifestFile` carries only `path`,
  `classification`, `sha256`. File text is read into a local and never reaches the emitted record.
  No content, CSS, fixture, domain model, or credential path exists in the output type.
- **Evidence JSON** (both files): only repository URL, revision, access class, path,
  classification, `sha256`, integer counts, policy prose, and deferred owners.
- **Docs pages**: no private source excerpt; `nextjs-session.md:88` states "No private source
  content is reproduced on this page."
- **Both comments**: the code blocks are minimal illustrative composition skeletons with bodies
  elided as `/* … */` comments; no business data, credentials, domain models, CSS, or fixtures.

The published disclosure surface is: the private repo URL `rickylabs/eis-chat.git`, twelve internal
file paths, and content hashes. That is metadata, not content, and it is the irreducible cost of the
reproducibility contract the methodology commits to (§3 lines 70-73). It matches the
already-completed owner-accepted privacy audit. **No secret or private-source leakage found.**

### 8. `plan.md` amendment after the PLAN-EVAL gate — disclosed, but it did alter one locked line

`git diff d35cbca30..HEAD -- …/plan.md` is exactly three hunks: the status line, a new `### E0`
section, and one edit to a non-goal. The E0 section is pure documentation of the insertion. The
non-goal edit is **not**: the gated text read "No `packages/**`, `plugins/**`, dependency, lockfile,
generated route, release, publication, scaffold, or expensive E2E change"; the amended text narrows
`publication` to `release/package publication` and adds "Owner-authorized in-place correction of the
two canonical #1551 case comments is the only external publication mutation in the inserted slice."

So the amendment relaxed a locked stop condition, not merely annotated one. I judge this
**acceptable but worth naming**: the relaxation is traceable to owner comment `5300459514` posted
before the edits, is bounded to exactly two named comment IDs, is journaled in `drift.md:124-152`,
and the adjacent locked line "No update to #1551's body, status, milestone, or completion state"
was left intact and honored. The plan's self-assertion that "a fresh PLAN-EVAL is therefore not
required" is a topic-orchestrator ruling, not evaluator-verified authority; the PLAN-EVAL `PASS` at
`d35cbca30` covers S1–S3 and does **not** cover E0. The run states this openly rather than implying
gate coverage it lacks, which is the honest handling. No finding raised.

### 9. The five plan defects and the sufficiency of `drift.md` — PASS

I judged each correction independently rather than accepting the orchestrator's rulings:

1. **S1 unsatisfiable rendered-navigation assertion** (`drift.md:11-29`) — verified: folder-derived
   navigation cannot render `/migration/` before the S3-owned index exists. Correct disposition
   (defer the assertion to S3), and the entry names PLAN-EVAL cycle 1's miss explicitly.
2. **S1's four links into a later slice's section** (`drift.md:31-52`) — verified against history:
   `3a8c73841` shipped `/migration/` in `_data.ts`, `xref.ts`, and two page links; `98fc58997`
   removed all four. The fix strictly reduced what S1 published.
3. **S1's gate could not prove its own link contract** (same entry) — verified: `build` checks
   source format and rendered-output semantics only; `check:links` sat under the S3 `verify` gate;
   source-level `docs:links` passes dangling *rendered* targets. Amending S1 to run `check:links`
   after `build` is the correct minimal fix, and the worklog shows it executed thereafter.
4. **S2's local-roots contract with no slice creating the root** (`drift.md:54-82`) — the entry is
   candid that the gap "follows from the approved plan itself", cites `research.md:51`, and records
   that S2 stopped without reading any consumer file or fabricating a substitute revision. Stopping
   rather than measuring a different revision is the right call.
5. **S2's lint row targeting repo-excluded paths** (`drift.md:84-122`) — **verified independently
   and confirmed.** Root `deno.json` `lint.exclude` is `[".llm/", "tools/", "packages/cli/",
   "packages/mcp/tests/fixtures/doctor/"]`; `.llm/deno.json` does not exist. The two S2 tool files
   live under `.llm/tools/docs/`, so the mandated wrapper command can never select a lintable
   target and exit `2` is correct fail-closed behavior, not a failure. **N/A — not applicable** is
   the right classification, and `worklog.md:142` correctly records it as "not passed, skipped, or
   waived" while refusing to substitute the `--config` diagnostic as gate evidence. Reasoning
   verified, ruling upheld.

Every entry records severity, rescope, and scope-growth, and — notably — five of them state that
PLAN-EVAL cycle 1 passed over the defect instead of quietly absorbing it. The drift record is
sufficient.

### 10. Commit trail, artifacts, and process — PASS

Six implementation commits over four slices plus E0, each with a per-slice `[PHASE: IMPL]` PR
comment and a matching `[TIER-A: … SIGN-OFF — PASS]` comment (16 PR comments total). No lane
self-certified: Tier-A sign-off is a distinct comment from each slice report, and the formal
PLAN-EVAL came from a separate opposite-family session (`9ae97c934`, `a790e91e2`). `worklog.md`
carries the `## Design` checkpoint at line 3 and a per-slice gate log with raw exit codes.
`arch-debt.md` needs no delta: no `packages/**` or `plugins/**` file is touched.

## Findings

**F1 — `181 / 178` is labelled Measured but no published input reproduces it. (blocking)**
Comment `5265971722:151-153` states "**Measured.** … yields **181 physical / 178 nonblank lines**"
and, in the next sentence, "no checked-in Channel parity manifest exists yet". `grep` over
`docs/site/comparisons/evidence/` returns no Channel record — the directory holds Session inputs
only. `methodology.md:44` defines **measured** as "Reproduced by a published script from pinned
inputs, with raw aggregate output and environment metadata", and `methodology.md:77-78` requires
"A measured value must ship with its raw aggregate input/output and the exact command or script
procedure that produced it." The comment reaches its label by silently weakening the definition:
its own legend (line 17) says "**measured** = reproduced by a stated procedure from the pin",
dropping the *published script* and *raw aggregate output* requirements that comment
`5265826161:17` and `nextjs-session.md:41` both retain. PR #1652's Definition of Done also asserts
"Every number is reproduced by published inputs and procedure." The count itself is honest — the
generator reproduced it against the authorized checkout (`worklog.md:163`) — but a reader cannot
reproduce it from anything published, which is precisely the property the label asserts.
*Fix:* relabel the Channel count **inspected** (keeping the inline procedure statement), or publish
a Channel manifest/aggregate under `docs/site/comparisons/evidence/` and restore the shared
definition of **measured** in the comment legend.
*Falsified if:* the evidence directory gains a Channel input reproducing `181 / 178`, or
`methodology.md:44` is shown to permit **measured** without published raw aggregate output.

**F2 — Comment `5265826161` cites its evidence through mutable branch refs. (blocking)**
Lines 100-101 link the manifest and aggregate as
`…/blob/docs/comparison-docs-programme/docs/site/comparisons/evidence/…`. That is a branch ref, not
a commit. The case page does this correctly at `nextjs-session.md:26-27`, using the immutable
permalink `…/blob/4e6d52b3d2cb0bf24aca9a47a67da46a213fef64/…`. Both return HTTP 200 today (I
checked all four URLs), but a comment whose entire premise is immutable reproducibility, on a
permanent public issue, will 404 the moment PR #1652 merges and the branch is deleted — the normal
outcome. `methodology.md:58` requires an "immutable commit or release identifier" for evidence
sources; the comment's own source-authority section pins the *consumer* immutably while linking the
*evidence artifacts* mutably.
*Fix:* re-edit both URLs in place to a commit-sha permalink (`4e6d52b3d…` or the merge commit).
*Falsified if:* `docs/comparison-docs-programme` is retained permanently after merge.

**F3 — The published manifest omits three fields `methodology.md` §3 requires of it. (minor)**
`methodology.md:56-63` states the manifest records "framework and runtime versions, relevant
feature flags, and the inspection date" and "the environment fields that can affect its output".
`session-source-manifest.json` carries none of these: `grep` for `0.0.6`, `Fresh`, feature-flag, or
date fields across both evidence JSONs returns only `observedAt` (in the *measurements* file, not
the manifest) and a `timestampField` pointer. The versions exist as prose in `methodology.md:67` and
both comments, but not as machine-readable manifest fields. `nextjs-session.md:28-30` acknowledges
package versions "are not fields in the published measurement payload" — an honest disclosure that
nonetheless leaves the methodology's own §3 contract unmet by its first case.
*Fix:* add `frameworkVersions` / `featureFlags` / `inspectedAt` to the manifest, or amend §3 to
mark those bullets advisory.
*Falsified if:* §3's bullet list is read as descriptive guidance rather than a manifest requirement.

**F4 — PR #1652's body is materially false at the evaluated head. (minor)**
The live body (fetched at `updated_at 2026-08-15T05:34:46Z`) still reads: `## Slices` with S1, S2,
S3, Tier-A, and IMPL-EVAL all unchecked and **no E0 entry at all**; `## Validation` stating
"implementation gates: not run because implementation has not started" and "PLAN-EVAL: pending and
required before S1"; and the closing line "Implementation must stop until the topic orchestrator
supplies PLAN-EVAL `PASS`." At this head there are six implementation commits, a PLAN-EVAL `PASS`
(comment `5299119757`), and four Tier-A sign-offs. Weight is reduced because the authoritative
commit trail — the 16 per-slice PR comments — is complete and current, and `netscript-pr` classes
`## Slices` as non-authoritative progress tracking; the unchecked Definition of Done is correct for
a draft that has not reached `status:ready-merge`. But the `## Validation` prose is not a stale
checkbox, it is an affirmatively false statement on the PR's reviewable surface.
*Fix:* update `## Slices` (adding E0) and `## Validation` to the landed state.
*Falsified if:* the body is refreshed.

**F5 — Matrix column heading diverges from the methodology it implements. (minor)**
`methodology.md:130` requires the eighth column be `Residual owner`; `nextjs-session.md:142` heads
it `Follow-up`. Content is equivalent (each cell links an owning issue), so this is naming drift
between the contract and its first instance, not a missing column.
*Fix:* align one name to the other.
*Falsified if:* §7's column names are read as descriptive rather than prescriptive.

## Verdict rationale

`FAIL_FIX`, not `PASS`. Per `verdict-definitions.md`, `FAIL_FIX` applies when "the plan remains
valid but the implementation or docs need more work" — specifically "evidence is missing" (F1) and
"a path/link is wrong" (F2). The plan is sound, the archetype and overlay are right, scope did not
grow, all five gates are green, the arithmetic reconciles exactly, privacy is clean, and the drift
record is honest about its own gate's misses. What blocks a pass is that two of the run's
highest-visibility public artifacts — permanent comments on a public issue, presented as definitive
current case studies — carry a **Measured** label no published input can reproduce and cite their
evidence through a link that dies on merge. Both defects sit exactly on the evidence-integrity
contract this changeset exists to establish, which is why they outweigh their small size.

Not `FAIL_RESCOPE`: the approved plan and archetype are correct and the 0.0.7 cut is the right
slice. Not `FAIL_DEBT`: no architecture debt is introduced, deepened, or mishandled — no
`packages/**` or `plugins/**` file is touched.

F1 and F2 are both in-place comment edits; F3–F5 are single-line repository edits. None requires
re-planning, re-measurement, or a pin change.

## Boundaries observed

No file was implemented, authored, or fixed. Issue #1551, the two rewritten comments, the pin, PR
labels, draft state, and all coordinator artifacts are untouched. No agent was launched, no resource
lease taken, and no expensive or shared gate run. PR #1652 remains draft at `status:impl`.
