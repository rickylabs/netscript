# WSL Codex brief — fresh-ui interactive JSX-component type fix (check-test regression)

> Lane: WSL Codex daemon-attached subagent (framework src). Supervisor (Claude) does NOT write
> this fix. Launch only with daemon proof: WSL worktree path, Codex thread id, daemon-managed
> remote-control proof, and the `codex exec resume <thread-id>` steering command. Without those,
> record the launch as failed/not-attached in worklog.md/drift.md.

## Branch / worktree

- Base branch: `release/jsr-readiness` (umbrella PR #53 → main). Current tip `c1a83149`.
- One active Codex turn per worktree. Steer the same thread with `codex exec resume <thread-id>`;
  never open a second send.

## Problem (root-caused)

PR #58's fresh-ui A1 (`deno doc --lint`) fix gave the 7 interactive runtime component families
explicit signatures — but used the over-broad `(props: unknown): unknown` to silence the
`no-slow-types` lint. That satisfies A1/doc-lint but makes every component an invalid JSX element
type (`(props: unknown) => unknown` is "not a valid JSX component"). The package's own guard
`packages/fresh-ui/tests/consumer-render.test.tsx` (drift D-5c2-2) plus `_fixtures/
docs-examples_test.ts`, `primitives.test.tsx`, `foundation.test.tsx` now fail type-checking.

Result: `check-test` (`deno task test`, which type-checks test files) is GREEN on `main`
(`cc3b8731`) but RED on the umbrella — "Found 92 errors" (≈86 fresh-ui JSX errors: 44× TS2786,
37× TS2559, 5× TS2322; 6× TS2769/2771 in the docs-examples fixture). This blocks the scorecard.

## Files (7 component families)

`packages/fresh-ui/src/runtime/{accordion,dialog,drawer,popover,sheet,tabs,tooltip}/*.tsx`

Each exports several `export function XxxYyy(props: unknown): unknown { const { ... } = props as
XxxYyyProps; ... return ( <jsx/> ); }`. The correct per-part prop types ALREADY EXIST and are
ALREADY IMPORTED in each file (e.g. `accordion/accordion.types.ts` exports `AccordionRootProps`,
`AccordionItemProps`, `AccordionItemTriggerProps`, `AccordionItemIndicatorProps`,
`AccordionItemContentProps`). `JSX` is already imported `from 'preact'` in these files.

## The fix (mechanical, type-only — no behavior change)

For every exported component function in those 7 families:

1. Replace the parameter type `props: unknown` with the concrete already-imported prop type for
   that part (e.g. `props: AccordionRootProps`).
2. Replace the return type `: unknown` with `: JSX.Element` (preact's `JSX` is already imported;
   if a given file isn't importing it, add `import type { JSX } from 'preact';`).
3. Remove the now-redundant `props as XxxYyyProps` cast inside the body (destructure `props`
   directly). Keep all runtime logic identical.

Example (Accordion.tsx):

```diff
-export function AccordionRoot(props: unknown): unknown {
-  const { children, ...options } = props as AccordionRootProps;
+export function AccordionRoot(props: AccordionRootProps): JSX.Element {
+  const { children, ...options } = props;
   const accordion = useAccordion(options);
   return ( <AccordionContext.Provider value={accordion}> ... </AccordionContext.Provider> );
 }
```

Do this for every exported part in all 7 families. If a component returns `null` in some branch,
use `: JSX.Element | null`. Do not introduce `any`; do not re-broaden to `unknown`.

## Both gates MUST be green (this is the whole point of the slice)

1. `deno task test` — fresh-ui consumer-render guard + fixtures type-check clean (check-test
   regression resolved; verify "0 errors" for the fresh-ui test files).
2. `deno doc --lint` for fresh-ui stays clean (A1 no-slow-types, full export set 26/26 — see
   memory `[[jsr-doc-lint-full-export-set]]`: lint the unit's full export map, not mod.ts alone).
   `JSX.Element` is a concrete referenced type and is slow-types-safe; confirm no new warnings.
3. Scoped wrappers for evidence: `.llm/tools/run-deno-check.ts` / `run-deno-lint.ts` with
   `--root packages/fresh-ui --ext ts,tsx`.

## Secondary (fold in if cheap, else note)

The non-blocking `quality` `fmt:check` is red (pre-existing on parent `b4e15113`, packages/plugins
TS drift, not docs). If the touched fresh-ui files need `deno fmt`, format only those; do not run
the mutating repo-wide `deno task fmt`. Leave broader fmt drift for a dedicated pass and note it.

## Constraints (binding)

- Do NOT touch `packages/aspire/src/public/mod.ts`, `scaffold-versions.ts`, or any version pins
  (LD-8). Do NOT de-catalog (Option-A catalog law). Do NOT delete lock files/caches or run
  `deno cache --reload`.
- Type-only change; no runtime/behavior change; do not weaken or skip the consumer-render guard.

## Slice completion contract (per harness)

Commit by slice → push `release/jsr-readiness` → comment on PR #53 with slice scope, commit hash,
and both-gates test evidence → append `.llm/tmp/run/release-jsr-readiness--supervisor/commits.md`
→ update `context-pack.md`. Then supervisor assembles evidence and hands the umbrella to a SEPARATE
OpenHands scorecard-eval session (verdict owner). No publish until scorecard PASS + explicit user
dispatch (E: 25 non-CLI OIDC 0.0.1-alpha.0, then F: `@netscript/cli` last; cli-e2e never published).
