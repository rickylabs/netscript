use harness

# Slice FB5 — fresh-ui generative-ui-renderer (issue #258, epic #238)

You are a Tier-D (WSL Codex) implementation agent for one slice of the `beta6-nondash--supervisor`
harness run. Implement ONE slice, land it clean, open a draft PR. Do NOT self-certify — the Tier-A
supervisor reviews before sign-off, a separate OpenHands session runs IMPL-EVAL, and because this
slice carries **security-critical guards**, an adversarial review runs before IMPL-EVAL.

## SKILL
- `netscript-harness` — per-slice trackability, slice-review gate, Concept of Done, verdict flow.
- `netscript-doctrine` — `@netscript/fresh-ui` archetype + layering (F-3: render/domain logic must
  NOT reach into adapters); AI-plugin flagship-quality mandate (this renderer must meet-or-exceed the
  reference plugins).
- `netscript-deno-toolchain` — `deno doc --lint` (`gate:jsr` bar), `deno publish --dry-run` WITHOUT
  `--allow-slow-types`, `deno doc` to read the `render_ui` schema surface from `@netscript/ai/tools`
  and the existing `ai` collection before writing.
- `netscript-tools` — the scoped `run-deno-*` wrappers are the ONLY gate-evidence source.
- `netscript-cli` — `netscript ui:add ai` surface + scaffold behavior.
- `netscript-pr` — draft-PR process, closing keyword rules, taxonomy + milestone.
- `rtk` / `codex-wsl-remote` — as needed; you ARE the WSL Codex agent (native ext4 worktree only).

