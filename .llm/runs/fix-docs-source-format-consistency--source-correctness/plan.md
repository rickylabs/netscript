# Plan

## Profile and scope

- Overlay: `SCOPE-docs`
- No package/plugin archetype applies; no public package API or runtime behavior changes.
- Content and story stay unchanged. Broad visual redesign remains deferred to #1277.

## Locked decisions

1. Repair every confirmed public instance of raw-newline quoted component arguments, not only the
   first page the renderer reports.
2. Make the homepage use the same Vento-then-Markdown pipeline as the other authored landing pages.
3. Represent destinations as a semantic list and generate separators in presentation, so a
   separator cannot become an independently wrapping content node.
4. Put source-format validation directly in `deno task build`; put DOM-based rendered homepage
   assertions after Lume. The external corpus builder already calls this build and therefore cannot
   substitute stale `_site` content.
5. Do not touch either lockfile.

## Risks and mitigations

- False positives in Vento comments: executable-expression scanning explicitly skips Vento comment
  tags and planning/generated directories.
- Brittle HTML checks: rendered assertions parse the built DOM and query semantic elements.
- Scope creep into design: only destination grouping/wrapping semantics are adjusted; tokens,
  typography, shell layout, and component styling remain untouched.

## Gates

- Focused source-format unit tests.
- Full docs site build, including source and rendered-output checks.
- Internal links, caveat references, and diagram check.
- Approved external agent-doc corpus build from a new output directory.
- Lock hygiene and focused format/lint/type checks for owned TypeScript.
- Mandatory separate-session IMPL-EVAL before ready-for-review.
