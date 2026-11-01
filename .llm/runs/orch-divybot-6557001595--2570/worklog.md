# Worklog

## Bootstrap — 2026-11-01

Read the complete assignment and live issue scope/comments. No orchid-triage
comment and no existing PR covering #2570 found. Memory consulted. Working tree
was clean. Feature matrix queried successfully with Deno 2.9.7.

Owner routing grant (verbatim):

> PLAN-EVAL and IMPL-EVAL: `claude -p --model claude-opus-5-5 --effort high`, read-only.

> Visual gate: an independent `codex exec -m gpt-6-astra` review, run read-only in a separate session, compares each rendered page with its Figma screen.

The dispatcher assigns implementation `model: gpt-6-astra`, `effort: high`.
These explicit routes override matrix defaults. Independence remains mandatory.

Design checkpoint pending research; no implementation begun.

## Design

1. Public surface: generated dashboard, records/list-detail, settings, signin and
   Cmd/Ctrl+K; existing `/design` retained. No new CLI flags or package exports.
2. Domain vocabulary: capability absence/readiness/unavailability, generated route,
   record summary/detail, browser preference. These carry real state only.
3. Ports: existing template/filesystem/formatter ports, typed SDK service client,
   request-local auth BFF, browser storage and registry components.
4. Constants: route aliases/navigation, existing plugin registration identifiers,
   capability state values and local preference keys; no copied business metrics.
5. Commit slices: S1 shell/empty pages; S2 live capabilities; S3 visual proof;
   S4 carriers/gates. Files and proving gates are enumerated in plan.md.
6. Deferred: opt-in showcase #2571, new framework components #2488, business data,
   workload/provider setup, release/merge. No new architecture debt planned.
7. Contributor path: scaffold page template README for composing capabilities;
   generated navigation.ts remains the route extension entrypoint.

Reconcile: source and live issue match the assignment. Owner's specific Refs-only,
no-label, READY process takes precedence over generic dispatcher close/ready boilerplate.

PLAN-EVAL round 1 FAIL_PLAN: six blockers corrected in plan.md B1–B6. No product
implementation occurred. Real baseline no-db scaffold generated and served;
Chromium returned its home heading and captured baseline-home-light.png.

PLAN-EVAL round 2: PASS. B1–B6 closed by independent Claude Opus 5.5 review.
Implementation begins only now. The explicit corrections section is authoritative.

## S1 — shell and absent states

Implemented shared overview, records routes, settings, sign-in and command palette
using the existing registry components. Theme and route counts derive from actual
metadata. Removed fake rows and no-service CRUD marketing. Preserved canonical
service examples and development runtime links.

Independent slice review round 1 FAIL_FIX: configuration failures leaked into page
500s. Fixed with server-only logging and a safe unavailable projection for all five
capabilities. New behavioral fixture covers missing file, invalid JSON and schema.
Round 2 PASS; S2 remains explicitly unassessed. Wrapper evidence after that fix:
11 tests, generated app 47 files, scoped lint/format 5 files. Quality gate and CSS
budgets pass. No package contract or shared component changes.

Browser debugging: regenerating a live app left old Vite processes serving stale
Fresh island URLs. Stopped only exact-app-owned processes and restarted after
regeneration. Native combobox consumed first Escape; app global shortcut now owns
palette dismissal and restores focus. Full visual/variant evaluation remains S3.

Reconcile: no dependency or lock changes. The existing gap-component PR remains a
merge dependency; this slice composes main's supported components.

S1 final browser receipt: PASS, 16 page/width/scheme cases plus preference save,
reload, keyboard opening/dismissal and focus return. The shortcut keeps an immediate
open ref to handle Escape in the same frame as opening (before effects re-run).
This is actual browser proof, not inferred from the code review. Scoped check and
11 tests rerun after the final template change. CSS totals in s1-css-installed.json.

S1 terminal independent review: PASS (s1-terminal-review.md), including the immediate
shortcut state and actual browser receipt. Sign-off commit follows that review.
Browser dependency: `npm ci --ignore-scripts` in tools/fresh-ui-browser supplies
Playwright; Chromium uses the existing host browser libraries.

