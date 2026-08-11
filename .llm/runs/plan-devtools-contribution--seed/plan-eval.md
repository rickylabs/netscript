# PLAN-EVAL — plan-devtools-contribution--seed

PLAN-EVAL-VERDICT: FAIL_PLAN

- Plan evaluator session: Codex separate evaluator session (session id not exposed), 2026-08-11
- Evaluated commit: `b7cd6206762bc8f7a681526a993082c20e4cddfc`
- Baseline: `main` @ `2256a67bf`
- Run: `plan-devtools-contribution--seed`
- Surface / archetype: planning-only RFC describing a proposed contribution core, DevTools host,
  Archetype-5 plugin, and Archetype-6 CLI additions; the proposed core's archetype is not yet validly
  locked
- Scope overlays: `SCOPE-docs.md` + `SCOPE-frontend.md`

## Checklist results

| Plan-Gate item | Result | Evidence / location |
| --- | --- | --- |
| Research present and current | **PASS** | `research.md` exists, records the `2256a67bf` re-baseline and three changed assumptions, and links 26 findings to the committed corpus. Independent checks confirmed the `.strict()`/schema-version finding, the whole-filesystem Deno grant, the CLI contribution-merger omission, three hard-coded Vite aliases, the 16-of-36 `arch:check` census, the unexported SSE primitives, and the SDK/telemetry public surfaces. Live read-only GitHub checks confirmed D-8's #400 comment-thread corrections and current child milestones. |
| Decisions locked | **FAIL** | The evaluated corpus still specifies incompatible identity and ordering contracts: RFC `:963-1000` uses host `mountId` + local slug `id` + separate `apiMajor`; `:1400-1401`, `:1766-1767`, and `:2226` use namespaced/version-suffixed ids; `:1491-1492` retains a flat `(order,id)` panel sort despite the §6 anchor + `(order,mountId,id)` authority. The package boundary is also unlocked: §6 proposes an A1 `@netscript/contribution-core` (`:901-914`), while §13 omits that unit and exports `ContributionEnvelope` from A2 `plugin-devtools-core` (`:3443-3478`). |
| Open-decision sweep | **FAIL** | `plan.md:109-112` redefines a numbered owner fork as a closed decision, but RFC §15.1 explicitly lists F-1…F-8 as "Must resolve before implementation" (`:3573-3584`). F-1 changes the public package/import home, emitter ownership, dependency graph, and #922 re-baseline (`:885-914`), so it is not reversible without rework merely because payload fields are similar. The design packs retain additional implementation-shaping owner questions, including T2 O-2/O-3/O-5, T3 questions 1/3/4/6, T6 questions 2/3/6, and T7 questions 1/5/6. |
| Commit slices (< 30, gate + files each) | **FAIL** | `worklog.md:24-35` has eight run-document slices, but it is stale and does not satisfy the implementation-board plan: slice 5 claims the GLM pass ran although both attempts produced zero tokens; slice 6 names the superseded `doc:lint`/Markdown-format checks; slice 7 names a nonexistent `adversarial.md`; and slice 8 claims filing-manifest/brief/decision files that do not exist. RFC §14's actual implementation slices (`:3528-3562`) name outcomes but not files or an individual proving gate/command per slice. The Stage-D folders contain proposals/open questions only, not the seed-run-required draft epic/issues and agent briefs claimed by `worklog.md:31`. |
| Risk register | **FAIL** | Risks are enumerated, and most future mitigations are honestly marked absent. However R1 calls F-1 reversibility an existing mitigation (`plan.md:149-151`) even though the choice changes public package location/imports and emitter ownership. The significant D-10 missing-design-pass risk is not added to the register, while the plan's Scope still promises a design/UX pack incorporating that pass (`plan.md:31-33`). |
| Gate set selected | **FAIL** | The docs gates are correct and independently green, but the implementation gate set is based only on A2+A5+frontend (`RFC:3491-3505`) while the plan also changes the A6 CLI and names no applicable F-CLI gates. The A2 selection itself does not meet doctrine yet: Archetype 2 wraps one external system behind a package-owned port and named adapter(s), whereas `plugin-devtools-core` is assigned contracts, UI vocabulary, ordering, registry emission, and several internal read ports with no named adapter set (`RFC:3443-3456`; doctrine `06-archetypes.md:41-76`; `ARCHETYPE-2-integration.md`). Until package boundaries/archetypes are corrected, the matrix-derived gate union is not trustworthy. |
| Deferred scope explicit | **FAIL** | Implementation and board filing are explicit deferrals, but a charter-mandated deliverable is missing without an authorized scope change. D-10 correctly records that the GLM 5.2 pass did not run and that Sonnet scrutiny is not a substitute. `lane-policy.md` has no GLM fallback and invariant 5 requires the pass. Honest escalation is necessary but is not equivalent to completion or an owner waiver. The absent Stage-D draft epic/issues/agent briefs and Stage-H-prep manifest/brief artifacts are likewise neither present nor authorized out of scope. |
| jsr-audit surface scan (pkg/plugin) | **FAIL** | RFC §13.2 checks explicit returns, closed unions, `any`/casts, and hard-coded plugin names (`:3464-3489`), but that is only a partial risk list. The required planned-surface rubric also covers package metadata/name/description, complete export and subpath map, publish include/exclude and file list, ESM-only shape, module docs for every entrypoint, symbol docs/examples, README, provenance, and runtime compatibility (`.agents/skills/jsr-audit/SKILL.md:41-71`). Package ownership is unresolved, so even the metadata/export audit target is not stable. |

