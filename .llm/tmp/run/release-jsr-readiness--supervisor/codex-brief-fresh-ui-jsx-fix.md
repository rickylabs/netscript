# WSL Codex brief — fresh-ui interactive JSX-component type fix (check-test regression)

> Lane: WSL Codex daemon-attached subagent (framework src + public surface). Supervisor (Claude)
> does NOT write this fix. Launch only with daemon proof: WSL worktree path, Codex thread id,
> daemon-managed remote-control proof, and the `codex exec resume <thread-id>` steering command.
>
> UPDATED 2026-06-19 after supervisor empirically reproduced the gate conflict on the umbrella.
> The earlier "swap to `JSX.Element`" guidance was WRONG — see Root Cause + Fix below.

## Branch / worktree

- Base branch: `release/jsr-readiness` (umbrella PR #53 → main). Tip at brief update: `7fa2e9ee`.
- Files are under `packages/fresh-ui/`. One active Codex turn per worktree; steer the same thread
  with `codex exec resume <thread-id>`, never a second send.

## Problem (the blocker)

`check-test` (`deno task test`, which type-checks test files) is GREEN on `main` (`cc3b8731`) but
RED on the umbrella: "Found 92 errors" — ~86 fresh-ui JSX errors (44× TS2786, 37× TS2559,
5× TS2322; 6× TS2769/2771 in the docs-examples fixture). The interactive runtime components are
typed `(props: unknown) => unknown`, which is not a valid JSX element type, so the package's own
guard `packages/fresh-ui/tests/consumer-render.test.tsx` (drift D-5c2-2), plus
`_fixtures/docs-examples_test.ts`, `primitives.test.tsx`, `foundation.test.tsx`, fail.

## Root cause (verified empirically by the supervisor)

PR #58 made TWO changes to the 7 interactive component families
(`packages/fresh-ui/src/runtime/{accordion,dialog,drawer,popover,sheet,tabs,tooltip}/*.tsx`):

1. It **added individual `export`s of each part-function** to `packages/fresh-ui/interactive.ts`
   (e.g. `export { AccordionRoot, AccordionItem, ... }`). On `main`, the part-functions were NOT
   exported — only the namespace consts (`Accordion`, `Dialog`, …) were public, and the
   part-functions returned `VNode` with concrete prop types.
2. Exposing the part-functions made their signatures PUBLIC API, which made `deno doc --lint`
   (A1) emit `private-type-ref` errors. To silence those, #58 rewrote every signature to
   `(props: unknown): unknown`. `unknown` is public ⇒ doc-lint clean, but ⇒ invalid JSX ⇒
   check-test red.

Empirical reproduction (supervisor, on Accordion.tsx): changing back to
`(props: AccordionRootProps): JSX.Element` produced THREE `private-type-ref` doc-lint errors on
the now-public `AccordionRoot`:
- references private type `AccordionRootProps` (the prop type is not exported),
- references private type `JSXInternal` and `JSXInternal.Element` — **Preact's `JSX.Element`
  resolves to the internal `JSXInternal.Element`, which doc-lint treats as private. Do NOT use
  `JSX.Element` as a public return type. Use `VNode` (a public preact type), as `main` did.**

Baseline `deno doc --lint ./mod.ts ./interactive.ts ./primitives.tsx` is exit 0 today (the
`unknown` stamp); the fix must keep it exit 0 while making check-test green.

## The fix — reconcile BOTH gates (this is the whole point of the slice)

Target design: interactive components are valid JSX (concrete props + `VNode` return) AND every
type they expose on the public surface is itself public.

1. For all 7 families, restore the component bodies/signatures to the `main` shape:
   `function XxxPart({ ... }: XxxPartProps): VNode { ... }` — concrete prop type in, `VNode` out
   (import `type { VNode } from 'preact'`). Reuse `main` as the reference (e.g.
   `git show origin/main:packages/fresh-ui/src/runtime/accordion/Accordion.tsx`). Type-only /
   shape-only; no behavior change.
2. Decide the public surface deliberately and make it doc-lint clean. Because an exported
   namespace const must be explicitly typed (slow-types) and its type references the part
   functions (and thus their prop types) via `typeof`, the referenced types MUST be exported.
   So EXPORT, from `packages/fresh-ui/interactive.ts` (and/or `mod.ts` as appropriate), the
   component **prop types** (`AccordionRootProps`, `AccordionItemProps`, … for all 7 families)
   and the **namespace types** (`AccordionNamespace`, …). This intentionally expands the public
   API to include the component prop types — correct for a published UI library (consumers need
   them). The supervisor + user approved this surface expansion (routed to Codex on 2026-06-19).
3. Choose whether the individual part-functions stay individually exported or revert to
   namespace-only (as `main`). Either is acceptable IF doc-lint is clean; prefer the smaller,
   intentional surface. Whatever you choose, do NOT leave any public signature referencing a
   private type, and do NOT use `unknown`/`any` to dodge it.

## Both gates MUST be green (acceptance criteria)

1. `deno task test` — fresh-ui consumer-render guard + fixtures type-check clean (the check-test
   regression is gone; confirm 0 errors for the fresh-ui test files).
2. `deno doc --lint ./mod.ts ./interactive.ts ./primitives.tsx` (run from `packages/fresh-ui/`)
   — exit 0, on the FULL export map, not mod.ts alone (memory `jsr-doc-lint-full-export-set`:
   sibling re-exports false-flag as private-type-ref if you lint a partial map).
3. Scoped evidence wrappers: `.llm/tools/run-deno-check.ts` / `run-deno-lint.ts` with
   `--root packages/fresh-ui --ext ts,tsx`.
4. Re-run repo `deno task check` (1598 files) to confirm no collateral type regressions.

## Secondary (fold in only if cheap)

Non-blocking `quality` `fmt:check` is red (pre-existing on parent `b4e15113`, packages/plugins TS
drift, not docs). If your touched files need formatting, format ONLY those; do not run the
mutating repo-wide `deno task fmt`. Leave broader fmt drift to a dedicated pass; note it.

## Constraints (binding)

- Do NOT touch `packages/aspire/src/public/mod.ts`, `scaffold-versions.ts`, or any version pins
  (LD-8). Do NOT de-catalog (Option-A catalog law). Do NOT delete lock files/caches or run
  `deno cache --reload`.
- Type/surface-only change; no runtime/behavior change; do NOT weaken, skip, or delete the
  consumer-render guard or any test (it exists to catch exactly this regression).

## Slice completion contract (per harness)

Commit by slice → push `release/jsr-readiness` → comment on PR #53 with slice scope, commit hash,
and BOTH-gates evidence (the `deno task test` pass + the `deno doc --lint` exit 0) → append
`.llm/tmp/run/release-jsr-readiness--supervisor/commits.md` → update `context-pack.md`. Then the
supervisor assembles evidence and hands the umbrella to a SEPARATE OpenHands scorecard-eval
session (verdict owner). No publish until scorecard PASS + explicit user dispatch (E: 25 non-CLI
OIDC 0.0.1-alpha.0, then F: `@netscript/cli` last; cli-e2e never published).
