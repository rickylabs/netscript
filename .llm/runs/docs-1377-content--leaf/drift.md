# Drift — docs-1377-content--leaf (PR-C of #1377)

Append-only. Everything found and **not** fixed in this slice, with why.

## DR-1 — `reference/index.md` claimed pages are generated; nothing generates them

**Severity:** significant. **Status:** fixed in this PR (in scope per the brief).

`docs/site/reference/index.md:6-7` asserted the reference pages "are generated from the source code
with `deno doc`, so they always describe the published surface". No script writes into
`docs/site/reference/`; every tooling reference to that path reads or checks. Evidence in
`worklog.md` § D-1. Corrected.

## DR-2 — The same false generation claim survives inside two existing pages

**Severity:** minor. **Status:** NOT fixed — out of this slice's footprint.

- `docs/site/reference/plugin-ai-core/index.md:10-11` — "This page is generated from the package's
  public surface with `deno doc` (US-2)."
- `docs/site/reference/plugin-auth-core/index.md:9-10` — "This page is generated from the package's
  public surface with `deno doc`."

Both are the per-page form of DR-1 and are equally untrue. The four pages added here deliberately say
"written against the package's published exports and its `deno doc` surface" instead. Left alone
because editing pages this slice does not otherwise touch widens the diff into files a sibling slice
or PR-D may reach; a one-line correction each is enough whenever someone owns them.

## DR-3 — `docs:accuracy` hardcodes a short reference path, and #1377 does not name it

**Severity:** significant for PR-D. **Status:** NOT fixed — PR-D owns the decision.

`.llm/tools/docs/check-accuracy-and-discoverability.ts:126` reads
`'docs/site/reference/sagas/index.md'` and `:29` reads `'docs/site/reference/sdk/index.md'`. #1377
names only `.llm/tools/release/publish-readiness.ts` as the gate hardcoding a path. If the
path-convention decision moves the IA to the gate's name-exact rule, this file breaks too, along with
`publish-readiness.ts:302` and every inbound link. Carried forward from the orchestrator's research
(C-3) and re-confirmed by reading the file in this worktree.

## DR-4 — `deno fmt` covers READMEs by explicit path but never `docs/site/**/*.md`

**Severity:** minor, process-relevant. **Status:** NOT a defect to fix here.

**Corrected after S2/S3.** The first recording of this entry (during S1) over-generalized from one
observation; the measured behaviour is:

- `docs/site/**/*.md` — `deno fmt <path>` exits **1** with `No target files found`, because
  `docs/site/deno.json` `fmt.exclude` lists `**/*.md` and an **exclude beats an explicit path
  argument**. `docs/site/_plugins/check-source-format.ts` is the real formatting authority here.
- `README.md` files — `deno fmt <path>` **does** format them (exit 0). The root `fmt.include` is
  `packages/**` / `plugins/**` TypeScript only, so a bare `deno fmt` never *discovers* a README, but
  an explicit path argument is honoured because nothing excludes it.

Consequence: READMEs are formattable but not covered by any discovery-based gate, so their formatting
is enforced by nobody. Both READMEs touched by this PR were formatted explicitly and re-verified with
`--check`. Worth deciding deliberately rather than discovering again — flagged for the orchestrator,
not changed here (fmt config is not this slice's scope).

## DR-6 — `docs:readme:check` is red on `main`

**Severity:** minor. **Status:** NOT fixed — pre-existing and out of scope (#767).

`deno task docs:readme:check` exits **1** at the baseline commit and still does:

```text
A2 README standard FAIL - 1/36 non-conformant:
  packages/bench/README.md
    - [install-section] missing '## Install' section
```

`packages/bench` is `"publish": false`, so this is not a publish blocker. README-standard
conformance is #767's territory and is explicitly out of this slice's scope; recorded rather than
swept in so the audit does not read it as regression from this PR.

## DR-7 — `emit` is implemented on three adapters but unreachable from the CLI

**Severity:** significant. **Status:** NOT fixed — source, not docs. Found while verifying #1377's
deploy claims.

`ROUTED_OPERATIONS` (`packages/cli/src/public/features/deploy/target/target-deploy-command.ts:15-23`)
is `['plan', 'up', 'down', 'status', 'logs', 'rollback', 'secrets']` — **no `emit`**. The router
generates a subcommand only for an operation in that list that the adapter also advertises (`:59`).

But `emit` **is** advertised and implemented:

- `AspireComposeDeployTarget` — advertises it (`:64-71`), implements it (`:96`);
- `AspireCloudDeployTarget` — advertises it (`:125`), implements it (`:162`);
- `ServiceDeployTarget` — advertises it (`SERVICE_DEPLOY_OPERATIONS`, `:21-29`).

It even has a router description (`OPERATION_DESCRIPTIONS.emit = 'Emit deployment artifacts'`, `:28`).
The only other `'emit'` under `packages/cli/src/public/` is in a test. So every adapter's `emit`
handler is dead code from the CLI's point of view, and `deploy list` reports an operation the user
cannot invoke — the same class of honesty defect that `service-deploy-target.ts:14-20` explicitly
guards against for `rollback`/`secrets` ("LD-4: omit rather than silent no-op"), applied in reverse.

Either `emit` belongs in `ROUTED_OPERATIONS` or it should stop being advertised. Deciding that is a
source change and out of this slice's scope. The documentation this PR writes describes the
**reachable** surface and does not mention `emit` as a verb.

## DR-8 — The research's C-2 correction was itself inaccurate

**Severity:** significant, process. **Status:** resolved by measurement; recorded so the audit can
check the reasoning rather than the conclusion.

The orchestrator's research told this slice that `reference/cli/commands.md:209` ("the same
three-verb lifecycle — `plan`, `up`, `down`") was "contradicted by the same array" and must be fixed,
and that the docker/compose surface "is six" against #1377's "five".

Measured (see `worklog.md` § D-5): the CLI verb surface is the **intersection** of the adapter's
advertised `operations` with the router's `ROUTED_OPERATIONS`, and `emit` is absent from the latter.
So the cloud targets expose exactly three verbs — `:209` was **correct**, and applying the instructed
fix would have replaced a true statement with a false one. Docker/compose expose five, matching
#1377's original wording; the research's "six" counts advertised operations, not commands.

Only the `cli-reference.md:246-249` "not wired — they only print help" claim was actually false, and
that one is fixed. `:209`'s three-verb statement is preserved verbatim inside a rewritten section.

## DR-5 — Maintainer CLI reports `version('1.0.0')`

**Severity:** significant. **Status:** NOT fixed — source, not docs.

`.../maintainer-command-tree.ts:32` sets `.version('1.0.0')` while the public tree uses
`CLI_PACKAGE_VERSION`. Carried in from the orchestrator's research (item 9). The brief explicitly
routes this here rather than to a fix: it is framework source, and this run authors documentation
only. Needs a WSL Codex slice.