## Open-decision sweep (evaluator-run)

The following decisions would force rework if deferred past this gate:

1. **F-1 / O-2 / O-3 — spine and package ownership.** Option (a), (b), or (b′) changes package
   creation, public specifiers, emitter ownership, dependencies, and the #922 plan. Similar payload
   fields do not make those implementation artifacts byte-identical. Resolve the option and the
   neutral package's name/home before slicing.
2. **Identity and ordering.** Select one identity law and propagate it through §§6–9, G-9, and the
   T2/T3/T5/T6/T8 packs. Select one ordering law and remove the surviving `(order,id)` variants.
3. **Manifest evolution (F-3/O-5).** `.passthrough()`/reserved catchall versus schema v2 has
   different old-CLI behavior and tests. Choose the compatibility contract before the pointer and
   emitter slices are considered locked.
4. **Package/archetype boundary (F-8).** Decide whether the neutral contracts are an A1 package,
   what external system (if any) makes `plugin-devtools-core` A2, where adapters live, and which unit
   owns host/runtime behavior. Then derive A1/A2/A3/A5/A6 gates from that result.
5. **Scope-changing owner questions.** Read-only v1 versus pulling `action` forward, DT1 auth versus
   hard refusal, import-mode versus copy-mode after the island probe, and framework-wide INV-2
   retrofit versus separate debt all change files, dependencies, and acceptance gates. Resolve them
   now or explicitly remove the affected work from the first implementation tranche with stable
   entry criteria.

Board-only scheduling/disposition choices may remain owner-ratified at Stage H if their deferral
cannot change implementation contracts. They must not be used to classify the architectural forks
above as closed.

## Independent gate results

| Check | Result | Evidence |
| --- | --- | --- |
| Immutable input | **PASS** | Initial and pre-write `git rev-parse HEAD` = `b7cd6206762bc8f7a681526a993082c20e4cddfc`; worktree initially clean. |
| RFC links | **PASS** | `deno task docs:links --root docs/architecture/rfc --pretty` exited 0: 1 doc, 0 broken links, 0 broken anchors, 0 orphans. |
| Docs accuracy | **PASS** | `deno task docs:accuracy` exited 0. |
| Lock hygiene | **PASS** | `deno.lock` SHA-256 was `d4d00f600bd9cc9ae3c468e46bb2fa603e578da31a383ce13fdc110917fef35a` before and after `deno doc` and both gates. |

## Citation and claim spot-check

### Checks that passed

- **D-6 / D-9:** `PluginInstallerManifestSchema` pins the schema version at
  `packages/plugin/src/protocol/manifest.ts:271` and the top-level `.strict()` is exactly `:283`.
- **D-7:** `installed-runtime-registry-generator.ts:416-417` passes bare `--allow-read` and
  `--allow-write`. `deno help run` confirms the path values are optional; absent values grant global
  filesystem access. No `--allow-net`, `--allow-env`, or `--allow-run` occurs in that argv path.
- **D-8:** read-only GitHub API checks found the owner-authored `CR-DDX-HOSTAGNOSTIC` comment at
  `2026-07-06T12:30:28Z`, the `CommandInvokePort` acknowledgement two seconds later, and the
  owner-ratified train comment at `2026-07-19T14:40:43Z`; sampled children #410/#432/#551 are on
  `0.0.15` and #400 remains on `Backlog / Triage`.
