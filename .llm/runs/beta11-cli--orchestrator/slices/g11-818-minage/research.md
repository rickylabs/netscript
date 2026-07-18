# Research — issue #818 minimum-dependency-age lockstep

## Re-baseline

- Carried-in sources: live issue #818; merged PR #817 and its committed research; owner-locked
  direction `(a)+docs` in the G11 brief.
- Re-derived against `origin/main` @ `56cf84b5` on 2026-07-18; branch and baseline are identical.
- The parent orchestrator's owner-visible `plan.md` is not present in this worktree. The brief
  contains the locked decision, so the missing cross-peek does not leave an implementation choice
  open and is recorded in `drift.md`.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | Deno 2.9.3 applies a default 24-hour minimum dependency age. The sanctioned project key is root `minimumDependencyAge`, not `min_release_age_days`; the object form accepts `age` and a package-specific `exclude` list. | `deno --version`; `deno run --help`; `packages/cli/assets/schema/config-file.v1.json:88,930`; [Deno configuration reference](https://docs.deno.com/runtime/reference/deno_json/#minimum-dependency-age) |
| 2 | A config containing `{ "minimumDependencyAge": { "age": "P1D", "exclude": ["jsr:@netscript/cli", "jsr:@netscript/plugin-ai"] } }` parses successfully on the repo's Deno 2.9.3. | Local `deno eval --config .llm/tmp/818-min-age-probe.json ...` returned `config-ok`; probe file removed afterward. |
| 3 | PR #817 proved Deno 2.9.3 `deno x` performs an internal `deno run` re-exec that drops both minimum-age and config selections. Direct `deno run` of the exact published `cli.ts` keeps resolution in one process. | PR #817 body; `git show aa14e452:.llm/runs/fix-e2e-prod-inner-min-dep-age--p0-inner-resolution/research.md` |
| 4 | The product call-site inventory deferred by #813/#817 is: `dispatchPluginVerb`, the dedicated AI plugin dispatcher, and `agent init`'s Claude/VS Code MCP argv. | `dispatch-plugin-verb.ts:93-103`; `ai-plugin-command.ts:89-103`; `init-agent.ts:97-127`; #813 committed research |
| 5 | `dispatchPluginVerb` currently pins unversioned first-party packages to `NETSCRIPT_RELEASE_VERSION`, but also accepts explicitly versioned first-party and arbitrary third-party packages. Only the first category is lockstep. | `dispatch-plugin-verb.ts:70-76`; `dispatch-plugin-verb_test.ts` specifier cases |
| 6 | A blanket `--minimum-dependency-age=0` would turn off the resolver policy for every dependency in that process. Deno's package-specific config exclusion can preserve `P1D` for third-party dependencies while allowing exact lockstep NetScript constraints. | Deno configuration reference above; schema `exclude` description at `config-file.v1.json:939-945` |
| 7 | The generated root `deno.json` is the correct policy boundary: Deno applies `minimumDependencyAge` at the workspace root, and the generator already owns JSR-vs-local mode. | `workspace/deno-json.ts:35-74`; [Deno workspace config table](https://docs.deno.com/runtime/fundamentals/workspaces/) |
| 8 | `SCAFFOLD_WORKSPACE_PACKAGES` is the shipped finite inventory for copied NetScript packages. Connector packages must be added explicitly to the release-age exclusion inventory so transitive lockstep packages are covered without a scope wildcard. | `scaffold-workspace-packages.ts:1-34`; package manifests under `packages/*` and `plugins/*` |
| 9 | The AI adapter does not export `./cli`; PR #817's proven direct target is the exact-version JSR CDN `cli.ts` URL. Other first-party connector manifests also publish root `cli.ts`, while third-party dispatch keeps its existing `deno x .../cli` contract. | `plugins/ai/deno.json`; PR #817 command-array regression |
| 10 | The existing public signature of `dispatchPluginVerb` is unchanged; only its process-selection behavior and JSDoc change. No `deno.json` export-map or dependency change is planned. | `deno doc --filter dispatchPluginVerb packages/cli/mod.ts`; `packages/cli/deno.json` |

## Real mechanics selected by research

1. Generated JSR-mode workspaces write `minimumDependencyAge: { age: "P1D", exclude: [...] }`,
   where each exclusion is an exact `jsr:@netscript/<name>@${NETSCRIPT_RELEASE_VERSION}` constraint.
   Local-mode scaffolds do not write this policy.
2. Lockstep first-party plugin dispatch uses `deno run --config <project>/deno.json -A` with the
   exact-version `https://jsr.io/@netscript/<package>/<version>/cli.ts` target. Explicitly
   non-lockstep first-party versions and third-party packages keep `deno x` and the age policy.
3. The AI command uses the same one-resolver direct URL/config shape.
4. `agent init` writes MCP argv with explicit `--config <project>/deno.json` before the pinned
   `jsr:@netscript/cli@<release>` main module, so host CWD cannot silently drop the scoped policy.

## jsr-audit surface scan

- Surface scanned: `packages/cli/deno.json`, `packages/cli/mod.ts`, and
  `deno doc --filter dispatchPluginVerb packages/cli/mod.ts`.
- Planned export-map/dependency changes: none.
- Slow-type risk: no new exported type or signature. Existing CLI public-doc/private-type debt is
  not deepened; final gates still include full export-map doc lint and package publish dry-run.
- Publish-shape risk: implementation files and README already fall under the CLI publish include;
  tests and harness artifacts remain excluded.

## Open questions

- None that force rework. A real canary publish proof remains release-phase evidence and is blocked
  by the explicit owner-sign-off stop-line; it is not authorization for this agent to publish.