## S2 — live capability wiring (review pending)

Memory and database adapters call generated typed clients and project whitelisted
record fields. Memory detail uses bounded pagination; missing, exhausted,
unauthorized and unavailable are distinct. Optional BFF discovery attaches each
request's own credential context without serializing it. No-service has no missing
contract import. Post-init service presence is detected as installed-unwired,
pointing to the existing resource generator (the approved B2 boundary).

Plugin discovery reads scaffold.plugin.json identity/resource linking, honors app
consumers and enabled references, and resolves auth route presence relative to the
actual app cwd. Workers use typed listJobs, streams use discovery and a validated
readiness response, AI reads app-owned configuration and the existing runtime when
present. No-samples AI has no chatModel export and is intentionally empty, not
falsely healthy. Missing providers are unavailable and diagnostics are safe.

Validation so far: 77 tests in scaffold/resource suites; generated memory and DB
apps each check 63 files, plugin app 50 files; scoped source wrappers and quality
gate pass. Actual memory-service browser shows fetched list/detail and missing-ID
states. Plugin install succeeds with Aspire scaffold enabled; --no-aspire installs
can stop at helper regeneration after writing files, so use an Aspire-enabled
fixture. Aliased local-path installs also fail in the pre-existing registration
path; canonical names succeed. No product workaround for those installer issues.

The plugin fixture received the latest emitted capability templates before startup,
retaining its installer-owned config and optional modules. Final S3/S4 proof will
regenerate the complete final scaffold. No shared components or service contracts
changed. Canonical memory resource input defect and actual CLI grammar corrections
are recorded in drift.md. Review is not final IMPL-EVAL.

S2 plugin browser follow-up: after adding references using the supported config
set command, the page detects them on the next request. The read probes report
unavailable services and empty no-samples AI. See s2-plugins-referenced-browser.json.
S2 source inventory is 25 owning files plus the generated embedded carrier.

S2 correction extends the declared resolver surface to public/adapters/jsr-import-resolver.ts and maintainer/adapters/local-import-resolver.ts: public service-add fixture exposed missing direct-import entries. Both use existing release constants; version parity now exercises the actual public resolver.

S2 review correction: accepted CLI-SCAFFOLD-WORKERS-CONTRACT-DEPENDENCY with cost,
mitigation and closure gate in the canonical ledger and plan. Version test now uses
the real public resolver. The broader service-add suite exposed missing mappings
in that resolver; corrected both public and maintainer maps. 90 focused tests pass.
A fresh --db none Aspire-enabled project followed by service add --name members
--with-client connects the exact untouched loader to ./members.ts; generated app
check passes. Unit coverage preserves edited, missing and already-connected loaders.
Capability metadata now uses live adapter results, missing app refs stay unlinked,
and disabled takes priority over unlinked. These close review findings 1, 2 and 8.
Remaining nonblocking observations 3–7 remain tracked for final evaluation; current
server errors remain safe, AI never invokes a generation operation, and missing
records render correctly but retain HTTP200. Do not claim full acceptance yet.

S2 terminal re-review PASS. Sign-off accepts documented workers dependency debt.
Reconcile: 30 owning TypeScript/template files plus generated carrier and debt/run
artifacts; five-file correction expansion was necessary for public resolver and
safe post-init connection. deno.lock unchanged; #2488 remains open. S3 starts next.

## S3 — visual refinement (in progress)

Matched Utility header rhythm, right-aligned actions and restrained text statistics;
added app-owned navigation glyphs through SidebarShell's existing icon slot. Fixed
existing CommandPalette keyboard dispatch, query filtering, conditional empty state
and reopen reset. Its CSS top offset is the only shared CSS change; budgets stay
unchanged. Existing component tests now render through Preact, covering its hooks.

Final proof uses clean workspace-empty/workspace-service/workspace-plugins generated
from current carriers, with custom portal app and members service. Plugins installed
through the actual CLI, and references set through config set. Previous final-* UI
update fixtures are debugging evidence only (see memory-command-palette.md).
The browser matrix asserts Studio Utility identity as well as scheme and overflow.

