# Context pack — canonical resource slice generator (#1354)

## Handoff state

- **Current phase:** PLAN complete. Exactly **one** narrow exact-head PLAN-EVAL is authorized.
- **Implementation status:** not started; this run intentionally changed no product code.
- **Planning baseline:** `38f2ce735` at launch. Cycle-3 delta `b5dcb23e2`; coordinator-directed D3
  narrowing `6b737ab9c`; this harness sync on top.
- **Primary archetype:** 6 (CLI tooling); bounded Archetype-4 Fresh public seam.
- **Scope:** frontend generation + CLI composition.
- **Required next action:** one opposite-family PLAN-EVAL at the exact head, **restricted to the
  formal plan gate and the cycle-1 blockers**. It is not a fresh architecture review and must not
  reopen decisions the 2026-09-02 coordinator ruling settled. On `PASS`, the lane waits only for
  #1664's merge/rebase, then dispatches implementation Slices **A** and **B** in parallel.
- **Cycles 2 and 3 were orchestration defects, not architecture failures** — both re-evaluated a
  byte-identical `b210f9092`. A verdict re-issued against an unchanged head is one verdict observed
  three times, not three findings.

## Three-file planning packet

- `research.md` — rebaselined source/audit findings, #1664 inspection, public-surface/dependency
  audit, and emitted-contract inventory.
- `plan.md` — locked behavior, shared-file reconciliation, source authority, seven bounded slices,
  and gate ownership.
- `context-pack.md` — this handoff.

Do not modify run artifacts belonging to another run. Existing files in this run directory outside
this three-file packet are owner-authored context and were not changed by the planning session.

## Key evidence to retain

1. `generate-group.ts` has exactly three current subcommands: `aspire`, `runtime-schemas`, and
   `plugins`.
2. Exactly one app template contains `withResource` or `withRouteContract`:
   `packages/cli/src/kernel/assets/app/routes/examples/service/index.tsx.template`.
3. The requested seed audits demonstrate the framework-present/generator-absent gap, but their
   zero-occurrence counts are historical. Current init assets now have resources, an inline route
   contract, form, and partial; no re-runnable verb emits them.
4. The current frozen island uses `QueryIsland` plus the compatibility `useQuery` alias and omits
   `initialDataUpdatedAt`. The target must emit `useIslandQuery` and preserve cache age.
5. Fresh already owns sidecar discovery and manifest/routes rendering. Its writer is internal to the
   route manifest module and not exported from `@netscript/fresh/vite`.
6. The CLI currently has no `@netscript/fresh` dependency.
7. #1664 is open. Head at the coordinator ruling was `573d01d35`; it has since advanced to
   `ec9e7048a` (a browser-fixture startup repair). It adds the required `--client` behavior: zero
   fails, one can be used without a flag, multiple without a flag fail closed, and an explicit
   selector must match exactly one exported service. **Because that branch is live, re-derive the
   overlap set against its head at implementation time rather than trusting any snapshot here.**
8. #1664 owns `web-scaffold.ts`, `add-ui-command.ts`, the add-ui input, and the service-query
   template. Its live diff also overlaps the public dependency graph, embedded asset carrier,
   example islands, and E2E gate registries used by later slices. #1354 must wait for its merge,
   rebase, and preserve those changes rather than recreate them.
9. `router.ts` and `utils.ts` are user-customizable shared source. `.generated/manifest.ts` and
   `.generated/routes.ts` are Fresh-derived outputs.
10. No runtime, Aspire, Docker, browser, or CLI E2E command was run or is authorized in a local
    implementation/evaluator lane for this work.

## Locked command contract

```text
netscript generate resource <resource> \
  --app <app> \
  --procedure <procedure> \
  [--client <service>] \
  [--route <route>] \
  [--form] [--partial] [--stream] \
  [--dry-run] [--force] [--project-root <path>]
```

- It is a new `generate` subcommand, not a `ui:add` extension.
- App resolution is reused; the #1664 resolver is the only client selection mechanism.
- Procedure validation happens before output planning and a missing procedure writes nothing.
- The canonical demonstration selects `--partial`; form and stream are independent options.

## Locked safety contract

The operation is fully preflighted before the first write:

- absent leaf → write;
- byte-identical leaf → skip;
- divergent generator-owned leaf → conflict by default, replace only with explicit `--force`;
- unmarked/foreign or `owned-edited` leaf → conflict even under `--force`;
- any conflict or unsupported shared shape → report and write nothing;
- dry-run → report only;
- force never replaces `router.ts` or `utils.ts` wholesale.

**Narrowed by the 2026-09-02 coordinator ruling after a touch-set audit.** Removed: the
`--keep` / `--replace` / `--abort` / `--recover` flags, the crash/recovery journal, the app-scoped
lock, and the backup-rollback promise — their IO adapters appear in **no declared slice touch set**
and they exceed #1354's acceptance. **Explicitly deferred:** process-crash / mid-rename cross-file
atomicity, and concurrent-invocation locking; a crash between renames can leave a partially written
slice and two concurrent invocations are not serialized, with rerun or manual move/rename as the
recovery.

The bar that replaces them: **every pre-apply failure proves zero writes** — validation, Fresh
staging/writer, and shared-source transform failures each occur before the first application write —
and a default conflict exit plus manual move/rename or owned-only `--force` is sufficient.

The proof that matters is a second unchanged run with exit 0 and zero writes, plus negative tests
showing that owned edits, foreign files, missing procedures, ambiguous clients, and late router
conflicts leave the complete app byte-identical.

## Locked source authority

