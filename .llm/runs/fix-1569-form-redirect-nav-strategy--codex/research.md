# Research — fix-1569-form-redirect-nav-strategy--codex

## Re-baseline

- Carried-in source: issue #1569, consumer PR `rickylabs/eis-chat#188`, and the slice brief.
- Re-derived against `main` @ `e85d8d28c` on 2026-08-12.
- The central premise needs qualification: plain Preact 10.29.2 omits a custom hyphenated
  attribute whose value is boolean `false`, but Fresh 2.3.3 installs an SSR hook that serializes
  `f-client-nav={false}` as the literal `f-client-nav="false"`.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | Plain Preact renders boolean `false` as no attribute, string `'false'` as `f-client-nav="false"`, and boolean `true` as a presence attribute. | `deno eval --config packages/fresh/deno.json --ext=tsx ...` without importing `fresh`; captured in worklog. |
| 2 | Fresh 2.3.3 normalizes an `f-client-nav` vnode prop with `String(...)` and serializes it as `String(Boolean(value))`; an actual Fresh render therefore emits boolean `false` as the literal string value. | JSR `@fresh/core@2.3.3/src/runtime/server/preact_hooks.ts:185-197`; cached source hash `5f4b...d3f1`. |
| 3 | Fresh client navigation selects the closest element with `f-client-nav` and opts out only when `getAttribute('f-client-nav') === 'false'`. | JSR `@fresh/core@2.3.3/src/runtime/client/partials.ts:41-45`; cached source hash `5b0e...9840`. |
| 4 | The current managed `Form` forwards arbitrary raw attributes, so consumers can escape with the transport literal but must know Fresh internals. | `packages/fresh/src/application/form/components/form.tsx:25-60`. |
| 5 | The default managed form does not set `f-client-nav`; it inherits an ancestor/body opt-in. | `packages/fresh/src/application/form/runtime/state.ts:121-126` and `components/form.tsx:52-60`. |
| 6 | Validation failures return managed data while successful `redirectTo` returns a 303 `Response`; the two server outcomes are already separate. | `packages/fresh/src/application/builders/define-page/builder/form-support.ts:130-185`. |
| 7 | Fresh 2.3.3 follows a client-nav POST redirect, and falls back to `location.href` only when the redirected response contains no partials. | JSR `@fresh/core@2.3.3/src/runtime/client/partials.ts:353-387`. |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `packages/fresh/deno.json` export `./form`,
  `packages/fresh/src/application/form/mod.ts`, and public form types.
- Planned addition is an explicitly annotated string union plus a documented strategy object; it
  introduces no dependency, inferred exported function return, upstream re-export, or new entrypoint.
- Risks: missing JSDoc/slow-type diagnostics on the new public names, and accidentally exposing the
  raw literal as caller vocabulary. The doc-lint and publish dry-run gates cover these risks.

## Open questions

- Resolved now: the public strategy is a caller-facing object with `navigation: 'client' |
  'document'`; raw `f-client-nav` stays implementation detail.
- Resolved now: the default omits an override and preserves inherited client navigation.
- Resolved now: the document mapping emits the literal string `'false'` for renderer-independent
  reliability even though Fresh's actual SSR hook also makes boolean `false` work.
- The frontend overlay references `.claude/05-frontend.md`, but that file does not exist in this
  checkout. The requested `deno-fresh` skill and Fresh 2.3.3 primary source are used instead.

