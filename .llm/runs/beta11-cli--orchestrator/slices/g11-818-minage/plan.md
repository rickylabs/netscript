# Plan: scoped lockstep minimum-dependency-age exemption (#818)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `beta11-cli--orchestrator/slices/g11-818-minage` |
| Branch | `fix/818-min-dep-age-lockstep` |
| Phase | `plan` |
| Target | `packages/cli` generated workspace, plugin dispatch, agent init, and aligned docs |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `docs` |

## Archetype

Archetype 6 is the smallest fit because this change alters a published binary's process dispatch,
scaffold output, and agent-host command argv. The docs overlay applies to the CLI README and public
site explanation. No new folder, port, registry, command, or public type is introduced.

## Current Doctrine Verdict

Doctrine file 10 still records `@netscript/cli` as **Restructure**, while the debt registry records
the bounded Archetype-6 promotion as closed. This slice follows the current A6 vertical feature
shape and does not attempt a doctrine rewrite. Existing `cli/maintainer-mode-mixing`, permissions,
and public-doc completeness debt is unchanged.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A2 | The security boundary must remain simple: exact lockstep exceptions, not a hidden global bypass. |
| A6 | Any argv/config helper must encode the tested NetScript lockstep policy rather than rename a primitive. |
| A7 | Use Deno 2.9's native `minimumDependencyAge` object form and `deno run`. |
| A8 | Keep policy constants in the kernel and feature-specific argv builders with their colocated tests. |
| A9 | Preserve the Archetype-6 command/adapters boundary and generated-output consumer gates. |
| A11 | The variation is named: lockstep first-party vs explicitly non-lockstep/third-party package. |
| A14 | Full command arrays and parsed generated JSON are regression fitness functions. |

## Goal

Freshly generated NetScript projects can resolve the matching release train immediately for
scaffold, first-party plugin verbs, and agent-init MCP startup, while Deno's 24-hour age policy
continues to protect every third-party dependency.

## Scope

- Add an exact-version NetScript lockstep exclusion inventory and `P1D` policy to JSR-mode root
  workspace generation.
- Route only release-matched first-party plugin CLI calls through a single explicit `deno run`
  resolver; keep third-party and explicitly different NetScript versions on `deno x`.
- Apply the same direct resolver shape to the dedicated AI plugin command.
- Make `agent init`'s MCP argv explicitly load the generated root config.
- Add semantic regression tests at each command/config builder.
- Document the Deno 2.9 24-hour window, exact-version exception, and unchanged third-party policy.

## Non-Scope

- No Deno upgrade/backport, upstream patch, trust-policy change, or global environment override.
- No exemption for npm, `@std/*`, Cliffy, Zod, or any other third-party package.
- No behavior change for third-party plugin executables or explicitly non-lockstep NetScript pins.
- No release cut, JSR publish, tag push, canary, stable publish, merge, or milestone closure.
- No #824 board filing or ratification action.

## Hidden Scope

- The exclusion inventory must include connector packages and transitive release-train packages, not
  only the four imports currently emitted in the root scaffold.
- Direct JSR execution must use the proven CDN `cli.ts` path because not every connector exports a
  `./cli` subpath.
- The MCP host argv must include an absolute project config path; relying only on host CWD would
  leave the acceptance path nondeterministic.
