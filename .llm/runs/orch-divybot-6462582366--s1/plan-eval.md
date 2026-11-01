# PLAN-EVAL round 1

**FAIL_PLAN**

The plan already covers these points: NS One stays the default, with `:root` as light and the legacy `[data-theme='dark']` kept. Aliases resolve in the target collection's mode. All 72 inputs are built, each preset keeps its fixed density, and dense, airy and chunky are deferred. Every output uses a real Style Dictionary 5.7.1 format, not the hand-rendering that `packages/fresh-ui/scripts/build-tokens.ts` does today. App overrides apply last and only on the semantic tier. Missing host tools are recorded as UNPROVEN, and the three negative controls are in place.

I spot-checked these load-bearing facts and they hold:
- SD 5.7.1 is in use.
- There is no `apps/playground`; `_app.tsx` is a CLI `.template`.
- The Figma WEB syntax names line up with the existing NS One `--ns-*` names.
- In the Theme collection, only the `Studio` mode aliases Base gray/accent, and nothing aliases the Density collection.

Two blockers remain.

### Blocker 1: the dedicated and gap core-role maps have no value source, and the decisions #2414 owns are not recorded

**Where:** `plan.md` lines 17–23 (the "complete core map… dedicated maps for Bloom, Liquid, and Terminal" paragraph) and line 102 ("No implementation decision is left open").

**Problem:** The only value rule the plan gives is the importer following the target mode. For a shared mode, that rule produces exactly the map the design docs reject:
- **Bloom:** under the `Tonal` mode, core roles resolve to Tonal's mauve × violet. The design doc says this is "not a compatibility contract" (`themes/bloom/DESIGN.md:462-466`). The proposed Bloom map is in `:477-491`; `ring` is "undefined today" (`:489`), and the unused `bloom/*` roles still need a decision (`:490-491`).
- **Liquid:** type and radii are unsourced "because the Glass Theme scale belongs to Cupertino". Liquid's success-text has two candidate roles and #2414 must pick one (`themes/liquid/DESIGN.md:488-496`).
- **Terminal:** the `Signal` mode must split from Studio, and a scheme-aware key role is pending (`themes/terminal/DESIGN.md:394-402`).
- **Cupertino:** `switch-thumb`, the 24/26 container radius tier versus snapping to `radius/card`, and keeping or deleting `cupertino/*` are all open (`themes/cupertino/DESIGN.md:465-473`).
- **NS One:** NS One is not in Figma. Its legacy CSS (`build-tokens.ts:27-110`) lacks many §2.5 core roles (container, inverse, `action/*`, `state/*`, intent hover/text, `bevel/*`, `material/*`, `aurora/*`, `block/*`, elevation) and the new density roles. The plan still promises NS One a complete map.

If these are left to implementation time, the implementer will either invent values or ship maps that are complete in name only.

**Required correction:** add these to `plan.md` before any code:
1. **A per-preset source table for all 18 presets.** For each preset, give its Theme, Base gray, Base accent, Studio flavor and Density mode. For Bloom, Liquid and Terminal, also give the core-role overlay taken from the DESIGN.md mapping and the node-level values from `figma/<theme>.md`.
2. **A decision record** for each pending #2414 item listed above. Each decision must point to an existing Figma-sourced role or value, never a new value.
3. **An NS One gap rule.** Every core role missing from NS One aliases an existing NS One primitive or role. These roles are added only as new properties, and the existing NS One declarations stay unchanged under the compatibility diff.
4. **A rule for roles with no Figma value at all** (for example Bloom `ring`). Give the role a documented alias and run the contrast check on it. The exclusion list is only for measured failures of real Figma values; an undefined value must not be quietly turned into an exclusion.

### Blocker 2: two gates have no defined scope, so the implementer would set their own pass bar

**Where:** `plan.md` lines 46–52, slice 1 ("DTCG validation") and slice 3 ("contrast matrix").

**Problem:**
- **No DTCG validator is named.** A check written by the same session that only re-reads the importer's own output is circular.
- **The contrast pairs are not specified.** The brief requires "every fg/bg pair and the focus ring". Without a pair list fixed in advance, coverage becomes whatever the implementer chooses to put in the matrix.

