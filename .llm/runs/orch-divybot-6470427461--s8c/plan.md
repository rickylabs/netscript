# Plan & Design — READY FOR REVIEW

## Locked scope

One PR against main; six ordered slices. Preserve monochrome chrome, keyboard/clipboard/no-JS behavior, Markdown twins, real Pagefind and all CI gates. Use existing status tokens first; never author colour values. Public colour roles are generated from the owner Figma export only. Existing callout aliases remain compatible. No backend, dependency upgrades, release or label changes.

## Commit slices and proving gates

1. Callout tones: docs/site/_components/callout.vto, styles/components.css, an internal callout gallery, docs browser tests and style-policy.ts. NOTE/info, TIP/success, WARNING/warning, CAUTION+ERROR/destructive; default body colour and ink links. Gate: docs build and targeted gallery/style browser checks. IMPORTANT remains neutral until slice 6.
2. API kind tags and contrast: apiTable.vto, API reference renderer if needed, styles/components.css, gallery/reference browser assertions. Kind tags distinguish class/function/interface/type/const with non-red existing status roles until syntax export. Gate: docs build and reference rendering tests.
3. One code header and languages: _config.ts, deno.json imports, codeBlock.vto, tabbedCode.vto, assets/docs/tabs.js, styles/components.css, shared language helper plus tests, internal code gallery. Register requested grammars including dotenv; shared human language labels. Tabs own one header; copy resolves selected panel; no-JS still exposes all code. Gate: fence registration negative test, build, keyboard/copy tests.
4. File paths: filePathChip.vto, styles/components.css and web-layer/fresh-ui.md. Ellipsis + title avoids splitting path segments, one gap in chip lists. Gate: source check/build and mobile browser assertions.
5. #2451: integrate reviewed PR #2452 fixes by source path, reconciling slices 1–4. Lightning CSS bundling, classifier-aware browser scheduling, stable build ids, unique permalink names, lane lookup by id, dotenv registration, corrected test path, old run drift repair. Preserve token-source #2450 disposition. Gate: classifier/workflow tests, stable-id/navigation tests and two-build HTML comparison; shared styles/language behavior remain tested.
6. Figma syntax/IMPORTANT: copy owner export from design/figma-code-roles handoff, extend generator for Theme set mode A and Theme B context, test exact compatibility of every old declaration, seven syntax-role contrast checks on code background in both schemes, semantic hljs mappings and IMPORTANT violet. Final browser matrix for home/article/reference/design-system/callouts/code at 390+1280 light+dark, all serious/critical axe findings zero; real style negative controls expected nonzero.

Each implementation commit includes worklog/context updates and independent read-only slice review. Push and comment after each slice. Bootstrap draft within 45 minutes. Native generators may produce one final generated-carrier commit after the six slices.

## Gate set

Structured check/lint/fmt/test wrappers for tools/docs-site, focused browser code, changed plugin/helper code. Full docs verify, exports drift, snippets, token freshness, browser matrix and negative controls, two-build reproducibility, generated documentation freshness, relevant classifier/workflow tests. Required full CLI E2E during readiness; failure is unproven, not waived. No functional gate is replaced by a source scan. Pages workflow uploads actual screenshots and reports on PRs even on failure. Existing configured CI commands stay intact.

## Risks and mitigation

- Export not yet available: finish existing-token slices first, then check every ten minutes up to sixty minutes and report BLOCKED if absent. Never fabricate colour data.
- Old token drift: save baseline declarations as test fixture and assert exact generated strings for light/dark; reject undefined aliases/cycles.
- Syntax AA: compute sRGB WCAG contrast for every role, including comment and punctuation; browser verifies actual computed paint/background and type signatures.
- CSS bundling breaks style-policy parsing: reuse #2452 provenance-aware handling; keep raw-colour/misplaced-red controls functional on bundled output.
- Tab header regression: test mixed-language tab switching, keyboard, clipboard, filenames and no-JS fallback.
- Reproducibility: stable page-local indexes for duplicate components; two-build comparison preserves strict HTML check and discloses unrelated Pagefind serialization variation.
- Public evidence privacy: publish only relative source paths, hashes, verdicts, commands and public URLs; raw evaluator transport metadata stays ignored/private.

## Open decisions and deferred work

No unresolved implementation decision that blocks starting slice 1. Export exact names resolve only at slice 6; safe to defer because no new colour is introduced before then. Token-source consolidation remains #2450, per #2451 disposition. Pagefind serialization stability remains #2453 if independently reproduced; HTML must be byte-identical. No architecture debt is accepted by this tooling/docs change. Contributor entry: tools/docs-site/README.md.
