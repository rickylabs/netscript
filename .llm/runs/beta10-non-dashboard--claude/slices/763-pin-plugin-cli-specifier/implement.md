use harness

## SKILL

Run under `netscript-harness` + `netscript-doctrine` + `netscript-tools` (+ `netscript-cli` for the
CLI surface). Read `AGENTS.md` and the relevant doctrine before changing framework code. If a skill
is not mirrored into `.claude/skills/`, read `.agents/skills/<name>/SKILL.md` directly.

You are a **Tier-D implementation lane**. You do not self-certify: a separate opposite-family session
reviews this slice. Commit and push your branch; do **not** open a PR and do **not** merge.

# Slice brief — #763: pin the plugin CLI JSR specifier

**Worktree:** `/home/codex/repos/b10-763-pluginspec`
**Branch:** `fix/763-pin-plugin-cli-specifier` (base: `feat/beta10-integration` @ `6c0dd587`)
**Issue:** #763 (`type:fix`, `area:cli`, `priority:p1`, milestone `0.0.1-beta.10`)

## The bug is already root-caused. Do not re-derive it.

`@netscript/cli@0.0.1-beta.9`'s `scaffold.plugin.ai.lifecycle` E2E gate fails **only in published
mode**, fast-failing in 124 ms with:

```text
error: Could not find version of '@netscript/plugin-ai' that matches specified version constraint '*'
```

**Cause.** A bare `jsr:@netscript/plugin-ai` specifier carries no version constraint, so Deno
resolves it as `*` — and **semver `*` does not match pre-release versions**. Every
`@netscript/plugin-ai` version is a pre-release (`0.0.1-beta.4 … 0.0.1-beta.9`), so its `meta.json`
reports `"latest": null` and resolution fails outright. The package **is** published; the specifier
simply cannot select it.

It is published-mode-only because locally the workspace import map (and the local-source E2E lane)
short-circuits JSR entirely, so the unpinned specifier is never resolved against the registry.

Verify for yourself in one command before changing anything:

```bash
deno x -A jsr:@netscript/plugin-ai/cli --help    # reproduces the error
curl -s https://jsr.io/@netscript/plugin-ai/meta.json   # "latest": null
```

## Two places emit the unpinned specifier

**1. The E2E gate (the failing one).**
`packages/cli/e2e/src/application/gates/scaffold/plugin-install-gates.ts` (~line 114) hardcodes
`'jsr:@netscript/plugin-ai/cli'` in the `PACKAGE_SOURCE.JSR` branch.

**2. The framework dispatch path — the user-facing bug.**
`packages/cli/src/public/features/plugins/dispatch/dispatch-plugin-verb.ts` (~line 69):

```ts
export function resolvePluginCliSpecifier(pkg: string): string {
  const spec = pkg.startsWith('jsr:') ? pkg : `jsr:${pkg}`;
  return spec.endsWith('/cli') ? spec : `${spec}/cli`;   // never pins a version
}
```

`dispatchPluginVerb` shells `deno x -A <spec> <verb>`. Any caller passing a bare package name
produces an unpinned specifier — so **a real user running any framework plugin verb against a
published pre-release plugin hits the identical wall.** This is a live user-facing bug, not just a
test defect. Fixing only the test would leave the actual defect shipped.

## Scope

1. **`resolvePluginCliSpecifier`** — when the incoming spec has **no version**, pin it. NetScript
   packages are lockstep-versioned, so pin an unpinned `@netscript/*` plugin to the CLI's own
   version. Find how the CLI already knows its version (there is a version constant — e.g. what
   `netscript --version` prints, and `GENERATED_PLUGIN_VERSION` in
   `packages/cli/src/public/features/plugins/new/new-plugin-use-case.ts` is prior art for pinning a
   generated dep). Do **not** invent a new version source.
   - Already-pinned specs (`@scope/pkg@1.2.3`, or a `jsr:` spec that already has `@version`) must
     pass through **unchanged**.
   - Third-party (non-`@netscript/`) packages: leave unpinned — we cannot know their version, and
     they are not lockstep with us. (If you disagree after reading the code, say so in the PR rather
     than silently widening scope.)
2. **The E2E gate** — pin the specifier it builds. The suite already knows the published CLI version
   (it installs `jsr:@netscript/cli@<version>`); reuse that, do not hardcode a literal.
3. **Tests** —
   - unit test on `resolvePluginCliSpecifier`: unpinned `@netscript/*` → carries a version;
     already-pinned → untouched; `/cli` suffix handling preserved; third-party → unchanged.
   - a guard test asserting **no `jsr:` specifier the CLI shells out to is version-less**, so this
     cannot regress silently while we are on a pre-release line.

## Boundaries

- Do **not** change the release/publish tooling, `deno.json` task definitions, or anything under
  `.llm/tools/`. The publish is fine; the specifier is the bug.
- Do **not** touch `plugins/dashboard`, `tools/design-sync/`, or any dashboard/DDX issue.
- Do **not** modify `packages/mcp/tests/fixtures/**` — those fixtures are intentionally malformed and
  are already excluded from the lint/fmt selections.

## Gates (run before you report)

```bash
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx
deno task lint
deno task fmt:check
cd packages/cli && deno test --allow-all
deno task quality:scan
deno task arch:check
```

The full published-mode E2E (`e2e:cli:prod`) is the real proof but is expensive and needs the
published artifact; do not run it. State clearly in your report that the published-mode gate has
**not** been re-run, so the reviewer knows what is still unproven.

## Report back

Commit, push the branch, and report: files changed, the exact specifier now emitted for a pinned vs.
unpinned vs. third-party input, gate verdicts, and anything you found that contradicts this brief.
Do **not** open a PR and do **not** merge. Do not self-certify — a separate session reviews this.