Final S3 matrix PASS:72 routes × variant/width/scheme cases and12 interaction sets.
This rerun includes the final mobile CSS. Clean fixture screenshots also prove
strict Studio Utility identity, auth form presence and fetched service rows. The
CSS-only final patch is copied from the exact template bytes; SHA256 per fixture
is recorded in s3-css-emission.json. No component or runtime source was hand-edited
in those fixtures. Independent Astra visual review is running separately.

S3 code review PASS. Final browser refresh already completed after mobile CSS;
its receipt now records the verified source/emission SHA256 and byte count. The
carrier generator is silent on success; S4 will retain explicit decoded-byte
comparison and command receipts. Reconcile palette selection/filter/reset behavior
with #2488 when merged, keeping equivalent upstream fixes if already present.

S3 visual round1 FAIL: all page classes pass except command (7/7.5). Corrections
remain in the existing shared palette: native Dialog.Close with visible Esc/Close,
keyboard-help footer,16px SVG search and highlighted-row rule. No prop changes.
Capture a real ArrowDown active state and prove visible-close behavior. Reuse the
same Astra reviewer for round2; a second terminal visual failure ends the loop.

Palette correction native ui:add changed managed imports in debug workspace-*
fixtures. Discarded those captures; final visual round2 uses freshly initialized
review-empty/review-service/review-plugins, then actual plugin installation and
config linking. No per-file source patching or registry update in these fixtures.
The corrected palette is included by init's regenerated embedded carrier.

Final review-* CSS emission is produced entirely by init, including its standard
Deno formatter. s3-css-emission.json records both raw-template and canonical-output
hashes/byte counts; all three actual files equal the canonical source. The browser
receipt records both identities. Palette copied bytes match the decoded registry
carrier (s3-carrier-comparison.json). Final page assertions now also require the
shared SidebarShell grid CSS to be loaded, guarding against the debug update issue.

PR metadata reconcile: issue2570 is assigned milestone0.0.9, so PR2572 now follows
that same agreed release. Labels remain empty per the owner override. Draft is
mergeable at d5f0c9a; no rebase or force push used.

## S3 terminal sign-off

Independent Claude code PASS and Astra round2 visual PASS. All96 refreshed images
meet >=8 fidelity/quality; browser72 cases/12 interaction sets passed. Previous
command-palette failure resolved. Reconciled current source, emitted CSS and both
carriers with the reviewed evidence. Supervisor sign-off accepts S3; S4 may start.

## S4 final verification

Deno2.9.7: all15 root check:* tasks PASS,release:preflight/docs:accuracy/quality:gate/
publish:dry-run PASS. Full publish regeneration no diff. Structured scoped check,
lint,fmt PASS19files plus corrected template test. Complete43-file suite now302PASS;
first run301PASS/1 obsolete shell assertion, corrected actual document and Partial
contract. CSS budget remains unchanged and green; independent visual PASS unchanged.

Full exact scaffold.runtime command ran and failed preflight.aspire and cleanup
because Docker is unavailable. Runtime and container cleanup UNPROVEN, not skipped.
FreshUI full-export doclint124 diagnostics in unchanged files; CLI doclint clean.
Foreign Aspire left untouched, run-owned previews stopped. Final separate Claude
IMPL-EVAL running. No READY; keep draft while required runtime remains unproven.

## Final independent sign-off and reconciliation

Fresh separate Claude Opus5.5 high read-only IMPL-EVAL: code PASS, no blocking
findings. It inspected the full source inventory,actual CLI/auth/plugin contracts,
all final receipts and acceptance gaps. Supervisor accepts implementation sign-off,
including the template assertion fix, with runtime explicitly UNPROVEN. No READY.
Only test/evidence files changed since S3 visual/current-carrier acceptance; final
302-test run includes the fix. No source/lock churn after review. PR remains draft.
The remaining work is one dependent runtime verification on a working Docker host,
not independent product scope to fan out. #2488 stillOPEN; merge/reverify if it lands.
