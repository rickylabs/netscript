# PLAN-EVAL cycle 2 — research-aspire-13.5-adoption--0.0.7

- Plan evaluator session: fresh independent Codex evaluator task `/root/aspire_13_5_plan_eval_c2`,
  2026-08-29 (requested route: native Codex · GPT-5.6 Sol · high; model/effort are not
  introspectable from the evaluator task)
- Run: `research-aspire-13.5-adoption--0.0.7`
- Evaluated immutable head: `1bfe60b05fa245007f1cb8d7fd0610fe7a680a06`
- Source branch equality: local `research/aspire-13.5-0.0.7` and `origin/research/aspire-13.5-0.0.7`
  both resolved to the evaluated head before evaluation
- Evaluator worktree / branch: `/home/codex/repos/netscript-007-aspire-13-5-plan-eval-cycle-2` /
  `eval/aspire-13.5-plan-eval-cycle-2`
- Surface / archetype: ARCHETYPE-6 (`packages/cli` and agentic tooling), ARCHETYPE-5
  (`plugins/{sagas,streams,triggers,workers}`), SDK-neutral `packages/aspire`, MCP/telemetry, CI,
  generated/static assets, skills/corpora, dashboard, deployment, and release orchestration
- Scope overlays: `SCOPE-docs.md`; runtime/Aspire consumer gates apply to generator, MCP, telemetry,
  deployment, and teardown changes
- Prior cycle: `plan-eval.md` = `FAIL_PLAN` at `d8caa507e4c956306e3d292926d12d28b15abd3b`

This is the second and final ordinary PLAN-EVAL cycle. The review is delta-focused against F1–F7,
but the verdict still applies the full Plan-Gate executability bar.

## Findings (severity ordered)

### F3/F4 — Critical — The mandatory MCP visibility and final parity proofs cannot execute as written

The MCP ownership/lifecycle repair is mostly strong: S8 is the sole owner of `excludeFromMcp()`, S9
depends on S8, the receipt launches the generated `.mcp.json` entry from the project root, selects
the exact realpath-matched AppHost, has bounded per-call/whole-gate timeouts, closes stdin then
escalates TERM/KILL, checks secrets, and retains a structured receipt plus a redacted transcript
(`sub-issues/08-typed-resource-commands.md:1-28,48-61` and
`sub-issues/09-skills-corpora-mcp-alignment.md:24-109`). The visible user-resource and excluded
MCP-resource halves are mandatory, with no N/A escape.

However, S9 additionally requires the `<db>-cli` resource to be absent from default
`aspire describe` and present only under `aspire describe --include-hidden`
(`sub-issues/09-skills-corpora-mcp-alignment.md:51-57`). `excludeFromMcp()` only excludes a resource
from MCP resource/log/telemetry operations; it does not hide it from default CLI resource lists
(`sources/aspiredev-get-started_aspire-mcp-server.md:116-145` and the TypeScript API index at
`sources/aspiredev-reference_api_typescript_aspire.hosting.md:445-447`). Aspire has a separate
`withHidden()` API for default resource-list visibility (`:717-720`). S8 owns only
`.excludeFromMcp()` and does not name `.withHidden()`. The receipt therefore requires an unowned
behavior. Either S8 must also deliberately own and test `.withHidden()`, or S9 must remove the
default-describe-hidden assertion and prove only the MCP exclusion while using `describe` as an
independent existence cross-check.

The parity proof has two independent contradictions:

1. D-13 says phase 1 reports every other non-archival manifest row by owner (`plan.md:38,142-145`),
   but S1 acceptance says the deferred report contains exactly S9/S11/S13 rows
   (`sub-issues/01-pin-bump-and-parity-gate.md:51-56`). At the evaluated head, stale non-archival
   paths are also owned by S2/S3/S4/S7 and shared/derived owners (for example
   `.llm/harness/debt/arch-debt.md`, teardown tests, generator comments/tests, MCP fixtures, and
   `packages/cli/e2e` tests). Both contracts cannot pass.
