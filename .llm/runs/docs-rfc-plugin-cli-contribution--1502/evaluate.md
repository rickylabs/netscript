# Evaluation: plugin CLI contribution RFC (IMPL-EVAL)

## Metadata

| Field          | Value                                                    |
| -------------- | -------------------------------------------------------- |
| Run ID         | `docs-rfc-plugin-cli-contribution--1502`                 |
| Target         | `rfcs/0000-plugin-cli-contribution.md`                   |
| Archetype      | `4 — public DSL/builder, described by an RFC`            |
| Scope overlays | `SCOPE-docs`                                             |
| Phase          | IMPL-EVAL (final evaluator pass)                         |
| Evaluator      | fresh native Claude session, 2026-08-15, opposite-family |
| Generator      | Codex thread `019ffcc5-d3e1-7c13-9815-e9956ec43683`      |
| Dispatched by  | coordinator `codex-root-0.0.7`                           |

## Evaluator identity and attachment

| Field                | Value                                                     |
| -------------------- | --------------------------------------------------------- |
| Claude session ID    | `2a8cf0a6-7529-4ca6-97ce-69edcca3f84d`                    |
| Bridge session ID    | `cse_01Y48WxcCgzUAWfJmGmhBykc` (non-empty)                |
| Remote Control URL   | `https://claude.ai/code/session_01Y48WxcCgzUAWfJmGmhBykc` |
| Remote Control state | attached; `bridgeOutboundOnly: false`                     |
| Session PID          | `2718910` (pty host `2718869`, daemon `2429416`)          |
| Exact cwd            | `/home/codex/repos/netscript-007-features-1502`           |
| CLI version          | `2.1.233`, backend `daemon`                               |
| Requested route      | native Claude Opus 5 · high · Remote Control              |
| Observed route       | native Claude Opus 5 · high · Remote Control              |
| Route match          | **MATCH**                                                 |

Observed route was read from `respawnFlags` in `/home/codex/.claude/jobs/2a8cf0a6/state.json`:
`["--effort","high","--permission-mode","bypassPermissions","--remote-control","--name","NetScript 0.0.7 #1651 IMPL-EVAL","--model","claude-opus-5"]`.

Process argv is **not** a valid route source for this session and was not used.
`ps -o args -p 2718910` returns
`claude bg-spare --bg-spare /tmp/cc-daemon-1000/59093fbc/spare/080a20f1.claim.sock` — a
spare-claimed background process that carries no `--model` or `--effort`. Requested and observed are
reported distinctly above and agree.

## Head resolution (independently performed)

| Fact                  | Resolved value                              | Method                                                             |
| --------------------- | ------------------------------------------- | ------------------------------------------------------------------ |
| Local `HEAD`          | `04d431028c1fe455dc18c05e3fa0779e7b593046`  | `git rev-parse HEAD`                                               |
| Explicit remote ref   | `04d431028c1fe455dc18c05e3fa0779e7b593046`  | `git ls-remote origin refs/heads/docs/rfc-plugin-cli-contribution` |
| Live PR #1651 head    | `04d431028c1fe455dc18c05e3fa0779e7b593046`  | `gh pr view 1651 --json headRefOid`                                |
| Branch                | `docs/rfc-plugin-cli-contribution`          | `git rev-parse --abbrev-ref HEAD`                                  |
| Working tree          | clean                                       | `git status --porcelain` → empty                                   |
| Upstream              | none configured                             | `git rev-parse --abbrev-ref @{upstream}` → fatal, as required      |
| Evaluated final head  | `04d431028c1fe455dc18c05e3fa0779e7b593046`  | the three resolutions above agree                                  |
| Attested content head | `120859d5c762706702cd45a3f2be19664e335e22`  | `gitHead`/`actualGitHead` of all six binding receipts              |
| Content head ancestry | ancestor of final head                      | `git merge-base --is-ancestor 120859d5c 04d431028` → true          |
| PR state              | OPEN, `isDraft: true`, milestone `0.0.7`    | `gh pr view 1651`                                                  |
| Lifecycle labels      | exactly one `status:` label — `status:impl` | `gh pr view 1651 --json labels`                                    |

All three head resolutions agree with the immutable dispatch identity. No refusal condition.

