# IMPL-EVAL — comparison docs programme #1551 (PR #1652)

**VERDICT: PASS**

Phase: IMPL-EVAL (formal, cycle 2). Scope overlay: `SCOPE-docs`. Archetype: `1-small-contract`
(docs overlay; no `packages/**` or `plugins/**` surface touched). Cycle 1 returned `FAIL_FIX` on
`15429cf84`; this session is fresh and did not consult the cycle-1 evaluator, the generator, or the
topic orchestrator.

## Evaluated identity

| Field | Value |
| --- | --- |
| Evaluated source (immutable) | `c7ce58a19494024c219e9970deeb3ece878232d6` |
| Base (immutable) | `01e0960494c95ce56eb35892c211a095eb13e6ed` |
| Local `HEAD` | `c7ce58a19494024c219e9970deeb3ece878232d6` |
| `git ls-remote origin refs/heads/docs/comparison-docs-programme` | `c7ce58a19494024c219e9970deeb3ece878232d6` |
| PR #1652 `headRefOid` | `c7ce58a19494024c219e9970deeb3ece878232d6` |
| Worktree | clean (`git status --porcelain` empty) |
| PR state | `open`, `draft: true`, `status:impl`, milestone `0.0.7` |

All three heads equal the briefed immutable source. The gate is not refused.

## Route and attachment

| Field | Value |
| --- | --- |
| Claude session id | `4ed649d5-9d62-4e24-a50a-081477607cee` |
| PID | `145190` |
| cwd | `/home/codex/repos/netscript-007-docs-comparison` |
| `bridgeSessionId` (authoritative, `~/.claude/sessions/145190.json`) | `session_013RN66nBipHogdecXX4uZ9G` |
| Remote Control URL | `https://claude.ai/code/session_013RN66nBipHogdecXX4uZ9G` |
| `bridgeSessionId` (jobs file, non-resolving `cse_` form) | `cse_013RN66nBipHogdecXX4uZ9G` |
| Observed route (`~/.claude/jobs/4ed649d5/state.json` → `respawnFlags`) | `--model claude-opus-5`, `--effort medium`, `--permission-mode bypassPermissions`, `--remote-control` |
| Requested route | native Claude Opus 5, effort medium, Remote Control attached, `bypassPermissions` |
| Requested vs observed | **matched** |

Generator independence: the generator is WSL Codex `019ffcc9-16c2-7573-b7f6-d627172408e8`
(gpt-5.6-sol). This session is native Claude, opposite-family, was not resumed from any other
session, and consulted no other agent. No agent was launched from here.

## Gate results (raw exit codes)

| Gate | Command | Raw exit |
| --- | --- | ---: |
| Docs site verify | `rtk proxy deno task --cwd docs/site verify` | `0` |
| Internal doc links | `rtk proxy deno task docs:links` | `0` |
| Docs accuracy | `rtk proxy deno task docs:accuracy` | `0` |
| Diff hygiene | `git diff --check` | `0` |
| Lock hygiene | `git diff --exit-code origin/main -- deno.lock docs/site/deno.lock` | `0` |
| Measurement tool/test check | `run-deno-check.ts --root …measure-comparison-surface.ts --root …_test.ts --ext ts` | `0` |
| Measurement tool/test format | `run-deno-fmt.ts --root …measure-comparison-surface.ts --root …_test.ts --ext ts` | `0` |
| Measurement tool tests | `run-deno-test.ts -- --allow-read --allow-write …measure-comparison-surface_test.ts` | `0` |
| Measurement tool lint | `run-deno-lint.ts --root …measure-comparison-surface.ts --ext ts` | `2` — **N/A, verified below** |

Gate substance: 644 files built; rendered-output OK across 229 HTML files; 36,084 internal links
across 229 pages resolve; 18 caveat markers across 14 pages resolve. `docs:links`: 103 docs,
0 broken links/anchors/orphans. `docs:accuracy`: PASS (201 published source pages, 178 shipped
corpus files, 91/91 root/direct public commands). Tool tests: 5 passed, 0 failed, 0 ignored.
No Aspire, Docker, product E2E, scaffold, shared expensive gate, or resource lease was used.

The exit codes above match `worklog.md:207-219` row for row.

## Cycle-1 findings — independently re-verified

### F1 — Channel `181 / 178` label and the `measured` definition → **repaired**