2. The manifest generator deliberately includes 23 current-run files as class `run-artifact`, owner
   `research`, while phase 2 fails over every owner other than `archival`. Nineteen of those
   current-run files contain intentional 13.4-or-earlier baseline/history literals. The plan at the
   same time says `.llm/runs/**` is excluded/archival and that S11/S13 must not edit it
   (`plan.md:146-153`). Phase 2 therefore cannot become green without rewriting protected research
   evidence. The S13 sample command also references `aspire-surface-manifest.tsv` as though it were
   at repo root and includes the TSV header as a path
   (`sub-issues/13-stale-surface-cleanup.md:54-59`).

Required correction: align phase-1 reporting with the actual owner set; classify the entire run
directory as archival/excluded (or otherwise make its historical rows informational); use the
repo-relative manifest path and skip its header; and resolve MCP-only exclusion versus CLI-hidden
visibility under exactly one slice.

### F2/F5/F7 — High — The authoritative plan still carries the old two-canary, 12-slice program

The detailed DAG and canary table correctly define mandatory canaries A (S1–S3), B (S4–S8), and C
(S9–S11 + S13), and stable waits for S13, parity phase 2, the MCP receipt, canary C's published E2E
pair, and IMPL-EVAL (`plan.md:73-101`). The epic and context pack largely agree.

The locked decision and planning surfaces do not:

- D-10 still locks **two** canaries, puts S4 in canary A, omits S7, S9–S11, and S13, and admits
  stable after canary B (`plan.md:41`).
- The risk register still says "Two canaries" and cuts A after S4 (`plan.md:124`).
- The authoritative slice table stops at S12; S13 has no row (`plan.md:54-68`).
- The plan rollback table stops at S11; S13 has no boundary (`plan.md:104-112`).
- The ratification recommendation files S1–S11 and S12, omitting S13 (`plan.md:166-169`).
- `worklog.md:21,24` and `context-pack.md:32-35` claim these corrections were made everywhere, which
  is not true at the evaluated head.

This is not harmless duplicate prose: D-10 is explicitly a locked architecture decision, and the
slice table, risk register, rollback table, and ratification recommendation are dispatch inputs.
They permit a coordinator to file/ship the obsolete train. F2 and F5 are not closed.

Required correction: make D-10, the risk register, slice table, rollback table, filing text, epic,
and context/worklog claims name the same 13-slice/three-canary program. S13 needs its own table row
with milestone, priority, lane, files/gates reference, prerequisites, canary, stable admission, and
rollback.

### F6 — High — The pre-slice JSR audit ran, but it leaves a public compatibility decision open

The evaluator independently re-ran the exact-head sagas checks:

- `deno publish --dry-run --allow-dirty` exits 0 with the intended file list and no slow-type
  errors. It also reports three pre-existing `unanalyzable-dynamic-import` warnings; these are not
  caused by S5, but the in-slice gate must not deepen them and the published canary remains the
  runtime proof.
- `deno doc --lint mod.ts` exits 1 with exactly one `private-type-ref` on
  `sagasPlugin: PluginManifest`. GitHub issue #1708 is open in milestone 0.0.8. The plan correctly
  classifies this as pre-existing and requires "no new errors"; unrelated repair is not an S5
  admission requirement.

The blocking problem is the unresolved S5 surface contract. `SagaPublisherResult` is already the
discriminated `SagaPublisherReceipt | SagaPublisherRejected`, and `SagaPublisherRejected.reason` is
already `string`
(`packages/plugin-sagas-core/src/integration/publisher/saga-publisher-port.ts:28-46`). Therefore a
`no-endpoint` rejection does not require a new closed-union variant or a core type change. The audit
nevertheless leaves that as "check ... if so". More importantly, `SAGAS_API_DEFAULT_PORT` is
demonstrably public from the package root, `./public`, `./runtime`, and `./aspire`
(`plugins/sagas/mod.ts:7-13`, `src/public/mod.ts:93-98`, `src/runtime/mod.ts:142`, and
`src/aspire/mod.ts:17`). Research leaves "verify export map before deleting; keep as deprecated
alias ... if exported" open (`research.md:276`), while S5 requires removing every `8092` literal and
its grep admits no compatibility alias (`sub-issues/05-literal-ports.md:9-34`). This changes the
public contract and would force rework/semver decisions if deferred to implementation.