**Content-to-final delta verified by diff, not by claim.**
`git diff --name-status 120859d5c..04d431028` returns 19 paths, every one under
`.llm/runs/docs-rfc-plugin-cli-contribution--1502/` (14 added receipts plus `context-pack.md`,
`drift.md`, `worklog.md`). Two commits: `c987f009e` (receipts) and `04d431028` (journal-only S4-F1
repair, touching only `context-pack.md`, `drift.md`, `worklog.md`). No RFC, source, contract, or
lock content appears in the delta. The content head is therefore the correct attestation target for
every binding gate.

## Drift test — advanced `main`

The leaf's `drift.md` discloses that live `main` advanced from the dispatch base
`01e0960494c95ce56eb35892c211a095eb13e6ed` to `0b3ed5d5a6aea451318f120988c25dfa3993a2ab` and asserts
this does not alter its ownership/coupling findings. I tested the assertion rather than accepting
it.

`git diff --stat 01e0960..0b3ed5d -- packages/cli packages/plugin` touches exactly two files:
`auth-plugin-command.ts` and its test. Every surface the RFC's audit actually cites is **unchanged**
across the advance — `public/features/plugins/plugins-group.ts`,
`local/features/plugins/plugins-group.ts`, `sdk/discovery/ast-extractor.ts`,
`dispatch/dispatch-plugin-verb.ts`, `packages/plugin/src/cli/mod.ts`, and both `deno.json` export
maps. The advance changed the auth command's _internals_; the RFC's finding is about its
_registration site_. **The assertion holds; no RFC claim is stale.**

## Process Verification

| Check                                  | Result | Evidence                                                                                                                                                                          |
| -------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | PASS   | `plan-eval.md` cycle 2 = `PASS` in verdict commit `3e0c8858b`; cycle-1 preserved at `plan-eval-cycle-1.md`                                                                        |
| Design section exists in worklog       | PASS   | `worklog.md:12` `## Design` with `### Public Surface`, `### Domain Vocabulary`, `### Ports`, `### Constants`                                                                      |
| Commit slices match design plan        | PASS   | `worklog.md:61` `### Commit Slices` — 6 slices S0, S0R, S1–S4; PR body slice list matches branch commit trail                                                                     |
| Each slice has a passing gate          | PASS   | `worklog.md:176` `### Static Gates` names a gate per slice; S4 binding set recomputed below                                                                                       |
| No speculative seams (unused files)    | N/A    | leaf adds one Markdown file and run artifacts; no code files created                                                                                                              |
| Constants used for finite vocabularies | PASS   | RFC declares `PLUGIN_CLI_CAPABILITIES`, `PLUGIN_CLI_DIAGNOSTIC_CODES`, `PLUGIN_CLI_CONTRACT_FAMILY/MAJOR` as `as const` tuples with derived union types, not bare string literals |

## Static Gates — binding six-receipt set, recomputed

**Sufficiency was recomputed, not read.** I loaded the six contracted `invocationId`s and called
`evaluateEvidenceSet` from `.llm/tools/gates/evidence-set.ts` directly:

```text
sufficiency: "SUFFICIENT"
reasons: []
expectedGateIds: [arch-check, check, docs-accuracy, docs-source-format, publish-dry-run, test]
receiptIds: [ns1502-s4-final-arch-check, ns1502-s4-final-check, ns1502-s4-final-docs-accuracy,
              ns1502-s4-final-docs-source-format, ns1502-s4-final-publish-workspace, ns1502-s4-final-test]
```

This reproduces the worklog's claim exactly, including the same six receipt IDs.

| Gate                 | `invocationId`                       | Outcome | Exit | `gitHead` == `actualGitHead` | `allowGitHeadMismatch` |
| -------------------- | ------------------------------------ | ------- | ---- | ---------------------------- | ---------------------- |
| `check`              | `ns1502-s4-final-check`              | PASS    | 0    | `120859d5c…` == `120859d5c…` | key absent             |
| `test`               | `ns1502-s4-final-test`               | PASS    | 0    | `120859d5c…` == `120859d5c…` | key absent             |
| `publish-dry-run`    | `ns1502-s4-final-publish-workspace`  | PASS    | 0    | `120859d5c…` == `120859d5c…` | key absent             |
| `arch-check`         | `ns1502-s4-final-arch-check`         | PASS    | 0    | `120859d5c…` == `120859d5c…` | key absent             |
| `docs-source-format` | `ns1502-s4-final-docs-source-format` | PASS    | 0    | `120859d5c…` == `120859d5c…` | key absent             |
| `docs-accuracy`      | `ns1502-s4-final-docs-accuracy`      | PASS    | 0    | `120859d5c…` == `120859d5c…` | key absent             |

