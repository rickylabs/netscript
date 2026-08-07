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

## Explicitly not drift

- #1092's eight-tool consumer boundary remains unchanged.
- #1335/W1-C remains deferred exactly as the current #1328 comment requires.
- No publication, release orchestration, Billing Run, unrelated root formatting, or foreign worktree
  cleanup entered scope.
- The JSR audit rubric was added to the plan because the harness requires it for package waves; it
  authorizes static audit only, not publication.
- No architecture debt is accepted at PLAN-EVAL handoff. Any later divergence must be recorded here
  before implementation continues.
