# Docs-story Triage — K-note dispositions (generator, stage 3 integration)

Verdict on the docs pass: **high quality.** Files 1–4 are public-clean (verified: zero
harness/model/proof references), match the rev-2 contracts, and the K-notes do exactly what the
stage exists for — surface API warts by forcing the docs to be written. **All 17 accepted.**

| # | Note | Disposition → where applied |
| --- | --- | --- |
| K-1 | dashboard/ai examples still spoke rev 1 | examples updated to rev-2 envelope shapes |
| K-2 | `pluginApi` signature stated two ways | locked `pluginApi(client: PluginClientContext): string` (04 §5); dashboard example comment fixed |
| K-3 | `fromGenerated` vs bare registry | bare registry; overview diagram fixed |
| K-4 | `ctx.redirect` uncontracted | `PluginPageContext` named + typed `redirect` helper (01, 04 §5) |
| K-5 | standalone nav authoring path; `NavSpec.order` | `nav?: readonly NavContribution[]` in the authoring form; NavSpec pinned with `order` (01) |
| K-6 | `theme` key asymmetry | `theme` is singular in fact: ONE ThemeContribution, multiple css files (01, 02) |
| K-7 | `contract` boilerplate | defaults to `{ family: 'app', major: 1 }` in `defineFrontend`, overridable (01, 02) |
| K-8 | `MessageRef` too heavy for the common case | string shorthand compiling to MessageRef with derived id (01, 02) |
| K-9 | testing kit unnamed; budgets homeless | `defineFrontendTestSuite(manifest, options)` named; `budgets` block lives on the envelope (01, 05) |
| K-10 | pointer restates the contract triple | pointer carries `{export, framework}` only; contract derived at generate time; doctor prints drift (01) |
| K-11 | two route-param syntaxes | generate-time param cross-check row added (03 §3) + guide sentence noted for docs refresh |
| K-12 | island `id` had no stated job | purpose documented: registry identity, duplicate rejection, doctor, budget attribution (01) |
| K-13 | gateway prefix unpinned | `/api/plugins/<mountId>/…` pinned next to FrontendIdentity (01); 04 §4 references it |
| K-14 | `ComponentRef` misnames CSS refs | renamed `ModuleRef` everywhere (01, 03) |
| K-15 | three types unnamed | `FrontendDefinition`, `PluginPageContext`, `FrontendContributionRegistry` (owner: plugin-frontend-core) named (01, 04) |
| K-16 | multi-family export unshown | pinned: `export default [defineFrontend(a), defineFrontend(b)]` (01) |
| K-17 | quarantine taxonomy invisible in product | doctor prints the five-state taxonomy verbatim; quarantine card deep-links the doctor command (03 §4, 04 §6) |

**Docs-story refresh policy:** files 1–4 are the pre-K-note forecast (they documented the API
that existed when they were written; the notes themselves list the touch points). They are a
forecast artifact, not the normative contract — the canonical docs are normative. The doc files
get their matching edits when the contracts are frozen at implementation time (Wave 1), so the
forecast is refreshed once, not per integration round.
