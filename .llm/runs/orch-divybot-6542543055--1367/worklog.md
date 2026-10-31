# Worklog

## Design

1. Public surface: optional DataDirectories map on Aspire plugin resource configuration and service
   spec, optional streams Aspire contribution `dataDir` constructor option. Existing env opt-in
   retained. Generated AppHost provisions declared directories; default remains ephemeral.
2. Domain vocabulary: data directory = host-owned persistent filesystem path passed through its
   named environment key; file durability = orderly restart replay, not power-loss protection.
3. Ports: existing AspireBuilder/DenoServiceSpec; node filesystem/path at AppHost edge; real producer
   and HTTP for acceptance; existing Aspire resource follower/command seams. No new framework engine.
4. Constants: STREAMS_DATA_DIR named at streams wiring; logical streams resource and storage health
   check names in acceptance; directory declarations remain plugin-independent in CLI.
5. Commit slices: bootstrap plan; one cohesive implementation+tests+docs slice; bounded review repairs
   if necessary. See plan.md for paths/gates. All slices carry worklog/context updates and are pushed.
6. Deferred scope: durable default/migration #2114, fencing redesign, substrate replacement, fsync
   transaction guarantees, multiwriter support, retention/backup automation.
7. Contributor path: plugins/streams/src/aspire/streams-contribution.ts shows the storage option and
   points to the core declaration consumed by generated registration. Docs streams page teaches usage.

## Bootstrap

Routing queried and owner override recorded in supervisor.md. No source edits before PLAN-EVAL.
RTK absent; direct shell tools used. Memory and MCP guidance consulted first. Draft PR exposes the
plan before implementation. Coordinator owns labels/milestones and expensive CI E2E.

Owner PR instructions conflict: the scoped brief says Refs-only; later mandatory delivery wrapper
requires the exact final line `Closes rickylabs/netscript#1367`. Preserve the scoped Refs first line
and required final line; do not mark unproven acceptance complete or change issue checkboxes.

## PLAN-EVAL round 1

FAIL_PLAN: generated-project proof needed a named CI gate, explicit configuration lifecycle, and a
negative-control mechanism despite the local full-E2E prohibition. Plan now names fixture and
behavior gates in both runtime tiers, provisions both modes before AppHost start, defines focused
Aspire execution and reverted-emission controls, and leaves any unrun acceptance unchecked.

## Implementation and runtime evidence

PLAN-EVAL round 2 passed before code edits. Implemented core-owned directory declarations and
schema, streams contribution option, generic generated AppHost provisioning and explicit docs.
A cloned ephemeral control is configured before startup; both CI runtime tiers include stable
fixture/restart gates. No plugin-name dispatch was added to the generator.

Focused local generated-project Aspire proof passed, failed when the emitted storage binding was
removed, then passed again when restored. See runtime-proof.md and negative-controls.md. The
current-main file-backed producer write-loss finding did not reproduce. Exact owned AppHost stopped.

Local structured wrappers: 60 streams/new acceptance tests and 197 related regression cases passed;
73 selected files type-checked; scoped lint/format passed with complete selection coverage. Source
readiness addition subsequently requires final focused rerun. quality:scan and arch:check exit 0,
verify-plugin and JSR audit exit 0, docs:links exit 0. Full export-map doc lint has inherited reds;
changed streams Aspire export and Aspire config/types exports pass with zero diagnostics. No
lock-file edits. Full scaffold.runtime is unproven locally by instruction; CI verdict required.

Post-slice reconcile: PR #2520 remains draft; no review threads/comments yet; source scope matches
supervisor declaration. Labels/milestones untouched. No duplicate remaining PR discovered.

## Slice review and signoff

Independent IMPL-EVAL round 1: PASS, no implementation blockers. Reviewer independently ran the
four focused test files (12 pass), checked public docs, inspected complete diff and scope. See
evaluate.md. Final combined durable test receipt: 258 passed / 0 failed / 0 ignored; quality-gate
receipt PASS. Final scoped lint/fmt: 15 selected, 15 processed, no findings. All mutation controls
restored and focused owned runtime stopped. No open review threads.

Commit this cohesive implementation slice and push; mark ready so CI starts. Required full
scaffold.runtime stays pending coordinator e2e-cli-gate. Final exact-head review follows in the same
independent session. No merge authorization is asserted by local PASS.