- Comment `5265971722:151` now reads `**Inspected.**`, not `**Measured.**`. The inline procedure
  ("physical lines including blanks and nonblank lines excluding whitespace-only lines") and the
  adjacent disclosure "no checked-in Channel parity manifest exists yet" (`:153`) are retained.
- The legend at `5265971722:17` is restored to the shared text: "**measured** = reproduced by a
  published script from pinned inputs, with raw aggregate output and environment metadata". That is
  byte-equivalent in substance to `methodology.md:44`, to `5265826161:17`, and to
  `nextjs-session.md:40`.
- Sweep for remaining `**Measured` labels across `docs/site/comparisons/`, `docs/site/migration/`,
  and both comment bodies returns exactly three sites — `nextjs-session.md:24`,
  `nextjs-session.md:91`, `5265826161:99` — all of which are the Session `94 / 92` claim or its
  source line, and all of which reproduce from published inputs (see F3/provenance below).
- I verified the Channel count itself against the pinned read-only input:
  `apps/dashboard/routes/project/[project]/channel/[channel]/index.tsx` at
  `5191de83f3da97559f21d8891c6c8afdf1cf473a` is 181 physical / 178 nonblank under the stated rule.
  The number is true; the label is now the correct one for it.
- *Falsified if:* a `**Measured` label is found elsewhere in the published surface without a
  reachable published input, or `5265971722:17` is shown to still weaken the shared definition.

### F2 — evidence URLs and their content → **repaired, sequencing verified**

- Every GitHub link in comment `5265826161` (`:100`, `:101`) and in `nextjs-session.md:26-27` is now
  `…/blob/43c702b973a71b539ec16e4b93f2c7a2c09d9ab6/…`. Enumerating all URLs in both comment bodies
  returns no branch ref, no `/tree/`, and no `main`/`master` blob.
- Both permalinks return HTTP `200`.
- Content identity, not merely resolvability: `gh api contents?ref=43c702b97` returns blob sha
  `b3ff74f5fede7b86181c1fa54059644aa748753a` for the manifest and
  `c4155f95a96da19fbe966cd9ca1835a010f8bfbb` for the aggregate. Local `git hash-object` on the two
  working-tree files returns the identical pair. The permalinks serve the manifest **as it now
  stands**, not a superseded version.
- Sequencing risk judged specifically: `git diff 43c702b973a71b539ec16e4b93f2c7a2c09d9ab6 c7ce58a19 -- docs/site/comparisons/evidence/`
  is **empty** (exit `0`). The F3 manifest amendment (`43c702b97`, `2026-08-15T07:53:21+02:00`)
  strictly precedes the comment edits (`updated_at 2026-08-15T05:53:57Z` / `05:53:58Z`, i.e. 36 and
  37 seconds later) and the page edit (`c7ce58a19`). The two-commit ordering claimed at
  `drift.md:187-190` holds.
- *Falsified if:* the evidence directory changes after `43c702b97` without the permalinks moving, or
  either blob sha ceases to match.

### F3 — manifest metadata and the test → **repaired**