Create one neutral resource template family and one pure `planResourceSlice()` authority. Both the
new command and init's example-service preset consume it. Retire the old duplicate canonical
page/contract/loader/island/form/partial assets. Do not copy or edit #1664's service-query template;
consume the selected generated client/query factory.

Use Fresh declaration Form B:

- `index.route.ts` defines the typed contract;
- `index.tsx` binds `.withRoute(appRoutes.<alias>)` and does not also call `withRouteContract`;
- Fresh's own writer regenerates `.generated/manifest.ts` and `.generated/routes.ts`;
- one bounded `appRoutes` transform inserts a property chain into generated routes, never an inline
  route reference.

State remains unchanged for core/form/partial/stream unless a selected contract explicitly declares
request-state needs. Supported State transforms are bounded and fail closed for customized shapes.

## Coordination and slice order

1. Wait for #1664 merge.
2. Run the single narrow exact-head PLAN-EVAL and obtain `PASS` (this happens while waiting, but
   implementation still waits for #1664's merge/rebase). No further advisory cycle is authorized.
3. Slice A: extract/share #1664 selector, serialized over its two web-scaffold files.
4. Slice B: Fresh manifest public seam and CLI adapter. A/B may run in parallel after merge.
5. Slice C: resource contracts and reconcilers.
6. Slice D: neutral template family.
7. Slice E: command/composition internals, deliberately unregistered.
8. Slice F: init convergence, duplicate retirement, then public command registration.
9. Slice G: generated guidance plus hosted acceptance hook.

Every slice uses `Refs #1354`, describes remaining work, and leaves the issue open. If an expected
touch set grows or a ceiling is exceeded, stop and update the plan before editing.

## Collision-sensitive files

- `packages/cli/src/kernel/application/ui/web-scaffold.ts` — #1664, then Slice A.
- `packages/cli/src/kernel/application/ui/web-scaffold_test.ts` — #1664, then Slice A.
- `packages/cli/src/public/features/ui/add/add-ui-command.ts` — #1664 only; no planned #1354 edit.
- `packages/cli/src/public/features/ui/add/add-ui-input.ts` — #1664 only; no planned #1354 edit.
- `packages/cli/src/kernel/assets/app/routes/examples/service/(_lib)/service-query.ts.template` —
  #1664 only; #1354 consumes its output.
- `packages/cli/src/public/features/generate/generate-group.ts` — Slice F shared registration, after
  init convergence.
- `packages/cli/src/public/features/root/public-command-dependencies.ts` — Slice E composition.
- `packages/cli/src/kernel/assets/manifest.ts` and
  `packages/cli/src/kernel/adapters/templates/scaffold-template-assets.ts` — Slices D/F, serialized.
- `packages/cli/src/kernel/assets/app/router.ts.template`, the app-route seed writer, and route
  template support/tests — Slice F moves init from manual service references/seeds to Fresh
  derivation.
- `packages/cli/src/kernel/assets/embedded.generated.ts` — #1664, then Slices D/F, regenerated from
  the manifest.
- `packages/cli/e2e/src/domain/cli-surface.ts` and
  `packages/cli/e2e/src/application/gates/scaffold/scaffold-gates.ts` — #1664, then Slice G.
- The two `ServiceShowcaseLab*.tsx.template` files — #1664, then Slice F retirement after its
  cache-age behavior has moved into the neutral template.
- Generated-app `router.ts` and `utils.ts` — reconciled at runtime with bounded transforms, never
  replaced.

## Gate ownership

### Local/static implementation evidence

- focused unit/integration tests;
- structured check/lint/fmt wrappers;
- `arch:check` and `quality:gate`;
- Fresh/CLI full-export-map doc lint and JSR audits;
- `deps:why @netscript/fresh`, production install, publish dry-run;
- asset/carrier, emitted-sample, and MCP corpus checks as affected;
- raw git diff/status and review-thread gates.

### Hosted-only evidence

```text
deno task e2e:cli run scaffold.runtime --cleanup --format pretty
```

The hosted lane reports the raw exit code and owns runtime/browser proof. Local author/evaluator
lanes must not start an app, Aspire, Docker, browser, or `e2e:cli`.

## Planning-run validation record

| Evidence                                | Result                                                        |
| --------------------------------------- | ------------------------------------------------------------- |
| Audit sections and live issue read      | PASS                                                          |
| Generate registration count             | PASS: 3                                                       |
| Builder-pair app asset count            | PASS: 1                                                       |
| Focused CLI/Fresh public API inspection | PASS_WITH_WARNING: optional npm/Node types in Vite doc output |
| #1664 selector/owned-file inspection    | PASS, read-only                                               |
| Product tests/static gates              | NOT_RUN: plan-only                                            |
| Runtime/Aspire/Docker/browser/E2E       | NOT_RUN: explicitly prohibited                                |

## Evaluator focus

**Restricted scope, per the 2026-09-02 coordinator ruling.** Judge only:

1. the **formal plan gate** (`.llm/harness/gates/plan-gate.md`) — every checklist box, including the
   Risk register and the Open-decision sweep; and
2. the **cycle-1 blockers** — the one-template-authority claim, optional flag upgrades under the
   narrowed force contract, nested/parameterized route property-chain derivation, source-safe
   State/router transforms, and whether Slice F can remove old copies without losing demo-only
   behavior.

Out of scope: reopening D1-D9, the removed flags/journal/lock/rollback, or the explicitly deferred
cross-file atomicity and concurrency. Those are settled. Late manifest/router failure handling is
judged **only** against the narrowed bar - zero writes on any pre-apply failure - not against
crash-atomic emission, which #1354 no longer promises. A blocking finding updates the plan; it is
not deferred into implementation.
