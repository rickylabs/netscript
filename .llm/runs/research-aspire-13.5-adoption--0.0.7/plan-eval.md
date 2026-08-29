# PLAN-EVAL — research-aspire-13.5-adoption--0.0.7

- Plan evaluator session: fresh Codex evaluator task `/root/aspire_13_5_plan_eval`, 2026-08-29
  (requested route: native Codex · GPT-5.6 Sol · high; model/effort are not introspectable from the
  evaluator task)
- Run: `research-aspire-13.5-adoption--0.0.7`
- Evaluated head: `d8caa507e4c956306e3d292926d12d28b15abd3b` (confirmed pushed as
  `origin/research/aspire-13.5-0.0.7`)
- Evaluator worktree / branch: `/home/codex/repos/netscript-007-aspire-13-5-plan-eval` /
  `eval/aspire-13.5-plan-eval-d8caa507`
- Surface / archetype: ARCHETYPE-6 (`packages/cli` and agentic tooling), ARCHETYPE-5
  (`plugins/{sagas,streams,triggers,workers}`), SDK-neutral `packages/aspire`, and MCP/telemetry,
  CI, generated assets, skills, and release orchestration surfaces
- Scope overlays: `SCOPE-docs.md`; runtime/Aspire consumer gates apply to generator, MCP, telemetry,
  and teardown changes

## Findings (severity ordered)

### F1 — Critical — The S6 health-check design cannot prove its own acceptance contract

`sub-issues/06-real-health-checks.md:17-26` proposes a shared Node `net` TCP readiness helper and no
database driver, while lines 35-38 require a wrong database password to make the resource unhealthy.
A successful TCP connection proves that a listener exists; it does not prove PostgreSQL, MySQL, or
SQL Server authentication with the configured credentials. Implementing three wire-protocol
authentication handshakes is a materially different design from the named `createTcpReadinessCheck`
helper and is not sliced, risked, or gated. The research recommendation also calls S6 a small
generator change (`research.md:284`). This is an unlisted decision that would force rework.

Required correction: lock one executable readiness contract per backing-service kind before filing
S6. Name the dependency/port used, credentials and secret handling, timeout/cancellation behavior,
the exact `HealthCheckResult` mapping, and a failure fixture that the chosen probe can actually
observe. If the intended contract is TCP-only, change the acceptance to a refused/unreachable
listener and state explicitly that authentication readiness remains deferred; otherwise name and
gate the real protocol client(s).

### F2 — Critical — Canary and stable admission omit product-affecting late slices

The plan makes canary C optional (`plan.md:95`) even though S9 necessarily changes published
`netscript agent init` output, installed skills, embedded corpora, and the Aspire MCP gate
(`sub-issues/09-skills-corpora-mcp-alignment.md:73-93`). Stable admission names S9-S11 but omits S13
(`plan.md:76-77`, `plan.md:96`), even though S13 changes the scaffolded consumer CI template,
telemetry/example defaults, an internal skill, and the parity gate's final enforcement
(`sub-issues/13-stale-surface-cleanup.md:12-35`). Therefore the described stable cut can ship
without a published-artifact canary covering the agent/MCP output and before the whole-ecosystem
parity gate is finalized. Canary A is also described as version-only (`plan.md:93`) while S4 may
change #1371 emission and changes the AppHost config default
(`sub-issues/04-generator-revalidation.md:28-31`).

Required correction: redraw the train so every product/output-changing slice is covered by a named
published canary. Either put S9/S10/S13 before a mandatory final canary or make canary C mandatory;
make stable wait for S13, the final parity gate, the MCP smoke receipt, the appropriate green
published E2E pair, and IMPL-EVAL. Keep canary A truly pin-only or state and test its actual
generator scope. Add an S13 rollback boundary.

### F3 — High — The MCP receipt has a visibility loophole and ambiguous cross-slice ownership

The structured MCP receipt is a strong direction: it ties the generated `.mcp.json` entry point,
server version, full tool list, doctor result, AppHost scope, and resource visibility to one JSON
receipt. However, S9 says hidden db-helper resources come from S8 and accepts
`excludeFromMcp: not-applicable` when none exist
(`sub-issues/09-skills-corpora-mcp-alignment.md:38-42,
84-87`). S8 does not own `excludeFromMcp()`
(`sub-issues/08-typed-resource-commands.md:16-28`), and the DAG does not make S9 depend on S8
(`plan.md:70-75`). The plan can therefore pass S9 without proving the advertised 13.5 visibility
behavior, or make two independent PRs edit the same generated db-helper surface. The smoke also
needs to state the spawned server's working directory/AppHost selection so `list_apphosts` is
deterministic.