- Generated policy is workspace-root-only; member configs must not duplicate or override it.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Use `minimumDependencyAge`, object form `{ age: "P1D", exclude: exactVersionedNetScriptConstraints }`. | This is Deno 2.9's sanctioned parser surface and preserves the 24-hour third-party policy. |
| D2 | Never use `minimumDependencyAge: 0` or blanket `--minimum-dependency-age=0` in shipped project/product flows. | Either form would disable protection for third-party resolution in the process. |
| D3 | Emit the policy only for JSR-mode scaffolds. | Local-source workspaces do not resolve fresh release-train packages and should not carry registry policy. |
| D4 | A lockstep plugin is first-party and resolves to exactly `NETSCRIPT_RELEASE_VERSION`; only that case uses direct `deno run` plus explicit project config. | Unversioned first-party inputs are pinned by the CLI; an explicitly different version is not lockstep and remains protected. |
| D5 | Third-party dispatch remains byte-for-byte `deno x -A jsr:<pkg>/cli ...`. | Preserves the existing plugin contract and Deno age policy. |
| D6 | The AI target is `https://jsr.io/@netscript/plugin-ai/<release>/cli.ts`. | This is the #817-proven one-resolver path and does not depend on a missing `./cli` export. |
| D7 | Agent-host configs pass `--config <absolute-project-root>/deno.json` before `-A` and the exact CLI specifier. | Guarantees the scoped workspace policy is selected independently of host CWD. |
| D8 | No new public export or abstraction. Reuse `ProcessPort`, generator constants, and existing feature files. | Avoids AP-9 and keeps the change at established seams. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Exact config key and shape | resolved now | `minimumDependencyAge.age/exclude`, verified against Deno 2.9.3 schema/parser and official docs. |
| Scope wildcard vs exact constraints | resolved now | Exact versioned constraints only; no wildcard or unversioned organization-wide exemption. |
| `deno x` vs direct run for lockstep | resolved now | Direct `deno run` is required by #817's Deno 2.9.3 causal proof. |
| Canary publication proof | safe to defer | Release-phase evidence only; requires fresh in-turn owner sign-off under the hard stop-line. |
| Deno upstream fixed-version support decision | safe to defer | Product workaround remains valid for supported Deno 2.9.x. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| An exclusion accidentally covers third-party or old NetScript versions. | Generate only exact `jsr:@netscript/*@${NETSCRIPT_RELEASE_VERSION}` constraints; assert full arrays and absence in local mode. |
| A new release-train member is omitted from the finite list. | Derive from the existing scaffold package inventory plus an explicit connector list; add a uniqueness/version-shape test. |
| Direct URL execution diverges from the plugin executable. | Use the root `cli.ts` file already published and proven by #817; assert exact URL and argv. |
| Third-party plugin behavior regresses. | Preserve and assert the existing third-party `deno x` command array. |
| Explicit older first-party pins are silently exempted. | Add a regression proving a non-release version stays on protected `deno x`. |
| MCP host starts outside the project directory. | Write the absolute `--config <project>/deno.json` path into both Claude and VS Code configs. |
| Generated scaffold config is syntactically valid but not consumer-effective. | Parser-level generator tests, full CLI package tests, `scaffold.runtime`, and later owner-authorized fresh canary proof. |
| Existing CLI JSR/doc debt obscures a regression. | Record baseline debt; run full export-map doc lint and publish dry-run and report existing vs new findings honestly. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-2 | risk | Use the native Deno config contract; helper code must encode exact lockstep classification. |
| AP-9 | risk | Do not introduce a generic subprocess/config framework for three bounded builders. |
| AP-11 / AP-25 | avoided | All execution remains behind `ProcessPort`; feature files only build argv. |
| AP-18 | risk | Assert parsed config and complete argv arrays, not giant generated snapshots. |
| AP-19 | risk | README/site docs state the resolver policy and permissions/security boundary. |
| AP-24 | avoided | The lockstep predicate is a closed security rule, not a new open extension axis. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1, F-3, F-5, F-6, F-7, F-8, F-9, F-10, F-11, F-12, F-15–F-19 | yes | `quality:scan`, `arch:check`, scoped wrappers, doc lint, publish dry-run, plus manual no-new-surface review |
| F-CLI-3/4/5/11/16/21/27/28 | yes | Mechanical `arch:check` where covered plus manual path/argv/import inspection |
| Shell-out builder regressions | yes | Focused plugin dispatch, AI command, agent-init, and workspace-generator tests |
| Runtime/consumer | yes | Full CLI package tests and one-pass `scaffold.runtime` before merge-readiness |
| Docs overlay | yes | Source alignment, scope separation, links, terminology, and drift review |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| CLI existing doctrine/public-doc entries | none | No new export, permission, folder, or surface-debt claim. |
| New issue #818 work | none expected | Any new gate violation discovered during implementation triggers rescope/debt review, not silent allowance. |