- `deno doc --filter TelemetryQueryPort packages/telemetry/query.ts` confirms seven methods.
- `deno doc --filter CreateServiceClientOptions packages/sdk/src/ports/service-client.ts` confirms
  no authorization/header option.
- The three Vite aliases are exactly at `vite.config.ts.template:20-32`; `mergeContributions`
  omits `cli` at `contribution-merger.ts:8-26`; the SSE functions exist at `sse.ts:148,339,416` and
  are absent from the package export map; `arch:check` names 16 roots while 36 package/plugin units
  have `deno.json`.

### Checks that failed or exposed residual drift

- D-9 is correct in `drift.md`, but the RFC still cites `.strict()` as line 282 at
  `RFC:183,386,1660,2048,3400`; only `RFC:1044` acknowledges the correct `:283` anchor.
- The Stage-F grep fix was not propagated to §6: `RFC:856-857` still claims the broad
  `grep -rn "devtools\|DevTools" packages plugins docs/site` returns zero, but the literal command
  finds two `packages/fresh-ui/deno.lock` hits. The scoped `-rniE` source-only command elsewhere does
  return zero.
- The strong data-plane statement at `RFC:1720-1729` says no manifest field accepts a URL/path and
  the target vocabulary is closed, while `DevToolsLink` retains
  `{ target: 'external'; href: string }` at `RFC:1531`. If links are outside the security claim,
  narrow the claim; otherwise remove or constrain the arbitrary URL arm and add its gate.
- The UNPROVEN discipline is otherwise explicit and substantially honest: threats T-1…T-10 are
  labelled at `RFC:2193-2208`, and gates G-1…G-9 are named. The residual identity conflict means
  G-9 is not implementable consistently, and the URL contradiction means the stated confused-deputy
  invariant is not yet a coherent contract.

## Verdict

The Plan-Gate is not cleared. No board filing may occur from this evaluation.

### Required fixes

1. **Lock the architecture before re-evaluation.** Resolve F-1/O-2/O-3 and all other
   implementation-shaping owner forks listed above. Update `plan.md` so "closed" means decided,
   not merely recommended pending owner choice.
2. **Reconcile one contract corpus.** Pick one identity and one ordering model; update §§6–9,
   the public API sketch, G-9, and every affected design pack. Remove the surviving compound-id,
   `(order,id)`, and package-home variants. Re-run a cross-file search proving no third form remains.
3. **Correct doctrine selection and gates.** Re-draw the package boundaries, justify each archetype
   against doctrine's actual trigger, and include the complete matrix union, the A6/F-CLI surface,
   frontend/browser gates, quality gates, consumer gates, and any A3/F-13 trigger.
4. **Replace the slice plan with implementation-ready PR slices.** Keep fewer than 30; for every
   slice name exact files/roots, the contract it introduces, and the command/manual gate that proves
   it. Make W0 probe outcomes explicit dependencies. Bring `worklog.md` current and remove stale gate
   and filename claims.
5. **Complete the planned-surface JSR audit.** After package ownership is locked, document metadata,
   exports/subpaths, README/module/symbol docs and examples, publish filtering/file list, ESM shape,
   provenance/runtime compatibility, slow-type risk, and the full-export `doc:lint`/publish gates.
6. **Satisfy or explicitly waive the GLM requirement.** Fix the design-lane launcher and run the
   mandated GLM 5.2 pass with dispositions, or obtain an explicit owner amendment/waiver of the
   charter and lane-policy invariant before another Plan-Gate. Sonnet Stage-F scrutiny is useful but
   is not the required GLM evidence.
7. **Complete the seed design deliverables.** Add the claimed draft epic/issues, per-issue agent
   briefs, and one-shot filing manifest (or record an owner-authorized seed-contract amendment),
   while preserving the no-board-mutation boundary.
8. **Repair citation and security-claim residue.** Correct every `:282` anchor, the broad §6 grep,
   and the arbitrary-URL versus no-URL invariant. Re-run the manual citation sweep and record it in
   the current worklog.

## Notes

The independent docs gates being green does not cure a Plan-Gate failure: they prove link and
discoverability mechanics, not that the architecture decisions are closed or mutually consistent.
