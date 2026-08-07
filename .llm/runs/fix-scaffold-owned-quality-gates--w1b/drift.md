# Drift: Canary.15 W1-B

## Recorded observations

### Runtime reporter identity mismatch — resolved, no scope change

The broad desired-state runtime status command initially reported `MISSING_IDENTITY` with zero
sessions for the worktree. The worktree-specific canonical Codex status command then identified the
active managed daemon and exactly one working session, matching `codex-thread-ids.md`. No repair or
second session was started. Treat the worktree-specific status as the identity evidence for this
run.

### Diagnostic check ran before DB codegen — research-only sequencing result

The disposable scaffold's first scoped check found four unresolved generated database/Zod symbols
because research intentionally had not run standalone DB codegen. The canonical `scaffold.runtime`
orders `database.codegen` before generated checks. This is not a product defect to hide and does not
change the plan; positive generated-check evidence must follow canonical codegen/registry ordering.

### Expanded AppHost selection exposed two additional generator defects — Slice 2 repair

The first post-codegen/post-registry ten-probe run selected executable `aspire/.helpers/*.mts` as
designed, but its final cleanup check found that generated `config-schema.mts` imports eight schema
values not re-exported by `_aspire-compat.mts`, and generated `register-tools.mts` leaves its
after-resources-created event parameter implicit. These defects were invisible to the prior
TS/TSX-only diagnostic and validate #1328's requirement to cover the default AppHost MTS surface.

Disposition: repair the owning Aspire helper templates/generators and add focused assertions inside
Slice 2, then recreate the disposable full scaffold and repeat codegen, registry generation,
negative probes, and green quality tasks. This stays within the accepted generated-contract scope;
no W1-C inventory, publication, or unrelated AppHost redesign is added.

### AppHost helpers need the native restored TypeScript project — Slice 2 repair

Direct `deno check` of `aspire/apphost.mts` traverses Aspire's generated
`.aspire/modules/aspire.mts` bundle and reports SDK-internal errors, while the native restored
AppHost command (`tsc --noEmit -p aspire/tsconfig.apphost.json`) is green. The generated AppHost
project also listed only the entrypoint and generated SDK modules, so an unreferenced
scaffold-owned helper negative probe could be selected by the quality runner without being
compiled.

The accepted plan explicitly excludes generated bundles and requires every scaffold-owned AppHost
TypeScript/MTS surface to remain in the verdict. Therefore Slice 2 restores Aspire before generated
quality gates, uses its project-local TypeScript compiler for AppHost source, and adds
`.helpers/**/*.mts` to `tsconfig.apphost.json`. The runner still reports the selected product files;
the generated Aspire SDK bundle remains an input to the native project rather than a separately
owned product surface. The deliberate helper negative probe must fail before this repair is
accepted.

The widened project then identified the intentional mixed-runtime exception:
`aspire/.helpers/run-tool.mts` is executed by Deno as a child tool runner, not by AppHost. It remains
selected and checked by Deno, while the AppHost project excludes that one file. This is runtime
classification, not a source-coverage exclusion.

The root workspace configuration also caused `deno lint <selected files>` to pull generated Prisma
dependencies outside the runner's reported selection. The generated runner now invokes Deno lint
with `--no-config` and the exact selected file list. Fresh scaffolds do not define custom lint rules,
so this preserves Deno's recommended lint verdict while preventing the parent workspace and
generated dependency graph from silently widening it; actual lint findings in owned AppHost
templates remain defects to repair.

### Installed smoke self-pinned a host port — Slice 3 repair

The accepted plan expected the installed eight-tool smoke's exact released-CLI fallback to provide
the clone-independent #1024 proof. The unchanged #1092 tool instead passed `--service-port 3001`
to `init`, then its own critical host-port boundary rejected that deliberate literal pin. Exact
stable `0.0.4` reached 22 passing steps before that failure. Exact `0.0.5-canary.14` additionally
reflects the newer resident-AppHost database contract, while the installed tool predates that
sequence. Earlier `0.0.5-canary.5` reached the same 22-step boundary after removing the tool's own
pin, but its published plugin templates still emit the five historical fixed pins.

Disposition: omit the tool's opt-in service-port argument and align its lifecycle with the canonical
runtime suite: standalone DB codegen and registry generation precede validation, Aspire starts
before resident DB commands, and the AppHost restarts after database preparation. Dry-run ordering
assertions lock both repairs. Preserve the exact eight-tool manifest, critical validator,
released-CLI fallback, and all #1092 docs. Do not weaken the validator, compose release versions,
publish a canary, or absorb release orchestration. Current-source runtime proof and the independent
evaluator must see the absence of a published post-fix canary explicitly; this run must not claim an
older published scaffold is clean.

### Merge-readiness pass exposed a stale generated route-reference shape — Slice 3 repair

