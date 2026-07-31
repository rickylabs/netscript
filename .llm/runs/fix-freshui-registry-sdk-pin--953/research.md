# Research — fix-freshui-registry-sdk-pin--953

## Re-baseline

- Carried-in source: issue #953 body + owner root-cause comment; issue #956 (same defect, second
  face).
- Re-derived against `main` @ `8e0bcef39`, 2026-07-31.
- What changed vs the carried-in version:
  - Everything in the owner's root-cause comment reproduces on `main` unchanged (F1–F4 below).
  - **The filed root cause is incomplete.** Correcting the two version pins does *not* fix the
    reported failure. A second, version-independent defect in the CLI's `ui:add` import-map merge
    breaks every registry dependency that carries a JSR/npm subpath (F5). Proven by execution,
    not by reading (F6).
  - #956's third observation ("MCP advertises beta.9") does **not** reproduce on `main`:
    `packages/mcp/deno.json` and `publish-assets.generated.ts` both read `0.0.1-beta.11`.

## Findings

| #  | Finding | How to verify |
| -- | ------- | ------------- |
| F1 | `packages/fresh-ui/deno.json` maps the SDK subpaths to `0.0.1-beta.11` — correct. | `packages/fresh-ui/deno.json:16-17` |
| F2 | `registry.manifest.ts` still pins `jsr:@netscript/sdk@0.0.1-beta.10/auto-update` (L1284) and `jsr:@netscript/sdk@0.0.1-beta.10/desktop` (L1302). | `packages/fresh-ui/registry.manifest.ts:1284,1302` |
| F3 | `deno task check:netscript-jsr-specifiers` passes (`scanned=2206 allowances=1 failures=0`) — it validates specifier *shape*, never version currency. | `.llm/tools/validation/check-netscript-jsr-specifiers.ts` |
| F4 | `deno task check:scaffold-versions` asserts scaffold pins are *stable*, not *current*, and only reads `SCAFFOLD_VERSIONS` — it never sees the fresh-ui manifest. | `.llm/tools/validation/check-scaffold-versions.ts:60-70` |
| F5 | `mergeDenoJsonImports` derives the import-map **key** by stripping the subpath but leaves the subpath in the **value**: `jsr:@netscript/sdk@X/desktop` becomes `"@netscript/sdk": "jsr:@netscript/sdk@X/desktop"`. Deno then resolves `@netscript/sdk/desktop` to `./desktop/desktop`. | `packages/cli/src/kernel/application/ui/registry-deno-json.ts:22-26,41-51` |
| F6 | Executed proof, `deno check` against published JSR: with the beta.11 pin the merged map still fails — `Unknown export './desktop/desktop' for '@netscript/sdk@0.0.1-beta.11'`. With the value normalised to the package root (`jsr:@netscript/sdk@0.0.1-beta.11`) the same import type-checks clean. | `/tmp/sdkprobe` probe, both runs recorded in `worklog.md` |
| F7 | `@netscript/sdk@0.0.1-beta.10` has **no** `./desktop` or `./auto-update` export at all — the subpaths were added in `e193e018c` (beta.11). So the stale pin points at a version where the subpath cannot exist, which is exactly Gemini's "missing subpath export" report. | `deno check` export list in the F6 probe; `git log -S'"./desktop"' -- packages/sdk/deno.json` |
| F8 | The release bump cannot reach the defect: `discoverVersionFiles` collects only workspace `deno.json` manifests + `deno.lock` + `scaffold.plugin.json`, and `findVersionResidue` inspects only `*.json` + `deno.lock`. A stale pin inside a `.ts` file is invisible to both. | `.llm/tools/deps/bump-version.ts:41-66,86-113` |
| F9 | The nearest existing guard, `version-drift_test.ts`, matches only `@0\.0\.1-alpha\.\d+` and only walks `packages/cli/src/**`. It cannot see `beta.10`, and it cannot see `packages/fresh-ui`. | `packages/cli/src/kernel/constants/version-drift_test.ts:18,20` |
| F10 | `ui:add` writes `item.dependencies` verbatim into the consumer workspace's `deno.json` imports — the manifest is the user-facing artefact. | `packages/cli/src/kernel/application/ui/registry-deno-json.ts:10-39` |
| F11 | Remaining `@netscript/*` skew in framework source is all **range** pins that still resolve to beta.11 (`^0.0.1-alpha.12` in six plugin adapters, `^0.0.1-alpha.18` in the contracts scaffold template, `^0.0.1-beta.5` in the manifest, `^0.0.1-alpha.0` in the plugin skeleton). Cosmetic skew, not breakage. | `grep -rEn "jsr:@netscript/[a-z0-9-]+@[\^~0-9]" packages plugins` |
| F12 | `check:netscript-jsr-specifiers` is already a dependency of `ci:quality`, so a rule added there runs on every PR — not only at a release cut. | `deno.json:22` |

## jsr-audit surface scan

- Surface scanned: `packages/fresh-ui` exports (manifest data only — no export shape changes) and
  `packages/cli` `kernel/application/ui/**` (internal, not part of the CLI's published surface).
- Slow-type / surface risks: none. No exported signature changes; the manifest edit is a string
  literal change inside an already-typed `RegistryManifest`.

## Open questions

- **Q1 — should range pins fail the new guard?** Resolved: no. `^0.0.1-alpha.12` resolves to
  `0.0.1-beta.11` today, so it is skew, not breakage; converting six plugin adapters from a range
  to an exact pin changes install resolution semantics and is a policy decision, not a bug fix.
  The guard *reports* them so the skew stays visible, and a follow-up issue carries the refactor.
- **Q2 — normalise the subpath into the key or out of the value?** Resolved: out of the value.
  Mapping the package root resolves both `@netscript/sdk` and every subpath with one entry, matches
  the Deno convention (`"@std/fs": "jsr:@std/fs@^1"` → `@std/fs/walk`), and removes a latent
  last-one-wins collision when two items depend on two subpaths of one package. Verified in F6.