## Commit Slices

| # | Slice | Proving gate | Files |
| - | ----- | ------------ | ----- |
| S1 | Generated JSR workspaces preserve `P1D` while excluding exact lockstep NetScript constraints. | Focused `generators_test.ts`; config parser smoke; scoped check/lint/fmt for owned CLI roots. | `packages/cli/src/kernel/constants/scaffold/scaffold-workspace-packages.ts`; `packages/cli/src/kernel/templates/workspace/deno-json.ts`; `packages/cli/src/kernel/templates/workspace/generators_test.ts`; run `worklog.md` + `context-pack.md` |
| S2 | First-party lockstep plugin verbs use one resolver; third-party and old-version commands stay protected. | Full command-array tests in dispatch and AI test files; full plugins feature test directory. | `dispatch-plugin-verb.ts`; `dispatch-plugin-verb_test.ts`; `ai-plugin-command.ts`; `ai-plugin-command_test.ts`; run artifacts |
| S3 | Agent-init MCP argv selects the scoped project policy and docs explain the release-day behavior. | Full agent-init tests; docs source-alignment/link checks; CLI README doc lint impact review. | `init-agent.ts`; `init-agent_test.ts`; `packages/cli/README.md`; `docs/site/orchestration-runtime/cli-scaffold.md`; `docs/site/capabilities/agent-tooling.md`; run artifacts |

Each implementation slice is committed, pushed to
`origin/fix/818-min-dep-age-lockstep`, commented on the draft PR with gate evidence, and then paused
for Tier-A review before the next slice.

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Focused builders | `deno test --allow-all <four owned test files>` | Exact scoped argv/config arrays pass; protected paths asserted. |
| 2 | Full touched feature dirs | `deno test --allow-all packages/cli/src/public/features/plugins packages/cli/src/public/features/agent packages/cli/src/kernel/templates/workspace` | All tests pass. |
| 3 | Full CLI package | `deno task --cwd packages/cli test` | All CLI package tests pass. |
| 4 | Scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | 0 findings. |
| 5 | Scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli --ext ts,tsx` | 0 findings. |
| 6 | Scoped format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli --ext ts,tsx` | 0 findings. |
| 7 | Code quality | `deno task quality:scan` and `deno task arch:check` | 0 new findings; existing warnings attributed. |
| 8 | JSR docs/publish | `deno task doc:lint --root packages/cli --pretty`; `deno publish --dry-run --allow-dirty` from `packages/cli` | No new diagnostics; publish dry-run succeeds or only pre-recorded debt is reported. |
| 9 | Consumer runtime | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | One-pass suite succeeds with raw exit code 0. |
| 10 | Fresh release proof | Owner-authorized canary flow per #811/#812, only after fresh in-turn release approval | Scaffold, plugin verb, and agent MCP start resolve within minutes; third-party age gate remains active. |

## Hard Stop-Lines

1. Merge requires CI green + opposite-family eval PASS on the PR. Owner granted standing beta-11
   merge authorization (2026-07-17 in-turn) once that bar is met.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable)
   — owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the
   stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner
   in-turn.

## Drift Watch

- Any evidence that Deno 2.9 ignores versioned `exclude` constraints or explicit config on direct
  `deno run` is significant drift and requires rescope before implementation continues.
- Any call site requiring a blanket flag, generated member-config duplication, or third-party
  exception is architectural drift and must not be improvised.
- Any required change outside the enumerated product/docs paths triggers Plan-Gate rescope.