## Pre-flight (run FIRST, in the worktree)
```
cd /home/codex/repos/netscript-258-genui
git fetch origin
git reset --hard origin/main
git rev-parse --short HEAD
```
Confirm your deps are on main (both MERGED): FB0 (#253) registered the `ai` collection + chat
primitives in `packages/fresh-ui/registry.manifest.ts` (~L1102-1116), and E4 (#243) exports the
`render_ui` schema from `@netscript/ai/tools`. Read both surfaces with `deno doc` before writing. If
either is missing, STOP and report.

## Task — the consumer end of the generative-UI seam
Add a recursive JSON-tree renderer to `packages/fresh-ui` that maps a `render_ui` payload onto a
CURATED design-system vocabulary. This is the piece that turns an agent tool-call payload into safe,
bounded DOM. Today there is no path from an AI tool call to rendered UI, and hand-rolled agent UIs
(the eis-chat pattern this program retires) inline ad-hoc `switch`-on-type with no depth limit and no
vocabulary whitelist — a malformed or adversarial payload can recurse unbounded or render arbitrary
tags. This slice gives fresh-ui ONE doctrine-owned safe renderer.

### Ships
- A recursive tree renderer, new module `packages/fresh-ui/src/ai/render-ui.ts` (or the equivalent
  island location matching fresh-ui conventions), consuming the `render_ui` schema shape exported
  from `@netscript/ai/tools` (E4) as its INPUT contract (consume the type, do not redefine it).
- A curated DS vocabulary limited to exactly THREE block categories, each mapped 1:1 to existing or
  FB0-registered fresh-ui primitives:
  - **layout** blocks (stack / grid / section-style containers),
  - **viz** blocks (chart / metric-style display primitives),
  - **data** blocks (table / list / card-style structured display).
- Registry entries in `registry.manifest.ts` so the renderer and its block set are discoverable via
  the `ui:add` surface, extending the existing `ai` collection (do NOT create a new collection —
  FB0 already established `ai`).

### Security-critical guards (THE reason this slice exists — build + test both)
- **Depth guard:** a bounded max recursion depth. A payload nested beyond it is rejected/truncated
  (short-circuit to a safe fallback), NEVER infinitely recursed. Make the limit a named constant.
- **Tag/type whitelist guard:** an unknown/unregistered node `type` renders a safe FALLBACK, never
  arbitrary markup and never raw HTML injection. There is no `dangerouslySetInnerHTML` / raw-HTML
  path anywhere in the renderer for payload-derived content.

### Out of scope (do NOT build — owned elsewhere)
- The `render_ui` tool schema itself (owned by E4/#243 — you consume it).
- Registration of the 7 chat primitives into the `ai` collection (owned by FB0/#253 — already landed).
- The gzip/content-encoding streams proxy fix (#239).
- Provider-specific tool-calling wiring (Anthropic/OpenAI adapters).

## Tests (HARD — the guard regressions are the security proof, must be built + green)
- **Depth-guard regression:** a `render_ui` payload nested beyond the configured max depth is
  rejected/truncated, asserted — not infinitely recursed (test must terminate).
- **Whitelist-guard regression:** a payload with an unknown/unregistered block `type` falls back
  safely and does NOT emit raw/arbitrary markup (assert the fallback DOM, assert no raw HTML).
- **Happy path:** a nested payload (layout containing viz + data blocks) renders the expected DOM
  through the mapped primitives.
Place tests in the fresh-ui test location alongside existing renderer/component tests.

## Gates (run via the scoped wrappers; record raw evidence)
- F-3: `deno task arch:check` green (renderer sits in correct fresh-ui layering).
- `run-deno-check.ts --root packages/fresh-ui --ext ts,tsx` green; `run-deno-lint.ts` +
  `run-deno-fmt.ts` on touched source green.
- `deno test --allow-all packages/fresh-ui/tests/` (or the module's dir) green, new cases included.
- F-5: all new public exports carry JSDoc + `@module`; `mod.ts`/entry files stay within the ≤20
  export ceiling.
- F-6 / `gate:jsr`: `run-deno-doc-lint.ts --root packages/fresh-ui` totalErrors=0 for touched
  exports; `deno publish --dry-run` from `packages/fresh-ui` exit 0 **WITHOUT** `--allow-slow-types`.
- `netscript ui:add ai` resolves and installs the renderer alongside the FB0 chat primitives — smoke
  it if feasible in-worktree.

### On `gate:e2e` (scaffold.runtime)
The full `scaffold.runtime` E2E case (scaffold a project with the `ai` fresh-ui collection, feed a
nested payload, assert DOM) is EXPENSIVE and may be a separate build from this renderer slice. If it
is genuinely a follow-up-sized lift, do NOT falsify the box: leave `gate:e2e` UNCHECKED on #258, file
a small follow-up issue (`test(cli-e2e): scaffold.runtime coverage for fresh-ui ai generative-ui
renderer`, `type:test`, `area:fresh-ui`, milestone `0.0.1-beta.6`), and note the deferral in the PR
body. The depth-guard + whitelist-guard UNIT regressions above are NOT deferrable — they are the
security acceptance and must be green in this slice.

## Constraints (hard)
- NEVER mutate `deno.lock` — `git checkout -- deno.lock` before any commit if it drifts.
- No new `as` casts beyond the repo's 2 accepted; no raw-HTML/`dangerouslySetInnerHTML` for
  payload-derived content anywhere.
- Push EXPLICIT refspec: `git push origin HEAD:refs/heads/feat/258-fresh-ui-genui-renderer`.
- Open a **draft** PR. Body carries `Closes #258`. Reference the epic `Part of #238` — NO closing
  keyword on the epic. Labels (`type:feat`, `area:fresh-ui`, `epic:ai-stack`, `wave:v1`,
  `priority:*`, one `status:`) + milestone `0.0.1-beta.6`.

## Reporting (do NOT self-certify)
Commit by slice; push; comment on the draft PR with scope + commit hash + raw gate evidence,
explicitly stating which guard regressions are green and whether `gate:e2e` was built or deferred
(with the follow-up issue number). End your turn with a `READY_FOR_A1_REVIEW` marker + commit hash +
PR number. Do NOT check any acceptance/`gate:` box that is not actually built + green (#260
antipattern forbidden).
