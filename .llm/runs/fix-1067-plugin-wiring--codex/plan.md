# Plan: order-independent plugin wiring and truthful diagnostics

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1067-plugin-wiring--codex` |
| Branch | `fix/1067-plugin-wiring` |
| Phase | `plan` |
| Target | CLI plugin lifecycle, plugin-streams producer, official plugin diagnostics/acceptance tests |
| Archetype | 6 CLI/Tooling primary; 5 Plugin connectors; 3 Runtime/Behavior for producer failure semantics |
| Scope overlays | service (AppHost runtime truth) |

## Archetype and Doctrine Verdict

Archetype 6 governs install/generate/doctor command flows. Archetype 5 governs official manifests and
doctor contributions. Archetype 3 governs the long-lived durable producer failure boundary. The
current doctrine verdict keeps sagas/streams connector shapes, flags CLI historical restructure debt,
and requires explicit crash boundaries (A13) plus semantic fitness tests (A14). This slice does not
attempt the recorded CLI or connector redesign debts.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1 | The reconcile and AppHost snapshot contracts precede implementation. |
| A7 | Use JSON/process and existing filesystem/platform primitives; no bespoke runtime framework. |
| A10 | Inject doctor runtime inspection rather than reading global process state in the use case. |
| A13 | Missing stream discovery and unhealthy runtime resources are explicit failures. |
| A14 | Permutation, failing doctor, missing URL, clean consumer, and dependency-mode tests are fitness functions. |

## Goal

Make plugin wiring converge to the same appsettings bytes regardless of install order, make missing
durable-stream wiring fail immediately and actionably, make doctor report running AppHost truth, and
add only the missing acceptance evidence for #1014/#1015/#1017.

## Scope

- Declare real `streams` edges for official durable-stream producers.
- Reconcile `PluginReferences(entry) = declared edges(entry) ∩ installed resource keys` across all
  installed plugin/background entries after every install and before Aspire helper regeneration.
- Reject producer construction immediately when no streams URL is discoverable.
- Add injectable AppHost resource inspection to doctor with named missing/unhealthy/not-running
  diagnostics and named Zod fields.
- Add focused acceptance tests for clean public schema fragments, published dependency-mode saga
  registry startup, and all four no-samples scaffolders.

## Non-Scope

- #1064/#1065/#1066 saga engine/store/runtime changes.
- #1064–#1066 workspace `/home/codex/repos/ns004-sagas`, shared demo worktrees/processes/containers.
- A 0.0.5 redesign of plugin dependency identity, doctor telemetry transport, or saga registries.
- PR creation/editing/comments; the owner’s supervisor owns the PR.

## Hidden Scope

- Both public and local/maintainer plugin install paths must share the reconcile invariant.
- `service generate` and direct Aspire regeneration must invoke the same reconcile operation.
- Generated embedded/template assets may require regeneration if a generator source changes.
- Permutation evidence must compare stable plugin/background JSON bytes, not object equivalence.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Manifest declarations are the source of desired official edges; appsettings resource keys are the installed set. | Prevents dangling references and order coupling. |
| D2 | Reconcile all plugin and background entries at install/generate boundaries; never retro-wire only the newly installed dependency. | Order independence by construction. |
| D3 | Sagas and triggers declare `streams`; dangling declarations are omitted until `streams` is installed. | Source inspection proves both are producers. |
| D4 | Resolve the stream base URL synchronously in producer construction and pass it into async connect. | Missing configuration fails the dependent process before any write can queue/drop. |
| D5 | The producer error names the absent `streams` plugin reference and tells the user to install streams and regenerate service/Aspire wiring. | Acceptance requires actionable ownership/fix. |
| D6 | Doctor consumes an injected AppHost inspection result with distinct `not-running` and `running(resources)` arms. | Testable separation of absence from unhealthy runtime state. |
| D7 | Resource comparison uses declared config names and reports each missing/unhealthy resource by name. | Direct acceptance wording. |
| D8 | Residual issue work is test-only unless current-main evidence genuinely lacks the behavior. | Avoids re-fixing merged PRs. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Stable Aspire JSON shape adapter location | must resolve now | Inspect existing process adapters and choose the narrowest CLI kernel adapter before Slice 2. |
| Whether workers also needs a `streams` edge | safe to defer | The headline permutation and dependent producer acceptance names sagas; adding unrelated manifest behavior needs separate evidence. |
| Startup network reachability timeout | safe to defer (0.0.5 candidate) | This slice fails on absent discovery; redesigning network connection lifecycle exceeds scope. |
| Published-package test transport availability | must resolve now | Prefer existing dependency-mode fixture/task; if registry publication cannot be reached, record a real blocked consumer gate rather than substitute local imports. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Reconcile removes explicit valid user references | Track desired declarations plus explicit install request metadata and filter only against installed resource keys; cover with tests. |
| Resource identity differs from plugin canonical name (`workers-api`) | Build an installed-key inventory from both `Plugins` and `BackgroundProcessors`; tests cover service/background pairs. |
| AppHost CLI exits zero when none is running | Parse content/state, never infer health from exit code. |
| Strict producer creation breaks tests relying on silent drops | Replace the explicit silent-drop test with synchronous rejection and preserve aborted-network tests using a configured URL. |
| Residual saga test touches concurrent runtime files | Stop if implementation requires `plugins/sagas/src/**` beyond allowed doctor spec/manifest; keep new evidence outside owned runtime code. |
| E2E starts foreign resources | Use canonical suite cleanup and leak ownership reporting; never touch named foreign containers/processes. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-3 / AP-11 | risk | One reconcile policy and injected ports; no duplicated install-order patches. |
| AP-13 | existing | Replace warn-and-drop missing URL behavior with an explicit crash boundary; do not broaden console telemetry debt. |
| AP-18 / AP-19 | risk | No new slow public types or type-erasing casts. |
| AP-21–25 | risk | Keep CLI feature logic in application/adapters and composition declarative. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| Static/F-19 | yes | Scoped check/lint/fmt wrappers on touched roots, `--ext ts,tsx`. |
| F-3/F-CLI boundaries | yes | `deno task arch:check`. |
| Code quality | yes | `deno task quality:scan`; zero new ignore/cast findings. |
| F-6/F-7 | yes for publish surfaces | jsr audit/doc lint and published/dependency consumer tests. |
| F-10/F-13 | yes | permutation, failing doctor, producer failure, registry runtime tests. |
| Runtime/Aspire | yes | `scaffold.plugins --cleanup --format pretty`; inspect artifact contents. |

## Arch-Debt Implications

No new debt is planned. Existing `plugin-streams-core` AP-13 console warning debt remains only for
other runtime warnings; this slice removes the missing-URL warn/drop case. Any network startup
timeout redesign is a named 0.0.5 candidate, not absorbed here.

## Validation Plan

| Order | Gate | Command/check | Expected result |
| --- | --- | --- | --- |
| 1 | baseline acceptance | Focused existing doctor, registry, schema, and no-samples tests | Verify merged boxes and identify exact missing tests. |
| 2 | red permutation | Run new permutation test on branch, then stash source/test changes and run against `origin/main` | Branch passes; main produces a pasted mismatch failure. |
| 3 | slice tests | `deno test --minimum-dependency-age=0` on touched package/plugin/CLI test files | All focused behavior passes, including deliberately failing doctor contribution. |
| 4 | scoped static | Three `.llm/tools/run-deno-*.ts` wrappers with touched roots and `--ext ts,tsx` | Structured summaries show no errors/diffs. |
| 5 | framework quality | `rtk proxy deno task quality:scan`; `rtk proxy deno task arch:check` | Artifact summaries pass or identify only accepted pre-existing debt. |
| 6 | package/plugin tasks | Relevant `deno task check` and `deno task test` from touched units | All touched units pass. |
| 7 | install-order E2E | `deno task e2e:cli run scaffold.plugins --cleanup --format pretty` | Suite artifact shows zero failed gates and cleanup ownership. |
| 8 | formal evaluation | Separate Qwen PLAN-EVAL before implementation and IMPL-EVAL after all slices | `PASS`. |

## Drift Watch

- Any need to edit saga runtime/store/engine files is a stop condition.
- Any reconcile implementation that needs hardcoded official plugin names is architectural drift.
- Any missing published artifact that prevents a true dependency-mode test is significant drift.
