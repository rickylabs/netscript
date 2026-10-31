PASS (slice 7c2c: Utility Prose stylesheet G17, not the final IMPL-EVAL)

I found no blockers in this slice.

- **Contract (`src/contracts/catalog/docs-kit/1.ts`, `contracts.json`):** X1 now describes the real `Markdown` API: `children` (raw Markdown source, with a mandatory sanitizer), `streaming`, `activeCite`, `onCite` and `class`. The `ns-lede` class opts into lede styling.
  - The design's level, element, state and anchor axes are now native parts (heading, anchor, lede, paragraph, blockquote, list, list-item, rule, link, code, kbd, strong, emphasis) plus the pseudo `underline`. No invented data attributes.
  - Host-generated heading anchors are documented as the host's job, not something the copied renderer claims to emit.
- **Stylesheet (`registry/components/ui/markdown.css`):** every rule uses existing properties.
  - The Studio prose roles (`--ns-studio-prose-*`, defined in `presets/studio-utility.css`, e.g. body 16, h2 26, lede 19, measure 544) fall back to the generic type roles when absent.
  - The code background and syntax colours (`--ns-code-bg`, `--ns-code-syntax-*`), the marker and the spacing values all exist.
  - No token values change.
  - It implements:
    - the h2 top margin (`--ns-space-7 × 2`);
    - small square bullets and monospace ordered markers, with lists reasserted against host resets;
    - link underlines in the semantic underline colour, switching to the marker colour on hover, with a focus ring;
    - inline code on the surface colour with a badge radius, and a Kbd-matching `kbd`;
    - a logical-side quote rule;
    - tables, images and `hr`;
    - host heading anchors that appear on hover and on `:focus-visible`, so keyboard users can find them.
  - Exact native marker glyph shapes stay with the platform and font, which is acknowledged.
- **Browser evidence:** `tools/fresh-ui-browser/gap-prose-build.ts` installs the real copy-only template via `ui:add` into a temporary consumer and writes its sanitized SSR output to an ignored file. The fixture is therefore real renderer output, not hand-written stand-ins, and host-only markup is exercised in a separate, clearly marked section.

Non-blocking: the X1 entry in the public `contracts.json` drops the phase 1 `level`, `element`, `state` and `anchor` props and the `data-level`/`data-element`/`data-state` attributes. That correction is justified, since they never matched the real API, but `contracts.json` is a published artifact. Record the removal as an explicit compatibility note (in the contract notes or run drift) so contract consumers see it was intentional.

The final focused-test, wrapper and quality results, and the public validation record, still have to land as you described.