Required correction: lock S5 to the existing rejected-result type (no core union change unless a
separately named need appears), and decide the public constant contract now—normally retain a
documented deprecated compatibility export without using it as a runtime fallback for at least the
canary window, with acceptance that distinguishes a public compatibility literal from prohibited
host/runtime fallback literals. Name all affected entry points and consumer migration gates.

### F7 / owner scope — High — Shape-valid tables still lost the load-bearing evidence

`tools/check-tables.py` reports `table check: OK`, but it checks only cell counts. The repaired
research rows are semantically corrupt:

- C17 has an empty NetScript disposition.
- C20 has empty source and disposition cells and damaged command prose.
- C21 ends its disposition at ``NetScript's deploy adapters shell `aspire publish``.
- C22 has empty source and disposition cells.
- The AGENTS-block row in `stale-surface-inventory.md:67` has empty owner/disposition cells and
  damaged `logs | spans | traces` prose.

These are the precise resource-MCP, telemetry, deployment, integration, and generated agent-init
surfaces F7 required the repair to restore. The mechanical 809-row manifest covers every tracked
Aspire-mentioning path, but some ownership is still not executable. In particular, the Aspire cloud
and compose deploy adapters/tests are assigned to generic `cli-adapter:aspire` owner S8, while the
S8 issue owns database commands and never inspects deployment. The truncated C21 row provides no
replacement deployment compatibility verdict or gate. Thus the clarified deployment scope has a row
but no real slice proof.

Required correction: reconstruct C17/C20–C22 and the inventory AGENTS row from primary evidence, not
merely escaped separators. Assign deployment adapters to a slice that explicitly verifies the 13.5
`publish/deploy/destroy` command contracts (or records a sourced no-change result) and names a gate.
Re-run both semantic review and the table-shape check.

### Open decision D-17 — Medium — Bounded pre-S13 decision, not an owner-only blocker

D-17 is referenced in drift, the epic, and S13 but is absent as a decision/open-sweep row in
`plan.md`. It presents two bounded implementation choices for the `ASPIRE_DASHBOARD_PORT ?? 18888`
assumption and says only "recorded as decision D-17 at filing"
(`sub-issues/13-stale-surface-cleanup.md:20-28`).

This does **not** need to be escalated as an owner-only architecture fork. It is a bounded pre-S13
ratification/default: explicit environment configuration should remain highest priority; an active
local AppHost should use the existing `aspire ps --format Json` discovery path; absence of both
should be a structured unavailable state rather than an unconditional ephemeral-port guess. If the
coordinator prefers env-only for deployed/non-Aspire contexts, that is also bounded, but the default
and affected tests/docs must be recorded before S13 begins. Add it to the open-decision sweep as
"must resolve before S13; safe to defer through canary B," with a named default. It is not a blocker
to S1 and does not require a third PLAN-EVAL.

## F1–F7 closure matrix

| Prior finding                                 | Cycle-2 result | Evidence                                                                                                                                                                                                                           |
| --------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1 S6 executable health contract              | **CLOSED**     | S6 now names TCP/RESP/HTTP probes, `node:net`, no credential handling, 2 s cancellation/socket cleanup, exact `HealthCheckResult` mapping, observable refused/timeout fixtures, recovery, and explicit S6b protocol/auth deferral. |
| F2 canary/stable admission                    | **OPEN**       | Detailed table is correct, but locked D-10 and risk text still authorize the old two-canary train; see finding above.                                                                                                              |
| F3 MCP ownership/visibility/lifecycle/receipt | **OPEN**       | Ownership, AppHost selection, lifecycle, redaction, retention, and exact server/tool receipt are closed; MCP exclusion is incorrectly required to imply CLI hidden visibility without `withHidden()`.                              |
| F4 staged S1/S13 parity                       | **OPEN**       | S1's exact deferred-owner set contradicts D-13; phase 2 includes protected research rows and uses a non-executable sample path.                                                                                                    |
| F5 complete S13 + 809-row manifest            | **OPEN**       | Generator is deterministic at 809 unique rows/0 unmatched, but S13 is absent from authoritative slice/rollback/filing tables and current-run archival classification makes phase 2 impossible.                                     |
| F6 pre-slice JSR audit                        | **OPEN**       | Commands and baseline classification exist; public default-port compatibility and actual existing result shape remain unresolved in the plan.                                                                                      |
| F7 clerical/table/context correction          | **OPEN**       | Format and cell-count checks pass, but load-bearing row content remains truncated/empty and D-10/S13 summaries remain stale.                                                                                                       |

