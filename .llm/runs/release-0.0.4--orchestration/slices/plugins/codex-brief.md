use harness

# Slice: plugin install order-independence, wiring reconcile, and a doctor that can fail

Worktree: `/home/codex/repos/ns004-plugins` · branch `fix/1067-plugin-wiring` · base `origin/main` @
`f663fe0e4`.

## SKILL

Load, in order: `.agents/skills/netscript-harness`, `.agents/skills/netscript-cli`,
`.agents/skills/netscript-doctrine`, `.agents/skills/netscript-tools`, `.agents/skills/rtk`.

## Ground truth already established by the supervisor — do not re-derive, do verify

The merged PRs #1028 (#1017), #1043 (#1014) and #1031 (#1015) are **already on `origin/main`**. Those
three issues are open only because of their **unchecked acceptance boxes** — the ones written so a
happy-path test cannot close them. Your job on those three is the missing *test* evidence, not a
re-fix. Check `git log origin/main` for `2e188bc91`, `8b69d78f0`, `5a1a2d23b` before touching
anything there.

#1067's mechanism is confirmed:

- Plugin dependency edges are declared in `plugins/<name>/scaffold.plugin.json` under
  `officialSource.pluginReferences`. Today: `workers: []`, `sagas: ["workers-api"]`,
  `triggers: ["workers-api"]`, `streams: <check it>`. **No plugin declares a streams edge at all.**
- `packages/cli/src/public/features/plugins/install/install-plugin.ts:155-160` merges
  `plan.pluginReferences` with the *installing* plugin's own declared
  `officialSource.pluginReferences`, then `workspaceMutator.updateAppsettings` writes them onto that
  one entry.
- `packages/cli/src/kernel/adapters/plugin/appsettings-entry-builders.ts:81-88` only ever sets
  `PluginReferences` on the entry currently being built.

So a reference is written once, at the installing plugin's own install time, onto its own entry. A
later install of a dependency never revisits earlier entries. That is the whole defect.

## Slice 1 — #1067 order-independence (p1, the headline)

**Contract first.** Write down what correct wiring is before changing code:
`PluginReferences(entry) = declared edges of that entry's plugin ∩ plugins actually installed`,
recomputed as a **reconcile pass over every installed entry** at the end of *every* install (and on
`netscript service generate` / Aspire helper regeneration). Order-independence must hold **by
construction**, not by a retro-wire patch that still depends on order. If you resolve at generate
time instead of install time, that is acceptable — but the acceptance criterion is literally
*identical `appsettings.json`*, so install must still converge.

Concretely:

1. Declare the missing edge: whichever official plugins produce to durable streams (`sagas`, and
   check `triggers`) must declare the streams edge in their `scaffold.plugin.json`. Read the plugin
   source to decide which genuinely produce — do not guess from the issue text.
2. Add the reconcile pass. A dangling edge (declared but that plugin is not installed) must **not**
   be written; it must be added the moment that plugin is installed.
3. Second acceptance box: a producer with **no reachable streams URL must fail fast** in the
   *dependent* service. Today `[DurableStreamProducer]` warns in another process's startup log and
   then **blocks** on publish while dropping writes. Make the producer error (or fail at startup)
   with a message naming the missing reference and the fix. It must never block indefinitely and
   never silently drop writes. This is in the streams client/producer path — find it, read it, and
   report what you found before changing it.
4. Tests: a permutation test asserting `workers → sagas → streams` and `streams → sagas → workers`
   produce **byte-identical** `appsettings.json` plugin/background entries. This test must fail on
   `origin/main` — prove that by running it against stashed changes and pasting the failure.

## Slice 2 — #1022 a doctor that can actually fail (p1)

Current state on main: `plugins/workers/src/adapter/plugin.ts` and `plugins/sagas/src/adapter/plugin.ts`
already export `DoctorCheckSpec`s, and `doctor-plugin-use-case.ts` runs them via `checkPluginDoctor`.
The tautological `runtimeConfig ? 'healthy' : 'healthy'` is **already gone**. So boxes 1, 2, 3 and 7
look satisfied — **verify each with a test run, do not take my word**.

Remaining unchecked, and these are your work:

- `doctor` validates that each service/resource declared in NetScript config exists on the **running
  AppHost**, reporting missing ones **by name**.
- Config zod parse failures reported as **named field errors**, not a generic failure.
- `doctor` distinguishes **"no AppHost running"** from **"AppHost running but resource unhealthy"** —
  it must not report healthy in both.

Non-negotiable: at least one plugin must contribute a check that **can actually fail**, proven by a
test that **makes it fail**. A check whose only outcome in the test suite is `ok: true` does not
close this issue.

## Slice 3 — residual acceptance on #1014 / #1015 / #1017

For each, the unchecked box only:

- **#1014**: "Clean public-install test asserts the plugin's fragments are present in the root
  schema." Add it.
- **#1015**: "Every saga entrypoint receives an absolute, project-owned registry path/URL from
  generated glue or Aspire environment" and "dependency-mode integration test starts a saga runtime
  from the published package and loads a non-empty registry." Verify the first against the merged
  fix; add the second.
- **#1017**: "The parsed negative flag is threaded into **every** official plugin scaffolder." The
  merged PR fixed the CLI parse. Verify the flag actually reaches workers, sagas, triggers **and**
  streams scaffolders — all four, individually. The issue reproduced 8/8; a test covering two
  plugins does not close it.

If a box turns out to be genuinely satisfied by merged work, say so in the worklog with the test
name and output that proves it, and leave the code alone.

## Boundaries

- **Do not absorb #1064/#1065/#1066.** A concurrent slice owns the saga engine in
  `/home/codex/repos/ns004-sagas`. If you must touch a file that slice likely touches (saga runtime,
  saga store, `plugins/sagas/src/**` beyond the doctor spec and the manifest), **stop and report it**
  rather than resolving it silently.
- Do not expand 0.0.4 scope. Anything that grows into a redesign: name it as a 0.0.5 candidate in the
  worklog and move on.
- No `// deno-lint-ignore` and no `as unknown as` introduced to green a wrapper. Those are
  review-blocking and I will send them back.

## Gates (verify the artefact, never the exit code — never pipe a gate into `tail`)

`deno task check` · `deno task test` for touched packages/plugins · scoped lint/fmt wrappers
(`.llm/tools/run-deno-check.ts` / `run-deno-lint.ts` / `run-deno-fmt.ts`, `--ext ts,tsx`) ·
`deno task quality:scan` · `deno task arch:check`. For install-order evidence:
`deno task e2e:cli run scaffold.plugins --cleanup --format pretty`.

Deno refuses dependencies younger than ~24h — pass `--minimum-dependency-age=0`; note `deno x`
re-invokes in a child that does not inherit the flag.

## Machine is shared

`/home/codex/repos/wave4-deepseek`, `wave4-fable`, `wave4-grok` are live demo runs. Do not touch
those workspaces, containers or processes. Existing containers `redis-wnkhnbqd`, `garnet-fgxbsxkb`,
`postgres-a3084932` are **not yours** — leave them. Prove ownership by path containment before
killing anything. Never kill an `aspire mcp` process.

## Deliverable

Commit per slice with a real message. **Push after each slice** and report the commit hash plus the
gate output you trusted in your worklog. Do not open or edit the PR — the supervisor owns it.
