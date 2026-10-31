# Slice 3 review, round 1

**FAIL_FIX — one blocker.** The checker design, the 381-pair coverage contract, the Figma exclusions and 17 of the 19 inherited S0 exclusions are acceptable. Two S0 exclusions cover a new NS One gap role instead of an existing declaration. I read code and data only and ran nothing.

### Blocker: `destructive-hover` is a new NS One role, but its failure is excluded as inherited S0
- `destructive-hover` does not exist in S0: there is no entry in `tokens/legacy.json`, and no current registry component uses it. The gap rule creates it by aliasing `destructive` (`src/tokens/domain/legacy-role-aliases.ts:66-75`).
- It fails 4.5:1 with white text at **3.854513367795** in both schemes. It is excluded at `tokens/contrast-exclusions.json:38-48` (light) and `:148-158` (dark). Both entries are labelled "S0 --ns-destructive", and their reason text says "no new gap color is invented".
- The approved plan and PLAN-EVAL note 4 rule this out: if a new NS One gap alias fails contrast, remap it to a different existing NS One step. Exclusions are only for measured failures of existing values. `drift.md:31` remaps `destructive-text` this way but misses `destructive-hover`.
- Existing darker steps are available without inventing a color: `red-6` (`oklch(54.5% 0.165 28)`) or `red-7` (`oklch(45.5% 0.165 28)`). `red-7` is already used for light `destructive-text`.
- **Fix:**
  1. Map `destructive-hover` to an existing step that measures at least 4.5:1 against `destructive-fg` in both schemes.
  2. Delete the two exclusion entries; the stale-exclusion check will otherwise reject them.
  3. Record the remap in `drift.md`.
  4. Add a test asserting that no NS One exclusion names a role that is absent from `legacy.json`, other than a component token whose colors match an S0 pair exactly. That prevents a new gap alias from being excluded as "inherited" again.
- Other gap roles (`primary-hover`, `success-hover` and the like) don't appear in the exclusions, so this is the only gap alias affected.

### The other 17 inherited S0 exclusions are justified
- They cover existing S0 values that can't change without breaking unchanged NS One:
  - `primary-fg` on `primary-hover`, `secondary-fg` on `secondary-hover` and `destructive-fg` on `destructive`;
  - `input-border` on bg, surface and card;
  - the component tokens for button, input and tabs, which alias exactly those S0 roles and record the same hex values.
- Excluding these exact pairs, rather than repairing the colors, is the only way to meet both the compatibility requirement and strict measured AA, and the owner has authorized it. Each entry is honest that the pair does not pass AA.

### Verified, not blocking
- **Exclusion binding** (`check-token-contrast.ts:127-186`): each exclusion matches exactly on preset, scheme, pair, minimum, 12-decimal ratio and the rendered foreground and background hex. Duplicate, unused and stale entries throw, and an unlisted failure reaches `assertTokenContrast`. A seeded violation therefore fails CI.
- **Coverage contract** (`check-token-contrast.ts:54-120`):
  - the only allowed thresholds are 4.5 and 3;
  - text roles must use 4.5 unless explicitly declared decorative;
  - `ring`, `input-border` and `border-control` need a 3:1 pair in every context;
  - every owned foreground and named background must appear in a pair;
  - stale decorative declarations fail;
  - key tokens are owned by Terminal only.
- **Measurement** (`contrast-color.ts`):
  - colors come from native oklch components, gamut-mapped with the CSS method;
  - the preset background must be opaque;
  - layers are composited source-over in sRGB;
  - contrast uses Color.js WCAG21 on unrounded values.
- **Fluent focus:** measuring the 2px outer indicator, and treating the 1px inner line as decoration, matches the approved anatomy.
- **Figma exclusions:** the 389 entries cite the Figma source and mode, carry an owner-correction reason and change no snapshot values. That is consistent with the owner's authorization.

I'll keep this session open for the fix round.

# Slice 3 review, fix round

**PASS.** The blocker is fixed and I found no new blockers. I only read code and data; I ran nothing.

### What I verified
- **The remap is in place.** `src/tokens/domain/preset-role-map.ts:151` maps `'destructive-hover': 'red-6'`.
  - `red-6` is an existing step in `tokens/legacy.json`.
  - `applyLegacyGaps` (`src/tokens/domain/legacy-role-aliases.ts:31-32`) takes the target from this map in both schemes, because the light-only text table has no entry for `destructive-hover`.
  - Because the map entry now exists, the fallback that aliases unmapped hovers to their intent role (`:66-68`) is skipped.
  - No legacy declaration or Figma value changed.
- **The two exclusions are gone.** `tokens/contrast-exclusions.json` now has exactly 17 `ns-one` entries, 9 light and 8 dark. They are the inherited pairs I accepted last round (`:9-188`).
  - None of them names `destructive-hover`.
  - The other `destructive-fg/destructive-hover` entries in the file all belong to Figma presets, which the owner authorized.
  - If the old entries had stayed, the stale/unused check (`check-token-contrast.ts:182-184`) would now throw, which confirms the new value passes.
- **The new regression closes the gap.** The test is at `tests/tokens/output.test.ts:241-272`. For every NS One exclusion, each foreground and background name must either:
  - exist in `legacy.tokens`, or
  - be a `component-*` token from the explicit five-entry inherited map, with a resolved value exactly equal to its S0 role.

  `destructive-hover` is neither, so the old exclusions would have failed with "A new NS One gap cannot be excluded as S0". All five component targets (`primary-fg`, `primary-hover`, `surface`, `ring`, `muted`) are S0 role names, so the map cannot quietly turn a new gap into an "inherited" one.
- **The records agree.** `drift.md:35` and `slice-3-checks.md:25,35,40,54` all give the same counts: 406 exclusions (389 Figma + 17 S0), 209 tests passing, and a passing frozen quality receipt.

### Compatibility and strict AA
NS One still renders exactly as before. Every new NS One gap role now meets its threshold using an existing palette step. The only NS One failures left are pre-existing S0 pairs, each excluded with an exact record. Every Figma failure is excluded only by an exact, sourced entry the owner authorized. Any other failure, or any drift in a recorded ratio or colour, still fails CI. So the treatment meets both requirements without inventing any colour.

### Non-blocking
`slice-3-checks.md:3` still says "same-session review is pending". Update it to record this PASS.

The session stays open for the CLI and migration slices.
