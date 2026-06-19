# Context Pack

Branch: `fix/docs-visual-regressions`

Target: PR to `docs/user-site`.

Scope: `docs/site/**` visual-regression fix for component CSS leakage and docs-site rendering.

Implementation summary:

- Root cause confirmed: component front matter was not at byte 0 because Vento comments preceded
  `---`, so Lume emitted `css:`/`js:` blocks as page text.
- Component CSS is now centralized in `docs/site/styles/docs.css`, which base layout already links.
- Tabbed-code JavaScript moved to `docs/site/_includes/layouts/base.vto`.
- Inline prose code can wrap to avoid mobile overflow while fenced code keeps horizontal scrolling.

Validation summary:

- Build: `deno task --cwd docs/site build` passed, 142 files generated.
- Leak gates: `css: |`, `js: |`, stray `---`, and component CSS selectors in generated HTML all
  returned zero matches.
- Formatting: scoped `deno fmt --check` passed for all touched docs files.
- Playwright: Chromium sweep passed for 18 pages at desktop `1280x900` and mobile `390x844`; 36
  visits, 0 console errors, 0 page errors, 0 leaks, max overflow 0.

