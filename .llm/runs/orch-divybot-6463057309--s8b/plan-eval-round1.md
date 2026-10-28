# PLAN-EVAL for #2436 (S8b Design system docs): **FAIL_PLAN**

The plan is close, but four content blockers would each force rework after implementation, and one Plan-Gate box is missing. All five can be fixed in the plan text.

**Evaluator identity**
- **Model and session:** native Claude Code session on `claude-opus-5-5` (Anthropic family). I can't see a session id or verify the effort level from inside the session. The implementer is the OpenAI-family Codex session, so the session and vendor family are both separate.
- **What I did:** reviewed head `5b32743ac` read-only. I didn't read any `profiles/` file and didn't start any sub-agents.
- **Not written:** I did not write `plan-eval.md` because the brief said not to edit files. The supervisor should record this verdict there.

**Not flagged, as instructed:** the evaluator override, no label changes, the scoped file ownership, the 34-asset gallery slice, and the generator entry without a `_config.ts` change.

## Blockers

1. **Front matter "complete source YAML" loses its comments.** The DESIGN.md front matter has about 80 YAML comment lines. They carry rules the data depends on: the Light / `-dark` pairing (`studio/DESIGN.md:6-8`), which values were "measured" versus resolved, and contrast ratios (`studio/DESIGN.md:56-57`). A standard YAML parser throws all of these away, and the plan doesn't say how they survive.
   - **Fix:** commit to one of these in the plan:
     - a parser that keeps comments (for example the `yaml` npm Document API), rendering comments as a notes column or group notes;
     - or the verbatim front-matter block shown next to the tables.
   - Add a fixture with a leading comment and an inline comment, plus a corpus test that every comment's text appears in the output.

2. **The configured Markdown renderer passes raw HTML through.** Existing site pages depend on this, for example the `<div class="ns-card-grid">` at `identity-access/how-to/add-authentication.md:650`. The templates are full of angle-bracket placeholders like `<Theme Name>`, `<move>` and `<id>` (`_template/SKILL.md:6-58`, `_template/DESIGN.md:3,47,52`). Rendered as-is, these would be parsed as unknown HTML tags and not shown. That breaks "both templates" and makes source rendering unsafe. The plan's "HTML-escaped" rule covers only the YAML values.
   - **Fix:** render canonical bodies with raw HTML turned off, on a renderer built from the configured one. It must keep the same plugins and the same `slugify`, so anchors still match the rest of the site.
   - Test that the template fixture keeps `&lt;Theme Name&gt;` visible and that a `<script>` fixture comes out escaped.

3. **The section mapping is wrong and incomplete.**
   - `GUIDELINES.md:11` defines the token contract as §1–§3, but the plan says "section 2 token contract".
   - The content of `/guidelines/` is never specified (all of GUIDELINES.md? §4–§6? where §8 "Shipping (planned)" goes).
   - The eleven theme `SKILL.md` files are neither rendered nor explicitly ruled out. §8 says the docs site "publishes the same files".
   - **Fix:** add a table mapping each source file and H2 range to its route. Every GUIDELINES H2 should appear exactly once, or be duplicated with a stated reason. Make an explicit decision on SKILL.md: rendered page, subsection, or source link only. Add a corpus test that every H2 is accounted for.

4. **Heading anchors will collide.** The YAML groups (colors, typography, rounded, spacing, components) share names with body H2s (`studio/DESIGN.md:287, 317, 396`). If the value tables get headings and are rendered in a separate Markdown call, the page ends up with duplicate ids like `#colors`. The brief requires consistent anchors, and the plan doesn't address this.
   - **Fix:** either render each page in one pass or give the generated value-table headings a prefix (e.g. `values-colors`). Add a test that every heading id on each generated page is unique.

5. **There's no risk register.** This is a required Plan-Gate box, and `plan.md` doesn't have one. Add a short section listing the four risks above with their fixes, plus colliding with S8's shared files and the size of the gallery images.

## What checks out
- **Research:** the baseline is current and the claims I spot-checked hold:
  - Studio's seven flavors are H3s (`studio/DESIGN.md:476-575`).
  - All eleven DESIGN.md files carry version, name, description, colors, typography, rounded, spacing and components.
  - The site uses `markdown-it-anchor` with a local `slugify` in `_config.ts:39-60`.
  - The listed Pages commands match `pages.yml:156-171`. `build` also runs `check:source-format` and `check:rendered-output`, and no canonical source contains `{{`.
- **Slices:** three, in order, each naming its files and gates.
- **Gates and evidence:** wrapper checks plus the Pages commands and one E2E run. Six desktop screenshots (landing, Studio, Tonal × light/dark) plus mobile and interaction checks. Gallery: 17 image pairs = 10 themes + 7 Studio flavors.
- **Deferred scope:** S8, S1, S2 and S9 are stated explicitly.
- **jsr-audit:** N/A, because no package or plugin code changes.
- **No internal process in public docs:** the contributor README sits under `_plugins/`, which Lume doesn't publish, and the public pages are generated from canonical sources.

## Advisory (not blocking)
- `slugify` in `_config.ts` isn't exported and `_config.ts` is off-limits. For tests to use "the actual renderer", get it from Lume itself (the `md` helper in the generator, or the engine registered on the exported `site`) rather than copying `slugify`.
- I couldn't confirm the research claim that "landing references already exist on main": there are no `.webp` references anywhere under `docs/` on main.

This is a feature-tier review with up to two cycles, so it goes back for one repair round. Implementation shouldn't start until blockers 1–5 are fixed in `plan.md` and re-reviewed.

Session: a separate Claude session (id withheld)