The first canonical one-pass `scaffold.runtime` reached the deliberate generated-quality matrix
after 22 green gates, then its restored baseline check found that the static
`routes/examples/crud.tsx` template passed the directory node (`routes.examples.crud`) to
`withRoute`. The current Fresh navigation builder requires the node's typed route target at
`routes.examples.crud.$route`. This pre-existing template defect was not visible to the string-only
route-template assertion and surfaced only once the new quality contract checked every generated
TSX route.

Disposition: repair the owning route template, update its focused assertion to lock the `$route`
contract, regenerate the embedded asset, and repeat the one-pass merge-readiness verdict after the
focused test and scoped CLI wrappers are green. Preserve `appRoutes.crudExample` as the live
service-backed CRUD link; changing that public behavior is outside this repair.

### Flow-B runtime fixture used the pre-cleanup service-map name — Slice 3 repair

The repeated one-pass runtime passed the complete negative matrix and generated green quality gates,
then failed when Aspire compiled the post-quality Flow-B fixture mutation. Slice 2 intentionally
renamed the generated background helper's service map to `_services` so default scaffolds with no
service references remain lint-clean. The E2E fixture still injected a reference through the old
`services` name after the quality gates had completed.

Disposition: make the fixture target the generated `_services` contract and add a focused generator
assertion that populated `ServiceReferences` use the same typed parameter. This is proving-tool
drift exposed by the one-pass lifecycle, not a reason to weaken generated checking or reorder the
quality gates.

## Explicitly not drift

- #1092's eight-tool consumer boundary remains unchanged.
- #1335/W1-C remains deferred exactly as the current #1328 comment requires.
- No publication, release orchestration, Billing Run, unrelated root formatting, or foreign worktree
  cleanup entered scope.
- The JSR audit rubric was added to the plan because the harness requires it for package waves; it
  authorizes static audit only, not publication.
- No architecture debt is accepted at PLAN-EVAL handoff. Any later divergence must be recorded here
  before implementation continues.

### Formal IMPL-EVAL classified the canary gap as a deferred release receipt

Separate formal session `49e6c09a-705b-47e4-9598-9b45f932c210` evaluated immutable head
`a02467d8cd28be215855764d163fb60508afe895` and returned PASS with no current-head defects. It
independently confirmed the 76/0 runtime and 1,195-file scoped zero-diagnostic/finding gates.

The authoritative handoff clarifies the release sequence: canary.15 is forbidden until W1-B and
W1-C merge. Therefore #1024's missing published installed-artifact smoke is a deferred release
receipt, not implementation drift and not grounds to create an unpublished substitute. The PR must
reference rather than close #1024 and remain draft at `status:impl` until that later receipt exists.

### Owner relocated the publication observation to milestone 0.0.6

On 2026-08-07 the owner superseded the prior deferred-release disposition. The publication-only
installed-consumer observation is now focused issue #1343 in milestone 0.0.6, not #1024 acceptance.
This follows the #1090 pattern: implemented criteria close in their owning issue, while a future
published-artifact observation remains explicit in a separate verification issue.

Disposition: #1024 retains exactly five completed criteria and links #1343 in non-checkbox
Follow-up prose. PR #1342 closes #1024 and #1328, references rather than closes #1343, removes the
publication observation from its authoritative checklists, and treats #1343 as deferred scope rather
than a merge blocker. This owner-authorized rescope does not alter product code, release order, or
the formal verdict: immutable implementation head
`a02467d8cd28be215855764d163fb60508afe895` retains the separate DeepSeek V4 Flash 0731 max PASS
without a PLAN-EVAL or IMPL-EVAL rerun.

### Clean-clone CI disproved the CRUD leaf `$route` assumption

Ready-head CI run [31173542921](https://github.com/rickylabs/netscript/actions/runs/31173542921),
job [92850482166](https://github.com/rickylabs/netscript/actions/runs/31173542921/job/92850482166),
reported TS2339 from the clean-clone README scaffold: `routes.examples.crud` had type
`RouteReference<EmptySegment, SearchParamInput>`, which has no `$route`. This supersedes the earlier
Slice 3 disposition that treated the CRUD leaf as a directory node. The seeded and regenerated
route contract makes the distinction explicit: `routes.examples` is a directory node with
`$route`; `routes.examples.crud` is the complete leaf reference returned by
`createRouteReference()` and is passed directly to `withRoute()`.

Disposition: correct the owning template and semantic assertion, regenerate the embedded asset, and
prove the exact clean-clone gate plus only the directly relevant Archetype 6 static/quality gates.
Do not weaken W1-B selection or suppress/exclude the route. This is a bounded current-head CI repair,
not architecture debt and not a formal re-evaluation. By explicit owner pace rule, retain the valid
DeepSeek PASS on immutable `a02467d8cd28be215855764d163fb60508afe895` without rerunning
PLAN-EVAL, IMPL-EVAL, or the already-green full `scaffold.runtime`.