- `session-source-manifest.json:5-12` carries `frameworkVersions` (`fresh ^2.3.3`,
  `netscript 0.0.6`, `nextjs 16.3.0`), `featureFlags` (`nextjs.cacheComponents`), and
  `inspectedAt 2026-08-15`. `session-measurements.json` echoes all three. This satisfies
  `methodology.md:59` ("framework and runtime versions, relevant feature flags, and the inspection
  date") inside `## 3. Pin a source manifest`.
- The framework versions are true, not asserted: the pinned consumer's `deno.json` and
  `apps/dashboard/deno.json` pin every `@netscript/*` import at `0.0.6` and `fresh` at
  `jsr:@fresh/core@^2.3.3`.
- The tool enforces them rather than passing them through: `parseManifest` now calls
  `stringRecord()` (rejects non-object and empty) and `inspectedDateValue()` (rejects a
  non-ISO-8601 calendar date) — `measure-comparison-surface.ts:205-221, 366-368`.
- The test asserts the values on the **output**, not file growth:
  `measure-comparison-surface_test.ts:140-148` `assertEquals(first.frameworkVersions, …)`,
  `assertEquals(first.featureFlags, …)`, `assertEquals(first.inspectedAt, '2026-08-15')`.
- Byte-identical reproduction verified by me, not accepted: I re-ran
  `measure-comparison-surface.ts --manifest docs/site/comparisons/evidence/session-source-manifest.json
  --root eis-chat=/home/codex/repos/eis-chat-007-input --observed-at 2026-08-15T03:57:30Z` writing to
  a scratch path (raw exit `0`); `diff` against the checked-in
  `session-measurements.json` is **empty**. The external input is at exactly
  `5191de83f3da97559f21d8891c6c8afdf1cf473a` and was read only — no write, fetch, checkout, or
  re-pin.
- The aggregate change from `54e1c3bff` to `43c702b97` is additive only: `tool.version 1.0.0 → 1.1.0`
  plus the three new fields. No count changed.
- *Falsified if:* the reproduction command yields a different file at the same `--observed-at`, or
  the three fields are shown to be absent from the parser's required set.

### F4 — PR body truthfulness → **repaired**

The live body (`updated_at 2026-08-15T06:07:00Z`) now lists P0, S1, S1 Tier-A repair, S2, **E0**,
S3, and the cycle-1 repair as landed, records the six landed slices, the correct evaluation history
(PLAN-EVAL `PASS` on `d35cbca30`, IMPL-EVAL cycle 1 `FAIL_FIX` on `15429cf84`, verdict comment
`5300794391`), and the current gate table. The false `## Validation` prose cycle 1 quoted
("implementation has not started", "PLAN-EVAL: pending") is gone.

No Definition-of-Done box is checked that is not satisfied. I checked each of the ten checked boxes
against the head; the two unchecked boxes (Tier-A repair review, IMPL-EVAL cycle 2) understate
rather than overstate — Tier-A repair sign-off comment `5300864119` exists and the box is still
unchecked, which is the safe direction. See N2.

### F5 — matrix heading → **repaired**

`nextjs-session.md:141` heads the eighth column `Residual owner`, matching `methodology.md:130`
inside `## 7. Complete every matrix row`. All eight rows still populate all eight columns.

## Provenance judgement (beyond the five findings)

- Pin `5191de83f3da97559f21d8891c6c8afdf1cf473a` appears at `nextjs-session.md:25`,
  `methodology.md:67`, `session-source-manifest.json:31`, `session-measurements.json:30`, and
  `5265826161:10` / `5265971722:10` — one value, six sites, unchanged.
- `grep` for `blob/main`, `blob/master`, `blob/docs/`, `blob/refs/heads`, `/tree/main`, `/tree/master`
  across `docs/site/comparisons/` and `docs/site/migration/` returns nothing.
- The remaining movable citations are `github.com/vercel/next.js/releases/tag/v16.3.0` (a release
  tag, explicitly permitted by `methodology.md:58` "immutable commit **or release identifier**") and
  `nextjs.org/docs/...` paths (permitted by `methodology.md:45` — **inspected** = "immutable source
  **or primary documentation**"). Every matrix row carries a Version sensitivity cell that declares
  that dependence. This is contract-conformant, not undisclosed exposure.

## Per-dimension judgements

### 1. Canonical in-place comments — PASS

| Comment | `created_at` | `updated_at` |
| --- | --- | --- |
| `5265826161` | `2026-08-12T11:02:26Z` | `2026-08-15T05:53:57Z` |
| `5265971722` | `2026-08-12T11:17:48Z` | `2026-08-15T05:53:58Z` |

`created_at` is unchanged on both — in-place replacement, not delete-and-repost. Issue #1551 still
carries exactly three comments; the third (`5300459514`, `2026-08-15T04:09:14Z`) is the owner's own
directive that ordered E0, not a run-authored addendum. A case-insensitive sweep of both bodies for
`update`, `correction`, `previously`, `changelog`, `revised`, `now reflects`, and `edit` (excluding
`revision`, `updateTag`, `revalidate`) returns **zero** hits. Both open on a definitive case heading
and read as current case studies.

### 2. Full locked scope — PASS

`git diff --name-only 01e09604..HEAD` is 21 paths: 10 run artifacts, the measurement tool and its
test, `docs/site/_data.ts`, `docs/site/_data/xref.ts`, the two evidence JSONs, and five
`docs/site/comparisons|migration` pages. No `packages/**`, no `plugins/**`, no lockfile
(`git diff --exit-code origin/main -- deno.lock docs/site/deno.lock` exit `0`). `arch-debt.md` needs
no delta because no doctrine-governed surface is touched. S1, S2, S3, the inserted E0, and the
cycle-1 repair are all represented in the commit list (`75a23105`…`c7ce58a19`, 13 commits).

### 3. Private-source and secret leakage — PASS (highest-stakes check, run mechanically)

I built a corpus of every ≥25-character stripped line from all 1,518 `.ts/.tsx/.json/.css/.sql/.md`
files in the pinned read-only consumer checkout (88,227 unique lines) and matched it against every
≥25-character line of the two comment bodies, all five comparison/migration pages, and both evidence
JSONs.

- **Docs pages: 6 matches, all coincidental** — five are the Lume frontmatter line
  `templateEngine: [vento, md]` and one is the Markdown separator row
  `| --- | ---: | ---: | ---: | ---: | ---: |`. **Zero private source content on any published
  page.** The claim at `nextjs-session.md:86-87` ("No private source content is reproduced on this
  page") is true.
- **Evidence JSONs: 0 matches.** They carry repository URL, revision, access class, twelve paths,
  `sha256`, integer counts, policy prose, and deferred owners.
- **Measurement tool:** `measure-comparison-surface.ts:604-613` emits
  `{...manifestFile, counts}` where `manifestFile` is `{path, classification, sha256}`; file text
  never leaves the local. `measure-comparison-surface_test.ts:150-152` asserts the serialized output
  contains neither `PRIVATE_FIXTURE_SECRET` nor the fixture content. My own reproduction run
  produced a file byte-identical to the checked-in aggregate, which contains no source text.
- **Comments: 40 verbatim lines** (15 in `5265826161`, 25 in `5265971722`). I read all of them.
  They are the declared illustrative excerpts — `definePage()`, `.withRoute(...)`, `.withLayer(...)`,
  `.withResource(...)`, `.withForm<...>`, `staleTime: DEFER_STALE_MS.crud`,
  `route: appRoutes.sessionTranscriptPartial` — i.e. framework-composition shape and internal symbol
  names, with bodies elided. Both comments label them as excerpts and state they omit private data
  and presentation prose; no page or artifact promises the comments contain zero private source.
- **Secret scan** (`api_key`, `secret`, `password`, `token=`, `bearer`, `authorization`,
  `private key`, PEM headers, `postgres|mysql|redis|amqp://`, `sk-…`, `ghp_`, `xox[baprs]-`,
  `AKIA…`) across all seven surfaces returns one hit: the word "secrets" inside
  `methodology.md:83`, which is policy prose. The only network hosts in the evidence JSONs are
  `https://github.com`.

I record what **is** published, so it is not mistaken for zero: the private repository URL, twelve
internal file paths, twelve content hashes, and ~40 lines of framework-composition source in the two
public issue comments. That surface is disclosed by `methodology.md:70-73` and was owner-directed.
**No secret, credential, business datum, domain model, CSS, or fixture leaked.**

### 4. `_data.ts` boundary divergence — PASS

`git diff 01e09604..HEAD -- docs/site/_data.ts` is exactly one line: `roots: ["/explanation/"]` →
`["/explanation/", "/comparisons/", "/migration/"]` at `_data.ts:106`. `drift.md:154-169` names the
file, states that the S1-deferred two-root assertion is unsatisfiable without it, records that
topic-orchestrator authority required the disclosure rather than a silent addition, and asserts no
IA/milestone/lockfile growth — all four verified. Both roots render (0 unresolved targets across
36,084 rendered links; 0 broken links/anchors across 103 sources).

### 5. `plan.md` amendment after the PLAN-EVAL gate — disclosed; one locked line relaxed

`git diff d35cbca30..HEAD -- …/plan.md` is three hunks: the Status line, a new `### E0` section, and
one non-goal edit. The E0 section is documentation of the insertion. The non-goal edit is not purely
documentary: the gated text forbade "publication" outright; the amended text narrows it to
"release/package publication" and adds "Owner-authorized in-place correction of the two canonical
#1551 case comments is the only external publication mutation in the inserted slice."

I judge this acceptable and name it rather than absorb it: the relaxation traces to owner comment
`5300459514` posted 56 minutes before the comment edits, is bounded to two named comment IDs, is
journaled at `drift.md:124-152`, and the adjacent locked line "No update to #1551's body, status,
milestone, or completion state" is intact and honored (issue #1551 has three comments and no body
edit). The plan's own claim that "a fresh PLAN-EVAL is therefore not required" is a
topic-orchestrator ruling, and the run says so rather than implying gate coverage it lacks. E0's own
gate ("changed paths are the five run artifacts only") is honored — `54e1c3bff` touches exactly
`research.md`, `plan.md`, `worklog.md`, `context-pack.md`, `drift.md`. No finding.

### 6. The six plan defects and `drift.md` sufficiency — PASS

Each of the seven `drift.md` entries carries severity, status, rescope, and scope-growth, and six of
them state explicitly that PLAN-EVAL cycle 1 passed over the defect. I re-judged each:

1. **S1 unsatisfiable rendered-navigation assertion** (`:11-29`) — correct: folder-derived
   navigation cannot render `/migration/` before the S3-owned index exists.
2. **S1's four premature migration references + link-gate gap** (`:31-52`) — verified against
   history: `3a8c73841` shipped them, `98fc58997` removed all four. The fix strictly reduced S1's
   published surface, and amending S1 to run `check:links` after `build` closes the detection gap.
3. **S2's pinned local input unavailable** (`:54-82`) — candid that the gap "follows from the
   approved plan itself", cites `research.md:51`, and records that S2 stopped rather than measuring
   a substitute revision. Correct call.
4. **S2 lint gate excludes its own files** (`:84-104`) and 5. **lint row ruled N/A** (`:106-122`) —
   **reproduced independently.** Root `deno.json` `lint.exclude` is
   `[".llm/", "tools/", "packages/cli/", "packages/mcp/tests/fixtures/doctor/"]`; `.llm/deno.json`
   does not exist; I ran the wrapper against `measure-comparison-surface.ts` and got raw exit `2`
   with `filesSelected: 1, excludedBatches: 1, totalOccurrences: 0` and the message "matched the
   wrapper selection but were excluded by Deno; refusing a false-green gate". **N/A — not
   applicable** is the correct classification; `worklog.md:146` and `worklog.md:216` record it as "not passed,
   skipped, or waived" and refuses the `--config` diagnostic as gate evidence. Ruling upheld.
6. **E0 canonical-comment correction** (`:124-152`) and **S3 `_data.ts` divergence** (`:154-169`) —
   both honest; the E0 entry publishes the superseded figures it replaced (`119 / 117`, `208 / 204`)
   instead of quietly dropping them.

The record is honest and sufficient.

### 7. Commit trail, artifacts, and process — PASS

Thirteen commits from base to head across P0/S1/S1-repair/S2/E0/S3/cycle-1-repair, each with a
`[PHASE: IMPL]` PR comment and a matching `[TIER-A: … SIGN-OFF — PASS]` comment; 19 PR comments in
total, ending with `5300842325` (repair report) and `5300864119` (Tier-A repair sign-off). No lane
self-certified: Tier-A sign-off is a distinct comment from each slice report, PLAN-EVAL `PASS`
(`5299119757`) came from a separate opposite-family session recorded at `9ae97c934`/`a790e91e2`, and
IMPL-EVAL cycle 1 (`5300794391`) and this pass are separate sessions again. `worklog.md:3` carries
the `## Design` checkpoint; `worklog.md:74+` is a per-slice gate log with raw exit codes.
`implement.md:7` carries the required `## SKILL` chapter. `context-pack.md:1-20` is current and
resumable at this head.

## Findings

**N1 — the published "normalized SHA-256" does not reproduce from the stated procedure.
(non-blocking; correct before `status:ready-merge`)**
PR #1652 body, `## Evidence and validation`: "after removing `/observedAt`, normalized SHA-256 is
`3d9d2eeffdce67c34dbeb12275fae8889b00578793fedf2894672037c3e654d2`". The same digest is asserted at
`worklog.md:70`, `worklog.md:209`, `context-pack.md:82`, and `drift.md:191`. I applied 21
normalizations to the checked-in `session-measurements.json` — `del(.observedAt)` with the tool's
own `serializeMeasurement` form (`JSON.stringify(o,null,2)+"\n"` → `0be43e05…`), the same without
the trailing newline (`75edd56a…`), compact (`baf8c1dc…`), `jq -S`/deep-sorted (`047fe9fc…`),
4-space, tab, CRLF, raw-line deletion, value-blanked, value-normalized, manifest+aggregate
concatenation in both orders, and the doubled-output form. **None yields `3d9d2ee…`.** The
predecessor digest `b9e96ed2…` at `drift.md:190` likewise does not reproduce from the pre-amendment
aggregate at `54e1c3bff` (`a3a0e5fa…` / `7e78d0ac…`). Weight is limited because the property the
digest stands for is true and I proved it directly — fixed-`--observed-at` regeneration is
byte-identical to the checked-in aggregate — and because the digest appears on **no** docs page and
in **neither** canonical issue comment; it is confined to the PR body and four run artifacts. It is
nonetheless an unreproducible number offered as evidence in a changeset whose subject is
reproducible evidence.
*Fix:* publish the exact normalization command alongside the digest, or replace the digest with the
`diff`/`cmp` result that is actually reproducible.
*Falsified if:* a stated command is shown that yields `3d9d2eeffdce67c34dbeb12275fae8889b00578793fedf2894672037c3e654d2`
from `docs/site/comparisons/evidence/session-measurements.json` at `43c702b97`.

**N2 — `plan.md`'s Status line is stale at this head. (non-blocking)**
`plan.md:3-5` reads "S3 remains paused until that correction is reviewed." S3 landed at `15429cf84`
and the cycle-1 repair landed at `c7ce58a19`. The resume artifact `context-pack.md:5-11` is current
and correct, which is why this does not block: `verdict-definitions.md` requires run artifacts
"updated enough for resume", and they are.
*Falsified if:* the Status line is refreshed, or `plan.md`'s header is read as a frozen record of the
gated plan rather than current status.

**N3 — two internal-record inaccuracies in `worklog.md`. (non-blocking)**
`worklog.md:211` cites "methodology section 5" for the matrix-column contract; the contract is
`## 7. Complete every matrix row` (`methodology.md:117-133`), with `Residual owner` at line 130.
Separately, PR body line 31 and Definition-of-Done line 75 leave "Topic-orchestrator Tier-A review of
the cycle-1 repair" unchecked although sign-off comment `5300864119` exists at the same
`updated_at` as the body. Both errors understate or mis-cite; neither overstates completion.
*Falsified if:* `methodology.md` renumbers, or the sign-off comment is withdrawn.

## Verdict rationale

`PASS`. Every `PASS` row above carries a command, a file:line, a fetched API value, or a hash I
computed.

All five cycle-1 findings are repaired, and I verified each against the artifact rather than against
the author's or the topic orchestrator's account — including the two the orchestrator's own Tier-A
missed. The two highest-risk items are the ones I checked hardest and both hold: the Channel count is
now labelled `inspected` with the shared `measured` definition restored, and the evidence permalinks
are commit-SHA blobs whose GitHub blob shas equal the local `git hash-object` of the current files,
with an empty `43c702b97..c7ce58a19` diff over the evidence directory proving the amend-then-publish
ordering. I reproduced the measurement byte-identically from the pinned read-only input, so the one
remaining `Measured` claim in the published surface is verified rather than asserted. The mechanical
private-source scan found zero consumer source lines on any docs page and zero secrets anywhere.
All nine gate rows are accounted for with raw exit codes, including the lint row I re-ran and
confirmed as genuinely not-applicable rather than skipped.

Not `FAIL_FIX`: no required gate fails, no required evidence is missing, no path or link is wrong,
and no false-done state from `SCOPE-docs` is present. N1 is a bookkeeping fingerprint whose
underlying property I independently proved true, on the PR body rather than the published docs or the
permanent public comments; N2 and N3 understate rather than overstate. None of the three changes what
a reader of the shipped docs is told. Not `FAIL_RESCOPE`: the plan and archetype are correct and
scope did not grow. Not `FAIL_DEBT`: no `packages/**` or `plugins/**` file is touched and no doctrine
violation is introduced or deepened.

N1 should be corrected before `status:ready-merge`, when the PR body becomes the close-gate mirror
source; it does not warrant returning this leaf for a third implementation cycle.

## Boundaries observed

No product file was authored, fixed, or edited. Issue #1551, both canonical comments, the pin, PR
labels, draft state, milestone, and all coordinator artifacts are untouched. The read-only input
`/home/codex/repos/eis-chat-007-input` was read only — no write, fetch, checkout, or re-pin; my
reproduction wrote to a scratch path outside both repositories. No agent was launched, no resource
lease taken, and no expensive or shared gate run. PR #1652 remains draft at `status:impl`.