Required correction: assign `excludeFromMcp()` to exactly one slice. If adopted in 0.0.7, add the
dependency edge and make at least one named hidden helper plus one named visible user resource
mandatory in the receipt; remove the N/A escape. Otherwise explicitly defer the annotation and keep
S9's receipt about unchanged all-resource visibility. Specify spawn cwd, AppHost selection, timeout,
stdio shutdown, secret redaction assertions, and receipt retention. Keep the committed 13.4.6
baseline and exact-13.5.3 server/tool proof.

### F4 — High — S1's parity acceptance is impossible under the planned staged rollout

S1 forbids skill/docs changes (`sub-issues/01-pin-bump-and-parity-gate.md:45-49`) and intentionally
leaves their parity checks in warning mode until S9/S11 (`:67-72`), but its first acceptance item
requires a repository-wide `13.4.6` sweep to return only fixtures/history/`.llm` (`:51-55`). At the
evaluated head, known non-archival hits remain in `skills/aspire/SKILL.md`, `skills/help.md`,
`docs/site/explanation/aspire.md`, `docs/site/orchestration-runtime/how-to/deploy-local-aspire.md`,
and their generated skill corpus. The stated S1 boundary and acceptance cannot both be true.
Additionally, the acceptance text omits known archival exemptions under `resources/design/**`,
`docs/site/_plan/**`, and RFCs that the final inventory deliberately preserves.

Required correction: define named parity phases. S1 must fail on the atomic CLI/SDK/integration,
workflow, cache-key, and policy-test set while reporting explicitly deferred S9/S11/S13 rows; S13
then flips the complete enforce set to failure using the exact archival manifest. Scope each grep to
its phase or move marker/snippet-only pin edits into S1. Make every issue acceptance command
consistent with the chosen lifecycle.

### F5 — High — The authoritative slice/inventory surfaces do not enumerate the complete wave

`plan.md` claims independently shippable slices but enumerates only S1-S12 (`plan.md:50-65`); S13
appears only in the DAG and later artifacts. The ratification recommendation again files only S1-S11
plus S12 (`plan.md:151-155`). S13 is also absent from rollback and stable admission. This fails the
Plan-Gate requirement that every slice be enumerated with files and a proving gate.

The same completeness problem affects public docs: `stale-surface-inventory.md:109` says the 94
Aspire-mentioning files are listed in `worklog.md`, but no such list exists. A baseline `git grep`
at the evaluated head finds 107 tracked non-`_plan` Aspire-bearing `docs/site` files (98
Markdown/VTO pages under the evaluated pathspec), so neither the claimed count nor a per-path
disposition is reproducible. Wildcard prose is not enough for the owner mandate to dispose every
static/generated/document surface.

Required correction: add S13 to the plan slice table with its files, gates, prerequisites, rollback,
canary/stable admission, and filing metadata; update every summary/handoff consistently. Commit the
exact path-producing command and sorted inventory (with clear inclusion rules for source pages,
templates, diagrams, generated assets, and archival `_plan` pages), then give every row a slice,
gate, or archival exemption. Make S11 acceptance consume that manifest rather than an unrecorded
count.

### F6 — High — The required planned-public-surface jsr-audit was not performed

The Plan-Gate requires the jsr-audit publishability rubric before slicing package/plugin waves.
`plan.md:15-18` mentions jsr-audit only if `packages/aspire` changes, while S5 explicitly plans a
public `SagaPublisherResult` redesign (`sub-issues/05-literal-ports.md:20-21`) and defers jsr-audit
until implementation conditionally (`:41-45`). No research or plan section records the planned
export-map/doc-lint/slow-type/consumer-import risks for that plugin surface. This is a direct
unchecked Plan-Gate item.

Required correction: apply the jsr-audit rubric now to every planned package/plugin public-surface
change (at minimum the sagas result and any plugin contribution contract touched by S5). Record
current export paths, slow-type/doc-lint risks, consumer migrations, publish dry-run/consumer import
gates, and the slice that owns each risk. Mark untouched SDK-neutral `packages/aspire` explicitly
N/A only if its public surface remains unchanged.

### F7 — Medium — Evidence tables and resumable summaries contain material rendering/staleness defects

The capability matrix rows C17, C20, C21, and C22 in `research.md:65-70` contain unescaped pipe
characters that shift content into the wrong columns; C17/C20-C22 no longer render as an auditable
capability → kind → TypeScript evidence → NetScript disposition mapping. The AGENTS block row in
`stale-surface-inventory.md:66` has the same defect. These rows cover resource MCP, telemetry,
deployment, integrations, and emitted agent guidance—the exact surfaces this evaluation was asked to
verify.

Separately, `context-pack.md:29-34` omits S13 from filing, the appended `worklog.md` rows are
malformed Markdown, and `.llm/2026-08-29-aspire-13.5-adoption-research.md:6-7` still says 12 slices.
Live verification also shows milestone 0.0.7 now has 50 open issues rather than the 46 recorded in
`existing-issue-map.md`; this count is advisory drift and does not invalidate the issue-state map.