### Is naming a subset honest scoping or evasion? — **honest scoping**

I tested the alternative. `receipts/*final*.json` is 17 files and is **not** a valid evidence set
for two independent mechanical reasons, both verified:

- Three receipts share `gateId: 'publish-dry-run'` (`publish-dry-run-final.json` workspace,
  `publish-dry-run-cli-final.json`, `publish-dry-run-plugin-final.json`). `evidence-set.ts:20-22`
  treats a repeated `gateId` as _duplicate or contradictory_ and forces `INSUFFICIENT`.
- Six of the 17 files carry no `gateId`/`outcome` at all (`doc-lint-*`, `jsr-audit-*`,
  `source-format-final-*`); they are structured tool reports, not `run-gate.ts` receipts. Passing
  them to the evaluator throws before it can score.

Decisively, the subset **hides no failure**. Every excluded receipt that _is_ a durable receipt is
also `PASS` at the same content head (`publish-dry-run-cli`, `publish-dry-run-plugin`,
`netscript-jsr-specifiers`, `publish-assets`, `quality-scan-repo`). The two excluded structured
reports that _do_ carry failures — `doc-lint-plugin-final.json` with `totalErrors: 15` — are the
pre-existing JSR baselines the RFC carries forward openly (see JSR section). Scoping removed
duplicates and non-receipts, not red evidence. `worklog.md#s4-binding-evidence` states this
explicitly and records a copyable reproduction command.

## Content-head provenance

`git log --name-status 01e0960..04d431028 -- receipts/` shows **no `M` (modified) entries** — every
receipt was added exactly once and never edited afterwards. The receipts were introduced in
`c987f009e`; the subsequent `04d431028` touched only `context-pack.md`, `drift.md`, and
`worklog.md`. The S4-F1 repair therefore changed the _description_ of the evidence set and not one
byte of the evidence. Gates attest the content being evaluated.

## RFC contract against issue #1502

Every decision #1502 demands is made in normative prose, not asserted. Verified section by section:

| #1502 required decision                        | RFC location                                                                 |
| ---------------------------------------------- | ---------------------------------------------------------------------------- |
| Typed command descriptors                      | `PluginCliCommandDefinition` and descriptor invariants — RFC:310-368         |
| Nested routers                                 | `children` + two-phase router/collision contract — RFC:322, 372-395          |
| Help / completion                              | pure static projection, explicit v1 bound — RFC:397-411                      |
| Error ownership                                | diagnostic tuple, failure union, host redaction/exit mapping — RFC:413-467   |
| Plugin discovery                               | explicit pointers, no `node_modules` scan — RFC:617-671                      |
| Async bootstrap                                | five-step selected-handler sequence + terminable boundary — RFC:673-709      |
| Isolation                                      | per-invocation boundary and attribution — RFC:711-717                        |
| Collision behavior                             | six fatal classes, both owners named — RFC:383-390                           |
| Deterministic ordering                         | total sort order; load order never decides — RFC:392-395                     |
| Plugin-absent UX                               | `plugin-absent` vs `handler-unavailable` separation — RFC:718-730            |
| Generator ownership without host internals     | `PluginCliGeneratorFactory`, `workspace:read` only — RFC:732-787             |
| Transactional output                           | explicit state machine `planned…committed`/`recovery-required` — RFC:797-833 |
| Preview / no-write                             | preview stops after `validated`, zero side effects — RFC:807-811             |
| Doctor integration                             | seven check classes, no implicit repair — RFC:850-867                        |
| Capabilities                                   | five-token tuple, per-capability bounds table — RFC:483-615                  |
| Manifest / pointer ownership                   | dual declaration, byte-equivalence rule — RFC:835-848                        |
| Compatibility w/ frontend/SDK/runtime/DevTools | five-row authority matrix — RFC:876-901                                      |
| #904–#908 migration/supersession               | per-issue disposition table — RFC:903-924                                    |

The RFC's non-goals (RFC:60-67) are explicit about what it does _not_ decide, and
`## Unresolved
questions` (RFC:1111-1116) bounds residual discussion to items that cannot change
ownership. That is a decided contract, not a deferred one.