## CI remediation slice

Final independent review approved pushed implementation 57193c427042a6fdbc1ee1bcff6e61d2d55bf1ea
with exact `VERDICT: MERGE` and no code blockers; this is preserved as historical review, not a
verdict for a future head. Root CI quality then caught stale embedded consumer prose after the
streams docs edit. Native regeneration changed only pages/durable-workflows/streams/index.md in
the carrier, removed no entries, and left all runtime source unchanged. No lock edits.

Close-gate follow-up: validateEvidenceMapping matched all nine issue acceptance boxes to linked
executed evidence. Updated those boxes without changing their text and completed the actual
exact-head-review PR checkbox. Only the separate, unproven full scaffold.runtime requirement
remains unchecked. Never represent it as green without an executed verdict. Manual existing e2e-cli
workflow dispatch uses isolated GitHub-hosted VMs and leaves coordinator-owned labels unchanged.

CI remediation slice review: independent same-session reviewer PASS, decoded both carriers:
208 entries before/after, exactly the streams page changed, no additions/removals or unrelated
content. check:agent-docs-prose exits 0 (fresh:true, no stale paths); check:publish-assets exits 0.
Commit/push the generated-only correction and refresh runtime CI and exact-head review; preserve
all pending E2E claims as unchecked. Prior 57193c4 review remains historical evidence only.

## Combined CI asset repair / normal main merge

The new quality run passes agent-docs-prose, then fails mcp-export-corpus. This additional owned
artifact was missed by the first docs-only repair. Refresh the complete native generated closure.
Main's #2517/#2421 landed meanwhile; merge origin/main normally at
15cffa2fee5b6d543ecae2981a3563b1b74ca789. No source conflict; preserve upstream host-policy and
saga changes and all tracked run records. No manual edits to those sources or lock files.

Native MCP generator uses --allow-dirty only for generation from the pending merge's coherent
read set, as its documented workflow permits. New corpus differs from main in the optional directory
surface; downstream prose/publish generation preserves both upstream docs and this streams opt-in.
Focused combined test set passes 258/258 against the merged native streams service entrypoint.
Freshness/quality gates and independent review follow before merge-commit push.

Combined integration slice review: PASS from the same independent reviewer. Compared task source
against main: storage config, contribution, generation, tests and docs survive byte-identically;
MCP corpus changes exactly four of 306 rows for the optional directory surface, no rows removed.
Upstream host-policy/read-model work remains imported unchanged. All four asset freshness checks
and quality:gate exit 0. Focused generated-project proof rerun with explicit current-source plugin
sync passes through the new native streams entrypoint; exact owned AppHost stopped afterward.

New CI test-4 failures are also stale-corpus failures: clone-based write/check tests expect the
committed corpus to match current APIs, and the large failing artifact comparison exhausts the
assertion diff buffer. Do not weaken these tests. After committing the corrected corpus, rerun the
two exact failures from the committed tree (their fixture clones HEAD). Aggregated check-test fails
because of that shard; it is not an additional independently diagnosed failure.

## Aspire inventory CI repair

CI at bfc3e92 now passes every docs/API asset freshness gate. Aspire version parity then reports
only manifest:freshness. Native manifest generation adds four rows for the new storage fixture,
restart probe and focused tests; no enforcement/pin/disposition changes. check:aspire-version-parity
passes: manifestFresh=true, fail=0, missing=0 (1002 checked, unchanged inherited deferrals/info).
This is a derived inventory correction; final separate-session exact-head review covers it before
merge. Full runtime CI and final review remain unproven while their PR boxes are unchecked.

## Final documentation precision and remaining quality gates

Clarify failure timing without changing behavior: directory-creation failure aborts AppHost
composition; an existing unwritable directory fails the streams startup probe. This prevents an
unproven claim that every permission failure stops AppHost composition. Native embedded prose
regenerated; all prose/MCP/publish freshness and Aspire parity checks pass afterward.

Full workspace publish:dry-run exits 0. Cold AI peer compatibility exits 0 (lock-free); critical
advisory audit exits 0 (zero critical, not a claim of zero lower-severity advisories). No dependency,
lock, pin, policy or runtime-source changes. Keep final current-head runtime CI and exact-head
independent review pending; do not move their checkboxes until actually proven.