## Clarified owner-scope audit

| Required surface                                 | Status                        | Evidence / gap                                                                                                                               |
| ------------------------------------------------ | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Aspire CLI/AppHost + TypeScript generator bridge | Owned                         | S1–S8 plus runtime receipts; S4 member audit and S6/S8 contracts are explicit.                                                               |
| SDK-neutral `packages/aspire`                    | Disposed as no-change         | 42 manifest rows are explicitly `N/A` because no public-surface change is planned; re-open JSR/doctrine gates if implementation adds a port. |
| MCP server/client/config/tools/resources         | **Blocked**                   | S9 has exact entrypoint/server/tool/lifecycle receipt, but MCP exclusion vs CLI-hidden semantics conflict.                                   |
| Static/generated resources                       | Owned, final gate blocked     | Generator/derived rows name regeneration gates; final phase-2 row source is not executable until current-run archival rules are corrected.   |
| Skills/corpora/prompts/agent-init                | Owned                         | S9 + generator/hash/corpus gates + canary C. Inventory AGENTS row must be reconstructed.                                                     |
| Fixtures/examples/templates/CI                   | Owned                         | S1/S3/S10/S13 and canaries A–C; S13 is missing from the authoritative slice/rollback/filing tables.                                          |
| Telemetry/dashboard                              | Owned with bounded D-17       | S2/S3/S9/S11/S13; D-17 needs a recorded default before S13, not owner-only escalation.                                                       |
| Deployment                                       | **Not fully owned**           | Manifest assigns deploy adapters to S8, but S8 has no deployment scope/gate; research C21 is truncated.                                      |
| Public/internal docs                             | Owned, evidence repair needed | S11 consumes 113 `doc:*` rows and names doc/corpus/diagram gates; C20–C22 and inventory row content remain damaged.                          |

## Checklist results

| Plan-Gate item                         | Result   | Evidence / location                                                                                                                                                                                |
| -------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current           | **FAIL** | Exact-head/upstream research exists and manifest regeneration is deterministic, but C17/C20–C22 and the inventory AGENTS row have lost their dispositions; deployment ownership is not executable. |
| Decisions locked                       | **FAIL** | D-10 contradicts the canary table; MCP hidden visibility and the public sagas port constant are unresolved.                                                                                        |
| Open-decision sweep                    | **FAIL** | It omits D-17, MCP-only vs CLI-hidden behavior, parity archival/reporting rules, and the sagas compatibility export.                                                                               |
| Commit slices (<30, gate + files each) | **FAIL** | Thirteen drafts exist, but the plan's authoritative slice table still stops at S12 and its rollback/filing text omits S13.                                                                         |
| Risk register                          | **FAIL** | It retains the obsolete two-canary risk/mitigation and does not mitigate the phase-2 archival contradiction or MCP visibility mismatch.                                                            |
| Gate set selected                      | **FAIL** | Runtime/canary gates are broadly strong, but mandatory parity and MCP receipts cannot pass as specified, and the JSR compatibility gate lacks a locked contract.                                   |
| Deferred scope explicit                | **PASS** | S6b credential readiness, S12 resource-MCP/Deno spikes, Interaction Service, terminal, Redis modules, and other 0.0.8 work are explicitly deferred.                                                |
| jsr-audit surface scan (pkg/plugin)    | **FAIL** | The rubric and commands were applied, but its public-surface findings were left as implementation-time questions that conflict with S5 acceptance.                                                 |

