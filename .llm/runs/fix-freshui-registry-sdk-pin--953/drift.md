# Drift Log: fresh-ui registry SDK subpath dependencies (#953 / #956)

Drift is append-only.

## 2026-07-31 — Filed root cause is necessary but not sufficient

- **What:** The owner's root-cause comment on #953 identifies the two stale `beta.10` pins in
  `packages/fresh-ui/registry.manifest.ts`. Correcting them does **not** fix the reported failure.
- **Source:** `/tmp/sdkprobe`, three `deno check` runs against published JSR (recorded in
  `worklog.md` § Progress Log).
- **Expected:** Pin `beta.10` → `beta.11` restores subpath resolution.
- **Actual:** With the value at `jsr:@netscript/sdk@0.0.1-beta.11/desktop`, importing
  `@netscript/sdk/desktop` still fails — `Unknown export './desktop/desktop'`. The CLI's
  `mergeDenoJsonImports` strips the subpath when deriving the import-map *key* but keeps it in the
  *value*, so Deno appends the subpath twice. The failure is version-independent; the stale pin
  made it louder (beta.10 has no `./desktop` export at all) and supplied the `beta.10` string in
  the reported error text.
- **Severity:** significant
- **Action:** fix — the run fixes both the merge and the pins. Recorded in the PR body so the issue
  is closed against the actual cause.
- **Evidence:** `packages/cli/src/kernel/application/ui/registry-deno-json.ts:22-26,41-51`;
  `git log -S'"./desktop"' -- packages/sdk/deno.json` → `e193e018c` (beta.11).

## 2026-07-31 — #956's MCP observation does not reproduce on main

- **What:** #956 reports "the MCP server advertises version `beta.9`".
- **Source:** `packages/mcp/deno.json:3`, `packages/mcp/src/publish-assets.generated.ts:5`.
- **Expected:** A `beta.9` literal somewhere in the MCP version surface.
- **Actual:** Both read `0.0.1-beta.11`. The observation was made against a running/published
  artefact, not against `main`; nothing on `main` to fix.
- **Severity:** minor
- **Action:** accept — reported in the PR body rather than silently dropped.
- **Evidence:** `grep -n version packages/mcp/deno.json`.

## 2026-07-31 — Release bump cannot see stale pins in TypeScript

- **What:** The beta.11 cut should have caught `beta.10` residue and did not.
- **Source:** `.llm/tools/deps/bump-version.ts:41-66` (`findVersionResidue`), `:86-113`
  (`discoverVersionFiles`).
- **Expected:** `prepareRelease` throws on version residue after the bump.
- **Actual:** `findVersionResidue` inspects only `*.json` files and `deno.lock`
  (`if (!entry.path.endsWith('.json') && relativePath !== 'deno.lock') continue;`), and
  `discoverVersionFiles` rewrites only workspace manifests, `deno.lock`, and
  `scaffold.plugin.json`. A pin inside a `.ts` file is invisible to both. The nearest source-level
  guard, `version-drift_test.ts`, matches only `0.0.1-alpha.\d+` and only walks
  `packages/cli/src/**`.
- **Severity:** significant
- **Action:** fix — the currency rule added to `check-netscript-jsr-specifiers.ts` covers
  `packages/**` + `plugins/**` source and runs in `ci:quality`, so the defect is caught per-PR
  rather than only at a cut. Blind whole-file rewriting during `version:bump` is deliberately not
  adopted (plan § Open-Decision Sweep).
- **Evidence:** `deno task check:netscript-jsr-specifiers` passed on `main` with the defect present
  (`scanned=2206 allowances=1 failures=0`).

## 2026-07-31 — Range-pinned @netscript/* specifiers remain

- **What:** Fourteen `@netscript/*` specifiers in framework source carry ranges from older releases
  (`^0.0.1-alpha.12` in six plugin adapters, `^0.0.1-alpha.18` in the contracts scaffold template,
  `^0.0.1-beta.5` in the fresh-ui manifest, `^0.0.1-alpha.0` in the plugin skeleton).
- **Source:** `grep -rEn "jsr:@netscript/[a-z0-9-]+@[\^~0-9]" packages plugins`.
- **Expected:** Every shipped component agrees on the release it belongs to (#956).
- **Actual:** They are skew, not breakage — `^0.0.1-alpha.12` satisfies `0.0.1-beta.11` under
  SemVer, so they resolve correctly today. Grok's "CLI reports beta.11, scaffold pins older" scar
  is this class.
- **Severity:** minor
- **Action:** defer — reported (non-failing) by the new guard so the skew stays visible; follow-up
  issue proposed in the PR. Converting a range to an exact pin changes install resolution over
  time and is a release-policy decision, not a bug fix.

## 2026-07-31 — Evaluator passes not run

- **What:** `run-loop.md` §4 (PLAN-EVAL) and §7 (IMPL-EVAL) require a separate session.
- **Source:** `.llm/harness/workflow/run-loop.md`.
- **Expected:** `plan-eval.md` = `PASS` before the first implementation slice; `evaluate.md` before
  merge.
- **Actual:** This run was assigned to a single session; it cannot self-certify either gate.
- **Severity:** significant
- **Action:** accept + escalate — both recorded `NOT_RUN — requires separate evaluator session` in
  `worklog.md` and stated in the PR body. Not recorded as `PASS`.