**Required correction:** state both in `plan.md`:
1. **The validation tool**: schema-level checks of the 2025.10 token format and the resolver document, plus its own negative control, such as a malformed `$type`/`$value` or an unknown modifier context.
2. **The contrast pair registry as data**, with its threshold rules and where it lives. It must cover:
   - text roles against each surface they are designed for (4.5:1);
   - each intent's `fg` on its `default`;
   - pack text/background pairs;
   - `ring` against bg, surface and card (3:1);
   - `input-border`/`border-control` boundaries (3:1).
   
   The check runs per preset and scheme across all 36 combinations, using the effective (fixed) density.

Once both corrections are in `plan.md`, re-run PLAN-EVAL in this same session.

The plan was corrected before implementation. Round 2 resumes the same reviewer.

# PLAN-EVAL round 2

**PASS**

Both blockers from the first round are resolved, so implementation can start.

### Blocker 1 (value sources and gap decisions): resolved
- **Source table.** It now gives every one of the 18 presets its Theme, Base gray, Base accent, Studio flavor and density, and names the overlays for Bloom, Liquid, Terminal, Fluent and Tactile. The seven Studio rows match the flavor headings in the Studio `DESIGN.md` (lines 476–575). I checked again that only the `Studio` Theme mode aliases the Base gray, Base accent and Studio flavor collections, and that nothing aliases Density. So "Base modes do not override" the other languages is correct.
- **Pending #2414 items.** Each one is now decided by pointing at an existing role:
  - **Bloom:** `ring` aliases `control-outline`; all exported roles are kept, including the unused ones.
  - **Liquid:** success text uses `liquid/success/text` in light and the core role in dark; type comes from Liquid's own spec; radii stay exact.
  - **Terminal:** key tokens for both schemes are defined.
  - **Cupertino:** `switch-thumb` aliases `primary-fg`; the 24/26 container radii get their own tokens; all `cupertino/*` roles are kept.
  - **Fluent:** the seven core-to-pack aliases match the "pending in #2414" list in its `DESIGN.md` (lines 347–353).
- **NS One.** Each missing core role now aliases an existing NS One role or primitive. These are added as new names only, the old declarations stay unchanged, and "No missing value becomes an exclusion" is stated.

### Blocker 2 (gate definitions): resolved
- **DTCG validation.** It uses the official 2025.10 format and resolver JSON Schemas, copied in unchanged with their source recorded and compiled by Ajv. The validation is independent of the importer, has failing fixtures as negative controls, and runs before the build.
- **Contrast.** `tokens/contrast-pairs.json` is a locked registry with fixed thresholds. A coverage check fails any text role that has no pair. All 36 preset × scheme combinations are measured, with alpha colours flattened onto the preset background first. Exceptions live in a separate list keyed to the exact pair and ratio, and stale entries are rejected.

### Non-blocking notes for implementation
1. **Official schemas may not exist.** If designtokens.org does not publish self-contained 2025.10 schemas, record DTCG validation as UNPROVEN. Don't swap in a schema written in this session.
2. **Density labels.** Workshop, Playful, Ledger, Atelier and Signal ship their Figma Chunky, Dense or Airy values under a "comfortable" or "compact" label. Record the real source density in `tokens.json` and the registry metadata so the effective-axis record is truthful. Keep dense/airy/chunky listed as a schema follow-up.
3. **Base mode labels for other languages.** The Base gray and accent columns for Brutal and Pixel say "Orange", but their docs say amber inside the mode; Fluent's accent is WinUI's, not Blue. These columns don't change any values, but they shouldn't be emitted as `data-gray`/`data-accent` or as Figma round-trip modes as if they were fact.
4. **NS One contrast failures.** If an NS One gap alias fails contrast (for example intent text mapped to the intent default colour), remap it to a different existing NS One step. An exclusion isn't an option here, because exclusions are only for measured Figma values.
5. **Lock file.** Ajv is a new dependency. Commit the resulting `deno.lock` change and prove `tokens:build` under the frozen lock after adding it.