## Open-decision sweep (evaluator-run)

The following must be resolved in the plan before implementation of their owning slice:

1. S8/S9: MCP-only exclusion versus deliberate `.withHidden()` CLI visibility; do not make one API
   prove the semantics of the other.
2. S1/S13: actual phase-1 deferred owner set and archival treatment of the current run; phase 2 must
   have a real repo-relative row-source command that can go green.
3. S5: retain/deprecate or remove the already-public `SAGAS_API_DEFAULT_PORT` across root,
   `./public`, `./runtime`, and `./aspire`, and align the literal-port grep with that decision.
   `SagaPublisherRejected.reason` is already open `string`; no new core union variant is needed.
4. S13 D-17: bounded default/ratification before S13 (safe to defer through canary B), not an
   owner-only blocker and not a reason for another PLAN-EVAL.
5. Deployment: which slice supplies a sourced 13.5 compatibility verdict/gate for the Aspire deploy
   adapters currently misassigned to S8.

OF-1 through OF-5 remain visible and staged. Their owner ratification can occur at seed stage H as
already planned; they are not the reason for this verdict.

## Exact-head validation evidence

| Check                             | Result                                                                                                                                       |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Source identity / remote equality | local and remote research branch = `1bfe60b05fa245007f1cb8d7fd0610fe7a680a06`                                                                |
| Manifest generator type-check     | `deno check .../tools/aspire-surface-manifest.ts` = exit 0                                                                                   |
| Manifest regeneration             | `rows=809 unmatched=0`; 809 unique paths; SHA-256 before/after = `2a0690f73b170d7b0146e283dd6e17de8bf24a8d1ab46faafdde2d86389b5295`; no diff |
| Manifest ownership probe          | 120 archival, 23 `research`, 42 `N/A`, 14 `derived`; 49 non-archival paths contain a 13.4-or-earlier literal, including 19 `research` rows   |
| Markdown table shape              | `python3 tools/check-tables.py <run-dir>` = `table check: OK`; semantic inspection still finds the damaged rows above                        |
| Run-artifact formatting           | `deno fmt --check` across 24 non-source Markdown files = exit 0                                                                              |
| Sagas publish dry-run             | exit 0, no slow-type errors; 3 existing dynamic-import warnings                                                                              |
| Sagas doc lint                    | exit 1, exactly one pre-existing `private-type-ref`; #1708 open in milestone 0.0.8; correctly classified/guarded                             |
| Runtime safety                    | no host Aspire upgrade, AppHost start, product edit, GitHub issue/epic filing, or implementation was performed                               |

## Verdict

`FAIL_PLAN`

### Required fixes / escalation handoff

1. Repair the MCP visible/hidden contract and final parity manifest lifecycle so both mandatory
   receipts can execute.
2. Reconcile D-10, risks, S13 slice/rollback/filing metadata, and all summaries to one mandatory
   three-canary train.
3. Lock the sagas public constant/result compatibility contract from the already-observed export
   surface; preserve the pre-existing doc-lint guard without pulling #1708 into this wave.
4. Reconstruct the semantically damaged capability/inventory rows and assign deployment a real
   slice/gate.
5. Record D-17 as a bounded pre-S13 decision with a default; do not escalate it as owner-only.

This is the second and final ordinary PLAN-EVAL. Under the two-failure doctrine, implementation and
GitHub filing remain blocked and the unresolved plan items escalate to the coordinator/owner. This
artifact does not request or authorize a third PLAN-EVAL cycle.

## Notes

The repair materially improved F1, the detailed release train, MCP process determinism, and the
manifest's reproducibility. The failure is driven by exact executable contradictions, not by a
request for unrelated product repair or another research sweep. The smallest safe next action is a
coordinator-owned plan reconciliation using the required-fix list above.