## Internal consistency of the public API — re-derived, not trusted

I extracted every `export`ed symbol from the RFC's TypeScript blocks and every `PluginCli*` /
`PLUGIN_CLI_*` reference in the document, then diffed the sets.

- **43 symbols declared; every one referenced at least twice.** No orphan declaration.
- **Exactly three referenced-but-undeclared identifiers**: `PluginCli`, `PluginCliCommand`,
  `PluginCliResult`. All three are the _existing published_ symbols the RFC discusses as prior art
  and migration targets, and all three resolve in live source — `packages/plugin/src/cli/mod.ts:1-2`
  exports `PluginCliCommand` and `PluginCliResult` from `./types.ts` and `PluginCli` from
  `./base/plugin-cli.ts`. Correct, not dangling.

### The three prior Tier-A defects — independently re-derived as closed

| Prior defect                                     | Status | Evidence I checked                                                                                                                                                                                                                                                                  |
| ------------------------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Undeclared diagnostic-code type                  | CLOSED | `PluginCliDiagnosticCode` is declared at RFC:433 from the `PLUGIN_CLI_DIAGNOSTIC_CODES` tuple (RFC:416-431) and consumed by `PluginCliFailure.code` (RFC:441)                                                                                                                       |
| "Deeply readonly" returning shallow `Readonly`   | CLOSED | `definePluginCliContribution` returns `PluginCliDeepReadonly<TDefinition>` (RFC:334); the type at RFC:260-262 recurses through object properties, and its homomorphic mapped form preserves array-ness as `readonly T[]`. RFC:337-341 separately obliges a runtime recursive freeze |
| Handler-ref template literal admitting traversal | CLOSED | RFC:344-346 states outright that `` `./${string}` `` accepts `./../escape.ts`, and mandates normalization, parent-traversal rejection, and package-containment proof _before any import_. RFC:637-638 extends the same rule to `PluginCliManifestPointer.module`                    |

The `PluginCliCapabilityGrant.denied` dead-field defect is likewise closed, and closed properly
rather than cosmetically: RFC:603-610 records the chosen S2 resolution (a) and states both
invariants — `denied` is non-empty only in the host diagnostic copy inside
`PluginCliFailure.details`, and where the same type reaches `PluginCliInvocationContext.grant` its
invariant is `denied.length === 0` with `granted` element-for-element equal to `requested`. The doc
comment at RFC:274-277 matches.

## Verified factual claims about live code

Every load-bearing claim the RFC makes about the live surface was checked against source at this
head. All hold exactly, including line numbers.

| RFC claim                                                                               | Result                                                                                                                   |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `PluginCliResult` is `{ code: number; message?: string; data?: unknown }`               | exact — `packages/plugin/src/cli/types.ts:12-20`                                                                         |
| `PluginCliCommand` has only `name`, `description`, `run`                                | exact — `types.ts:22-30`                                                                                                 |
| `mountPluginCli` flattens to a `plugin:command` string                                  | exact — `composition/mount-plugin-cli.ts:8` renders `` `${cli.name}:${command.name}` ``                                  |
| public host imports/registers `ai` and `auth` directly at `:17-18,66-72,117-125`        | exact at all three ranges — `public/features/plugins/plugins-group.ts`                                                   |
| local host separately hardcodes `auth` at `:3,81-89`                                    | exact — `local/features/plugins/plugins-group.ts`                                                                        |
| core discovery recognizes only `defineJob`/`defineSaga`/`defineWebhook` at `:4-8,29-31` | exact — `sdk/discovery/ast-extractor.ts` `CONTRIBUTION_BUILDERS`                                                         |
| generic verbs run a package `./cli` subprocess with `-A` at `:96-130`                   | exact — `dispatch-plugin-verb.ts`; both branches pass `-A`                                                               |
| `netscript generate plugins` exposes `--dry-run`, `--project-root`, `--verbose`         | exact — `generate-plugin-registries-command.ts:51-53`                                                                    |
| `netscript plugin doctor` accepts `--project-root` and `--resource`                     | exact — `doctor-plugin-command.ts:56-61`; `--resource` is described as the diagnostic-evidence receipt, matching RFC:866 |
| installer manifest schema is top-level `.strict()`                                      | exact — `packages/plugin/src/protocol/manifest.ts:288`                                                                   |
| plugin package has 13 export-map entries                                                | exact — 13 keys in `packages/plugin/deno.json`                                                                           |
| `@netscript/cli` has three export-map entries                                           | exact — `.`, `./scaffolding`, `./testing`                                                                                |
| `@netscript/cli` has `isolatedDeclarations` disabled                                    | exact — `compilerOptions.isolatedDeclarations: false`                                                                    |
| `quality:scan:repo` returned zero findings with seven allowances                        | exact — receipt stdout `{"ok":true,…,"findings":[],"allowCount":7}`                                                      |
| S2 head `7a5eb580a` cited for the audit                                                 | real ancestor commit; the cited line numbers hold both there and at HEAD                                                 |