Required correction: escape/rewrite the affected tables so each TypeScript-only claim and
disposition renders in the intended column, repair the worklog table, and update resumable summaries
to 13 slices. Keep the live milestone count timestamped or remove the volatile count.

## Checklist results

| Plan-Gate item                          | Result   | Evidence / location                                                                                                                                                                             |
| --------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | **FAIL** | The 13.5.3 upstream/repo re-baseline is strong and spot-checks passed, but the public-doc inventory is neither listed nor reproducible and load-bearing capability rows are malformed (F5, F7). |
| Decisions locked                        | **FAIL** | The health-probe contract and MCP visibility ownership are not implementable locked decisions (F1, F3).                                                                                         |
| Open-decision sweep                     | **FAIL** | It omits the health-protocol/dependency choice, staged parity lifecycle, late-canary admission, and MCP ownership decisions (F1-F4).                                                            |
| Commit slices (< 30, gate + files each) | **FAIL** | Thirteen issue drafts exist, but the authoritative plan enumerates only twelve and omits S13 rollback/admission (F5).                                                                           |
| Risk register                           | **FAIL** | It does not mitigate protocol-level health feasibility or the absence of a published canary for the S9/S13 output changes (F1, F2).                                                             |
| Gate set selected                       | **FAIL** | Runtime/static gates are broadly strong, but staged parity is contradictory and the required planned-public-surface jsr-audit is absent (F4, F6).                                               |
| Deferred scope explicit                 | **PASS** | `plan.md:141-149` and S12 clearly defer Interaction Service, terminal, Redis modules, first-party Deno hosting, and experimental resource-MCP defaults.                                         |
| jsr-audit surface scan (pkg/plugin)     | **FAIL** | S5 plans a public sagas result change without a pre-slice jsr-audit surface/slow-type analysis (F6).                                                                                            |

## Open-decision sweep (evaluator-run)

The following decisions would force rework if deferred and are not captured in the plan's sweep:

1. Real protocol/authentication readiness versus TCP-listener readiness for each S6 backing-service
   kind, including dependencies and secret handling.
2. Exact ownership and ordering of `excludeFromMcp()` for db-cli helper resources (S8 or S9), and
   whether resource exclusion is required acceptance or deferred scope.
3. The staged enforcement contract for `check:aspire-version-parity` from S1 through S13.
4. The published-canary boundary after S9/S13 and the stable admission rule that consumes it.
5. Whether S4 is allowed to change emitted output before the canary described as pin-only.

OF-1 through OF-5 are visibly surfaced and have defaults. Because this is a planning-only seed run,
their owner ratification belongs at seed stage H after PLAN-EVAL; they are not silently taken. They
must nevertheless be ratified before filing/dispatch, and OF-2 must be resolved before S1.

## Live verification notes

- `origin/research/aspire-13.5-0.0.7` resolves to the evaluated head.
- Microsoft Aspire's latest release is still `v13.5.3` (published 2026-08-25).
- Aspire #16218, #18627, and #18628 remain open on milestone 13.6; #18628 remains `NO-MERGE`.
- The exact `Aspire.Hosting.Browsers` version `13.5.3-preview.1.26425.3` exists on NuGet; no stable
  Browsers 13.5 package is listed.
- NetScript #863, #979, #1000, #1280, #1365, #1366, #1370, #1371, #1372, #1429, #1642, #1668, and
  #1675 remain open. The mapped state/milestone relationships are materially accurate; #1675 is
  still a real S9 admission dependency.

## Verdict

`FAIL_PLAN`

### If FAIL_PLAN — required fixes

1. Lock an executable S6 readiness design and align its acceptance with what the probe can observe.
2. Redraw canary/stable admission so S9 and S13 are covered by a published canary, stable waits for
   S13/final parity/MCP receipt, and S4 does not contradict canary A's stated scope.
3. Give `excludeFromMcp()` one owner and a deterministic, non-optional receipt contract (or defer it
   explicitly); specify MCP process lifecycle/cwd/redaction evidence.
4. Make the S1→S13 parity-gate enforcement phases and acceptance commands mutually consistent.
5. Enumerate S13 everywhere, add its rollback and gates, and commit the exact whole-ecosystem docs/
   static/generated path manifest with per-path dispositions.
6. Perform the required pre-slice jsr-audit for planned package/plugin public-surface changes.
7. Repair malformed capability/inventory/worklog tables and stale 12-slice summaries.

No second PLAN-EVAL cycle is authorized by this verdict. Implementation and GitHub filing remain
blocked until the coordinator applies these bounded corrections and the owner authorizes another
evaluation cycle.

## Notes

The research has unusually strong upstream coverage, TypeScript-first source discipline, a useful
13.4.6 MCP baseline, and a well-shaped exact-13.5 structured receipt proposal. The verdict is not a
request to redo the research or redesign the 13-slice program. It is a bounded executable-plan fix:
close the acceptance contradictions, make the late release boundary honest, and make the complete
surface inventory machine-reviewable.
