use harness

You are the **implementation agent for slice S1** of NetScript PR #1444 (closes #1443 and #1445), a
P0 blocking `rickylabs/eis-chat#157`. You implement one slice and stop. You do **not** self-certify:
the Tier-A supervisor reviews your work and makes the sign-off commit.

## SKILL

Activate these before writing code — under-listing is the failure mode:

- `netscript-harness` — run-loop, slice discipline, gate evidence, the no-self-certification rule.
- `netscript-doctrine` — `packages/plugin` is **ARCHETYPE-4** (DSL/Builder), `packages/cli` is
  **ARCHETYPE-6** + `F-CLI-1…31`. Layering, public-surface, and fitness gates.
- `jsr-audit` — you are changing a **published** type surface; the publishability rubric applies.
- `netscript-deno-toolchain` — `deno doc` to inspect the public surface cheaply; lock hygiene.
- `netscript-tools` — the scoped check/lint/fmt wrappers are the only trustworthy verdict source.
- `netscript-cli` — the CLI install/maintainer surface you are touching.
- `netscript-pr` — the per-slice PR comment format.
- `rtk` — prefix read-heavy `git`/`grep`/`ls`; `rtk proxy` for `deno task` runs.

## Pre-flight

```bash
cd /home/codex/repos/ns-1443-plugin-ai-orchestrator
rtk git status --short --branch
rtk git log --oneline -3
```

Branch `orchestrator/1443-plugin-ai-next-canary`. **Do not** fetch, reset, or rebase. Do not touch
`.llm/runs/**` — those are the supervisor's.

## Read first

`.llm/runs/orchestrator-1443-plugin-ai-next-canary--supervisor/plan.md` — plan **v6**. You implement
**S1 only**, per §"Architecture decisions — LOCKED" D1 and the S1 row of §"Commit slices". Also read
`research.md` addendum **A-4** for the maintainer chain.

## The slice

**D1 — the manifest protocol gains an atomic service shape.**

In `packages/plugin/src/protocol/manifest.ts`, the four service fields become an
**all-present-or-all-absent** group:

- `provider.defaultServiceEntrypoint`
- `officialSource.serviceEntrypoint`
- `officialSource.serviceConfigKey`
- `officialSource.servicePort`

Express it as a Zod refinement/union over the **existing** `.strict()` objects. A partial
combination is rejected with a named, actionable error. Requirements:

- **No new exported symbol** and no change to the export list.
- **No slow type** — `deno publish --dry-run` must pass **without** `--allow-slow-types`.
- Keep the explicit type annotations on `PluginManifestProvider` / `PluginManifestOfficialSource`.

**Then make every consumer compile and behave.** The normalization boundary is
`normalizeManifestProvider` (`install-plugin.ts:590-628`): the protocol's `string | undefined`
becomes `null` for `PluginKindProvider.defaultServiceEntrypoint: string | null`
(`plugin-kind.ts:76`). Do the conversion **once**, there.

Consumers to sweep, all in this slice:

| Consumer | Location |
| --- | --- |
| provider normalizer | `install-plugin.ts:618` |
| appsettings entry builders | `appsettings-entry-builders.ts:125-155` |
| duplicate-install guard | `plan-plugin-install.ts:143` |
| reference reconciler (its legacy `officialSource` guard requires `serviceConfigKey`) | `plugin-reference-reconciler.ts:47-58,146-179` |
| registry metadata normalizer | `plugin-registry.ts:220-256` |
| maintainer official-source adapter | `official-plugin-source.ts:93-107,219-251` |
| official-plugin copy | `copy-official-plugin.ts:174-176` |
| official-plugin copier adapter mapping | `official-plugin-copier.ts:11-25` |
| maintainer sync result | `sync-plugin.ts:32-52` |

**Locked service-less representation:** a plugin with no service contributes **no** service
entrypoint, port, or config key to `OfficialPluginSource`, and copy mode **omits the service leg** —
never empty strings, never `0`, never a placeholder.

**Scope discipline.** This slice changes **only** the protocol and its consumers. Do **not** edit any
`plugins/*/scaffold.plugin.json` (that is S3), do not remove the `/services` fallback (S2), and do
not touch doctor, the E2E, or the AI scaffolder. All six existing manifests must keep parsing
**identically** after your change.

## Required tests

1. A manifest with the complete service quadruple parses exactly as today.
2. A manifest with **none** of the four parses and yields `undefined`/absent service metadata.
3. Every **partial** combination is rejected with the named error.
4. All six checked-in first-party manifests (`plugins/{ai,auth,sagas,streams,triggers,workers}/scaffold.plugin.json`)
   parse to **identical** provider objects and produce **identical** appsettings entries before and
   after — this is the backward-compatibility proof, so make it explicit, not incidental.
5. The maintainer chain represents a service-less plugin end to end, through the public sync result.

## Hard constraints

- **No `any`, no `as unknown as`, no casts, no `// deno-lint-ignore`.** Adding a suppression to green
  a gate is a review-blocking finding, not a pass.
- **No hardcoded plugin names** anywhere host-side (`quality:scan` fails on this; #745 is the
  precedent).
- **Do not delete or skip tests.** If a test must change, explain why in your PR comment.
- **`deno.lock` must not change.** If something forces it, stop and report instead of committing it.

## Gates — run all, paste real output

```bash
deno test packages/plugin
deno test packages/cli   # at minimum the touched consumer + maintainer-sync tests
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root packages/plugin --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root packages/plugin --ext ts,tsx
rtk proxy deno task quality:scan
rtk proxy deno task arch:check
rtk proxy deno task publish:dry-run
```

The scoped wrappers are necessary but **not sufficient** — `quality:scan` and `arch:check` are the
gates that catch the two violation classes the wrappers miss.

## Deliverable

1. Implement S1.
2. Run every gate above and keep the **real** output, including exit codes.
3. Commit on this branch with a message naming what the slice **proves**, not what it contains.
4. Push.
5. Comment on PR #1444 with `**[PHASE: IMPL]**`, the slice scope, commit hash, and the gate evidence
   (`gh pr comment 1444 --repo rickylabs/netscript --body-file <file>`).
6. Report your thread id, the commit hash, and any gate that did not pass.

If a gate fails and you cannot fix it within the slice's scope, **stop and report** — do not widen
the slice, and do not silence the gate. If you find the plan itself is wrong, stop and say so with
evidence; the supervisor would rather rescope than have you improvise.

No praise, no summary of how thorough you were. Evidence only.