The RFC's own honesty check at RFC:938-944 — that a clean `quality:scan:repo` proves the scanner's
current rules and **not** the absence of direct command coupling — is correct and is the right call.
I confirmed the scanner's roots do not include a direct-registration rule.

## Compatibility, deferred work, and the duplicate audit

**Board reconciliation is real, not a plausible table.** I queried all 16 cited issues against live
GitHub. Every state and topic matches the RFC's assertion:

- `#904`–`#908` all OPEN, titles matching their assigned dispositions (mount-children contract;
  async bootstrap/isolation/absent UX; doctor-checks + installer tooling; deploy manifest triad;
  plugin CLI children).
- `#1093` OPEN — "let third-party plugin factories participate", matching "removal of the hardcoded
  builder table". `#1473` OPEN — "enforce path containment and scoped generator subprocesses".
  `#1474` OPEN — "make plugin manifests forward-compatible before pointer fields". `#1475` OPEN —
  "generate the contribution registry transactionally". `#1476` OPEN — "diagnose the six
  contribution states in plugin doctor". `#1477` OPEN — "generate the DevTools host and CLI command
  group". `#946` OPEN, `#1354` OPEN.
- `#424` CLOSED `NOT_PLANNED` — matches "(closed) … do not revive". `#745` CLOSED `COMPLETED` —
  matches "enforcement precedent". `#1542` OPEN, and its title ("quality:gate roots omit published
  packages") confirms the RFC's characterization as scan-root coverage rather than the rule-shape
  gap.

The specific claim that `#1474`'s wording is stale is also true: its body still frames the decision
as `BLOCKED on owner fork F-3` with the `.passthrough()`-vs-`schemaVersion: 2` choice unmade, so
"amend its now-stale 'owner fork' wording" (RFC:956) is accurate and actionable.

Deploy `#904`–`#908` supersession is concrete enough to act on: each row states what is superseded,
what remains deploy-owned, and RFC:916-918 states plainly that **no issue closes merely because this
RFC merges** and that bodies must be amended before implementation. RFC 0003 and RFC 0005 claims
spot-check accurate against those documents (RFC 0003 carries
idempotency/outbox/audit/receipt/same-commit laws; RFC 0005 carries `ContributionEnvelope`,
quarantine, byte-identical, replace-set, family/major).

S2/S3 deferrals are declared as gaps, not left implicit: `## Non-goals` (RFC:60-67), the explicit
"does not file" statement (RFC:1000-1005), and RFC:1038-1040.

## JSR and publish implications — baselines carried honestly

No existing failure is relabelled as success.

- **15 private-type findings**: `doc-lint-plugin-final.json` reports
  `totalErrors: 15,
  totalPrivateTypeRef: 15, combinedExitCode: 1`. The RFC (RFC:980) carries this
  as a _measured baseline_ and a required implementation exit, not a pass.
- The RFC's specific example verifies: `./src/cli/mod.ts` has exactly 1 private-type-ref, and
  `packages/plugin/src/cli/application/scaffold-plan.ts:15-22` shows `applyScaffoldPlan` accepting
  `readonly ScaffoldArtifact[]` where `ScaffoldArtifact` is imported from
  `../../adapter/item/artifact.ts` and is not re-exported. Exactly as described.
- **Four missing `@module` tags**: I enumerated all 13 plugin export-map entrypoints; exactly four
  lack `@module` — `./abstracts`, `./cli`, `./config`, `./testing`. The PR body states four; the RFC
  names `./cli`, the touched subpath its row is scoped to. Both accurate.
- `@netscript/cli` full-map doc lint clean is confirmed — `doc-lint-cli-final.json` reports
  `totalErrors: 0`.

## Fitness Gates

The leaf changes no `packages/**` or `plugins/**` source, so executable F-gates do not apply to it.
The RFC assigns the complete applicable Archetype-4 manifest (F-1…F-19) to each future
implementation child at RFC:1029-1036, with the correct rule that a child may mark one inapplicable
only with a path-based reason in its own locked plan and that **no child inherits another child's
JSR or publish receipt**.

| Gate            | Result                    | Evidence                                                               |
| --------------- | ------------------------- | ---------------------------------------------------------------------- |
| `arch-check`    | PASS                      | `ns1502-s4-final-arch-check`, exit 0 at content head; 0 failures       |
| F-1…F-19 (leaf) | N/A                       | docs-only diff; no source file added, changed, or deleted              |
| F-6 (roadmap)   | PASS_DESIGN_WITH_BASELINE | RFC:972-996 obligations table; measured failures preserved as failures |

## Runtime and Consumer Gates

| Gate               | Result  | Evidence                                                                   |
| ------------------ | ------- | -------------------------------------------------------------------------- |
| `scaffold.runtime` | NOT_RUN | expressly forbidden for this RFC-only leaf; correctly not run and declared |
| `quality:gate`     | N/A     | leaf diff touches no `packages/**` or `plugins/**`                         |
| Consumer inventory | PASS    | `research.md` inventory reconciled against live issues and RFCs 0001-0005  |

## Anti-Pattern Check

| AP                              | Status | Evidence                                                                                               |
| ------------------------------- | ------ | ------------------------------------------------------------------------------------------------------ |
| AP-3 (inheritance as extension) | CLEAR  | RFC rejects extending the abstract `PluginCli` base (RFC:1071-1072) in favour of registration          |
| AP-5 (leaking host internals)   | CLEAR  | ownership table RFC:204-216 keeps Cliffy, registry, bootstrap, transaction private to `@netscript/cli` |
| AP-7 (ambient discovery)        | CLEAR  | explicit pointers only; `node_modules` scanning rejected (RFC:621, 1075-1076)                          |
| AP-9 (silent breaking change)   | CLEAR  | `PluginCliResult` is not redefined; `PluginCliInvocationResult` introduced instead (RFC:469-481)       |
| others                          | N/A    | outside a docs-only leaf's reach                                                                       |

## Arch-Debt Delta

| Metric                | Count | Evidence                                                                       |
| --------------------- | ----- | ------------------------------------------------------------------------------ |
| New entries           | 0     | no `*arch-debt*` path in `git diff --name-only 01e0960..04d431028`             |
| Resolved entries      | 0     | same                                                                           |
| Deepened violations   | 0     | leaf introduces no source change that could deepen a violation                 |
| Unrecorded violations | 0     | RFC records the existing flat/inheritance helper surface as explicit migration |

## Scope and lock integrity

`git diff --name-status 01e0960..04d431028` is 69 paths: 68 under
`.llm/runs/docs-rfc-plugin-cli-contribution--1502/` plus `rfcs/0000-plugin-cli-contribution.md`.
Filtering for `^(packages/|plugins/|deno\.lock)` returns nothing.

| Constraint                        | Result | Evidence                                                                                                                                         |
| --------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| No `packages/**` source change    | PASS   | filtered diff empty                                                                                                                              |
| No `plugins/**` source change     | PASS   | filtered diff empty                                                                                                                              |
| No `deno.lock` churn              | PASS   | filtered diff empty                                                                                                                              |
| No issue filed                    | PASS   | RFC:1000-1005, 1038-1040 propose without filing; no new issue references this run                                                                |
| No central cluster state or #1348 | PASS   | no path outside the leaf run dir and `rfcs/`                                                                                                     |
| No expensive gate run             | PASS   | no `scaffold.runtime` receipt exists in `receipts/`                                                                                              |
| PR never flipped ready            | PASS   | `isDraft: true` at evaluation time                                                                                                               |
| Exactly one `status:` label       | PASS   | `status:impl` only                                                                                                                               |
| `Closes #1502` correct            | PASS   | `extractClosingIssues` on the live body returns `[1502]`; the proposed epic is explicitly unfiled and carries no closing keyword (RFC:1000-1005) |

## DoD truthfulness and acceptance evidence

Nine of ten DoD boxes are ticked. I checked each ticked box against openable evidence; all nine are
true. Box 8 (IMPL-EVAL `PASS` plus Tier-A completion) is correctly left unticked — Tier-A recorded
`[PHASE: REVIEW] [VERDICT: PASS]` at `04d431028` from `topic-features-0.0.7`, a separate session, so
the remaining unmet clause is this pass.

**Acceptance evidence validates against the repository's own validator.** I ran the pure parsers in
`.llm/tools/validation/acceptance-evidence.ts` read-only against the live PR and issue bodies:

```text
parseAcceptanceEvidence(pr).warnings        => []
acceptanceCheckboxes(issue #1502)           => 5 boxes
validateEvidenceMapping(1502, boxes, entries) => OK, mapped boxes [1,2,3,4,5]
```

All five `acceptance-evidence` entries map 1:1 to real acceptance boxes with non-empty, openable
evidence, and no entry asserts not-yet-done work. No box is ticked without evidence — the #260
failure class is not present.

## Findings

| Severity | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Evidence                                                                                                                                                                      | Required action                                                                                                                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| medium   | The PR body attributes a measurement to a receipt that does not contain it, taken at a different head. The Validation section reads "`check` — [receipt](…/check-final.json); 1,033 files, 9 batches, 0 failed". `check-final.json` has `stdout.bytes: 0` and an empty stdout tail; its stderr records the task was short-circuited `(cached, inputs unchanged)`, so it produced no selection report at all. The figures 1,033/9/0 appear only in `check-cli-plugin-cycle1.json`, whose `invocationId` is `ns1502-plan-fix1-check-cli-plugin` and whose `gitHead` is `d71b78c31` — the cycle-1 verdict-only head, not the content head. Note `worklog.md:190` attributes the same figures **correctly** to `receipts/check-cli-plugin-cycle1.json`, so the run's authoritative journal is right and only the merge-facing body is wrong.                              | `receipts/check-final.json` (`stdout.bytes`, `stderr.tail`); `receipts/check-cli-plugin-cycle1.json` (`gitHead`, `stdout.tail`); `worklog.md:190`; PR #1651 body § Validation | Correct the PR body before `status:ready-merge`: either drop the figures from the `check` row or attribute them to `check-cli-plugin-cycle1.json` at `d71b78c31`. Body-only edit; no RFC, receipt, or source change. |
| low      | The binding `check` receipt is a Deno task input-cache hit, and no run artifact says so. `durationMs: 51` with `stderr` ending `(cached, inputs unchanged)`, versus `71003 ms` for the equivalent uncached cycle-1 run. The receipt honestly preserves the cache marker in `stderr`, and the result is _semantically valid_ — the leaf's diff contains no TypeScript, so the checked input set genuinely did not change — but a reader comparing a 51 ms `check` to a 71 s one has no note explaining it.                                                                                                                                                                                                                                                                                                                                                             | `receipts/check-final.json` `durationMs`/`stderr.tail`; leaf diff contains no `.ts`/`.tsx` path                                                                               | Add one line to `worklog.md#s4-binding-evidence` recording that `check` was a valid cache hit and why the inputs are provably unchanged. Non-blocking.                                                               |
| low      | A guard term in the capability-grant computation cannot narrow any grant. RFC:595-597 computes the grant as the intersection of the command's declared request, "the installed manifest pointer's advertised maximum", host policy, and invocation authorization. But RFC:636 defines the pointer's `capabilities` as _the sorted union requested by every command_, and RFC:649 and RFC:855 make registry generation and doctor enforce pointer/descriptor capability **equality**. Since any single command's request is a subset of that union, the pointer term is provably vacuous for every command by the time a fresh registry can be invoked. This is the same predicate-can-never-fire class as the fixed `denied` field, though here it is host-internal prose rather than a plugin-visible type, and redundancy in a security intersection is defensible. | RFC:595-597 vs RFC:636, 649, 855                                                                                                                                              | State the intent in the RFC — either declare it deliberate defense-in-depth against a tampered registry, or narrow the pointer's documented role to install-time policy. Carry into child C2/C3.                     |
| low      | A stated guarantee is not enforced by the signature that provides it. RFC:182-183 promises that preview "renders the same canonical plan" as apply. But `PluginCliGenerationPlanner` receives the full `PluginCliInvocation` (RFC:774-776), which includes `readonly preview: boolean` (RFC:497), so a planner can branch on preview and return a different plan; the host never compares the two, because preview and apply are separate invocations. RFC:810-811 says "plugins never parse or implement the flag themselves", but the resolved flag is still handed to plugin code, and no descriptor invariant forbids branching on it.                                                                                                                                                                                                                            | RFC:182-183, 497, 774-776, 810-811                                                                                                                                            | Add an explicit planner obligation ("a planner must not vary its plan on `invocation.preview`") to the RFC's validation-obligation list, or omit `preview` from the generation path. Carry into child C6.            |
| info     | Tracking issue `#1502` still carries `status:research` while the RFC is at draft-PR/impl phase; `rfcs/README.md:48` says the tracking issue carries the phase `status:*` label. The leaf was explicitly forbidden to relabel, so this is coordinator-owned board hygiene, not a leaf defect.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `gh issue view 1502 --json labels`; `rfcs/README.md:48`                                                                                                                       | Coordinator relabels at its discretion. No leaf action.                                                                                                                                                              |

## Lessons for Promotion

| Lesson                                         | Pattern                                                                                                                                                                                                                                                                           | Applies to         | Confidence |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ---------- |
| A gate receipt can be a cache hit              | A durable receipt records `exitCode 0` faithfully even when the task was short-circuited by input caching. Evidence review should read `durationMs` and the `stderr` tail, not just `outcome`, and the journal should say when a pass is a valid cache hit.                       | all harnessed runs | high       |
| Name the contracted receipt set, never glob it | A per-scope gate run repeated at workspace and member level produces duplicate `gateId`s, which `evidence-set.ts` correctly reads as contradictory. Naming exact `invocationId`s plus a copyable reproduction command is the honest form — and the reviewer must still recompute. | all harnessed runs | high       |
| Prose figures drift from their receipts        | The authoritative journal was right and the PR body wrong for the same number. When a body restates a receipt measurement, it must name the receipt that actually contains it.                                                                                                    | all harnessed runs | medium     |

## Verdict

| Field   | Value  |
| ------- | ------ |
| Verdict | `PASS` |

**Rationale.** The approved scope is complete and the work is sound where it counts. The RFC decides
every contract #1502 demands rather than asserting it, and its claims about the live system are
accurate to the line number — I re-verified the four hardcoded-coupling rows, the legacy
`PluginCli*` shapes, both export maps, the `isolatedDeclarations` posture, the manifest strictness,
both CLI command flag sets, and the quality-scan baseline against source. The public API is
internally consistent: 43 declared symbols, no orphans, and the only undeclared references are the
three live published symbols the RFC is migrating. I re-derived all four previously-found defects
rather than trusting they were closed, and all four are genuinely closed — the diagnostic-code type
is declared, the deep-readonly return type is properly recursive, the traversal-admitting template
literal is disclosed with a binding validation obligation, and the `denied` field now has a stated
non-empty context. Sufficiency was recomputed from the receipts, not read: the six contracted
`invocationId`s return `SUFFICIENT` with `reasons: []`, every receipt is `PASS`/exit 0 with
`gitHead == actualGitHead == 120859d5c…` and no mismatch override, and no receipt was ever modified
after being written. Naming that subset is honest scoping — I confirmed the glob fails on a
mechanical duplicate-`gateId` rule and that the subset conceals no failing evidence, while the JSR
baselines it excludes are carried in the RFC as failures rather than relabelled as success. Board
reconciliation against live GitHub matched on all 16 issues. Scope and lock integrity are clean, the
drift assertion about advanced `main` was tested and holds, and the acceptance-evidence block
validates against the repository's own validator with all five boxes mapped.

The findings do not meet any `FAIL_FIX` condition: no required gate fails, no evidence is missing,
no path or link is wrong, and no false-done state is present. The medium finding is a mis-sourced
figure in the PR body's prose — the gate it describes genuinely passed at the content head, and the
run's own `worklog.md` attributes the number correctly — so it is a body correction, not work to
redo. The three low findings are refinements for the implementation children and one journal note.
Returning this run to implementation over them would misstate the state of the work.

**PASS is conditional on one pre-merge correction**: the PR body's `check` row must stop attributing
"1,033 files, 9 batches, 0 failed" to `check-final.json`. That edit is body-only and does not
disturb the content head, any receipt, or the evaluated RFC.
