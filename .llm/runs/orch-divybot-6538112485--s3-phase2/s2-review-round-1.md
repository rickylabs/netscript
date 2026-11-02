FAIL_FIX

**Blocker: the browser keyboard gate can pass against stale code.** It doesn't build what it tests.

- `tools/fresh-ui-browser/gap-server.ts:17` serves a ready-made bundle from a run-specific temp path, `.llm/tmp/s3-phase2-browser/gaps.js`.
- The `webServer` command in `gap.playwright.config.ts` only starts that server. The `deno bundle` step is a separate manual command in the README.
- So if Toggle, ToggleGroup or ButtonGroup change and nobody re-bundles, the 20 Playwright cases still pass, but against old code. On a fresh checkout the server instead crashes because the file doesn't exist.
- This is the declared keyboard proof for this slice and for every later category slice, so a green run has to mean the current source was tested.
- **Required fix:**
  - Have the suite build its own bundle from the current sources on every run, either by chaining `deno bundle --config gap.deno.json … gap-fixture.tsx` before the server in `webServer.command`, or by having `gap-server.ts` bundle at startup.
  - Write the bundle to an ignored output path that isn't tied to this run (for example under `test-results/gaps/`), not the S3-named temp directory.
  - Make a bundling failure fail the run.
  - Update the README to match, then rerun the four projects so the evidence comes from the rebuilt bundle.

Everything else holds up:

- **Contract fidelity:**
  - A3, A4 and A5 now have `shipped: true`.
  - The props, parts, slots and data attributes in the contracts match the TSX.
  - `track` appears only for the segmented variant.
  - The ButtonGroup `textContent` slot is declared.
  - The A5 axes match the spec: variant default/outline/segmented × orientation × size sm/md, with `type` affecting behaviour only.
- **APG behaviour:**
  - Toggle is a native button with `aria-pressed`, activated by Enter and Space.
  - ToggleGroup is a `role=toolbar` with an accessible name and `aria-orientation`.
  - It uses a single tab stop that follows focus. Disabled items are skipped and focus wraps.
  - Home and End work; left/right arrows apply horizontally and up/down vertically.
  - In right-to-left layouts the left/right arrows swap, using the computed direction.
  - ButtonGroup keeps the children's own tab order and doesn't add a second navigation model.
- **Selection safety:**
  - Inside the group, each toggle is always driven by the group (`selected` is always passed), so there's one source of truth.
  - Controlled `value`/`selected` is never written to local state. Callbacks fire in both controlled and uncontrolled use.
  - Single mode replaces or clears the selection; multiple mode adds or removes the item.
  - A caller's `onClick`/`onKeyDown` runs first, and `preventDefault()` stops the built-in behaviour.
  - Disabled toggles never fire. The group-level `disabled` sets the native `disabled` on every toggle and `aria-disabled` on the toolbar.
- **Tests:**
  - The Utility fixtures exercise every variant, size and orientation, plus the disabled toggle.
  - The keyboard scenario IDs match the Playwright test names.
  - The spec really presses keys and asserts focus, `aria-pressed`/`data-selected`, the native disabled state and right-to-left arrows. It also requires zero serious or critical axe findings.
  - The install test copies the components through `ui:add`, compares the installed files byte-for-byte after the documented `cn` import relocation, and runs check and lint on them.
- **Registry and CSS:**
  - The manifest entries, dependencies (`toggle-group` → `toggle`) and CSS layer imports are correct.
  - Every `--ns-*` variable the new CSS uses exists in the token output, and no token values changed.

Non-blocking:

1. In the Figma review render, the small square marker appears on the selected item in the **default and outline** variants too. `toggle-group.css` only adds it for segmented, so default and outline selected items show only the background fill. Either match the render or record why they differ.
2. Toggle and ToggleGroup keep their state and key handling in the component itself, so they only work when rendered inside an island. Without hydration, every item after the first stays at `tabindex=-1` and arrow keys do nothing, which is the same as the existing Tabs runtime. State this in the component docs or the reference page in slice 8.
3. The JSDoc in `packages/fresh-ui/registry.ts:64` still says "66 items total" after three items were added. Refresh it with the slice 8 docs, or derive the number from the manifest.