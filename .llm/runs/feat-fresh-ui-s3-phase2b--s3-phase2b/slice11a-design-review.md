# Independent Docs11a design review

PASS (slice 11a design checkpoint: FilePathChip, AttributeChip, FileTree and Figure)

The checkpoint (`.llm/runs/feat-fresh-ui-s3-phase2b--s3-phase2b/slice11a-checkpoint.md`) locks four complete, native components inside the approved plan. Implementation may start.

- **FilePathChip:**
  - **Input:** `path` is an escaped string, never a render slot, and the exact original goes to `clipboard.writeText`.
  - **State:** `data-state` is *derived* (rest or copied) with no writable state prop; hover and focus are native CSS. Copied stays until the next attempt or a path or copy change, with no timer.
  - **Outcome reporting:** an always-mounted, visually hidden polite status reports only real success or error, never "Copied" after a rejection, with no `execCommand` fallback. Missing clipboard access counts as an error.
  - **Stale results:** a local request counter plus an unmount guard throws away out-of-order, path-changed or unmounted completions, and doesn't claim to cancel an OS write already issued.
  - **Controls:** the copy button keeps focus and stays enabled; `copy={false}` removes it, and the root adds no tab stop. The ledger geometry overrides are named.
- **AttributeChip:** escaped `name="value"` text, keeping zero, `false`, empty and quotes, from typed scalars rather than JSX slots. It's presentation only, with no tab stop and no border, per the ledger.
- **FileTree:**
  - **Structure:** a labelled frame with native nested `ul`/`li` and explicit list roles where `list-style: none` needs them.
  - **Data:** discriminated folder and file entries with stable unique IDs, ownership (none/owned/generated/guidance) and custom tags. Duplicate IDs, file children and cycles are rejected locally.
  - **Not included:** sorting, selection, open state, the `tree` role, chevrons, guides or a custom key manager.
  - **Accessibility:** decorative glyphs plus a visually hidden type label, and tag text that stays accessible when `tag={false}`.
  - **Contract:** removing the planned `indent` part is correctly justified by the ledger's "no guides". The eight type × ownership cases are row-scoped.
- **Figure:** native `figure` and `figcaption` around real caller media, rejecting Figma's placeholder. Intrinsic aspect ratio is kept. Widths reuse the existing optional prose-measure and wide roles with a 100% fallback, the same pattern as Markdown, with no new values.
- **Folder glyph:** the only L0 addition is Lucide `folder` from a verified primary source, with the existing ISC/Feather notice kept, the Z1 enum extended and coverage through the new docs fixture. No private SVG and no new tokens, dependencies or locks.
- **Gates:** strict SSR negatives on every new scope; real clipboard success plus mocked rejection, missing-API and race tests that add to it rather than replace it; native keys and tab skipping; list semantics with no tree roles; real image loads; RTL and long content; strict axe; focused Firefox and WebKit with clipboard capability differences disclosed; `ui:add` fidelity; wrappers, publish, the doc-lint baseline and the four carriers. The 29/30 budget has a split rule, and deferrals 11b, 12 and 13 are explicit.

**Advice for implementation:**

1. **Copy button names.** Several chips on one page would all have a button named "Copy path", which is ambiguous out of context. Point the button's `aria-describedby` at the chip's `code` element, or include the path in the default name, and assert the name and description in the browser.
2. **Status wording.** The status text describes the latest outcome for the current path. Make sure a stale or invalidated completion leaves the previous status unchanged rather than clearing it to empty mid-announcement. Clear it only when a new attempt starts.
3. **Cycle detection.** Track ancestors on a stack (a `Set` on the current path) rather than a global visited set, so the same object legitimately appearing in two branches isn't misreported as a cycle. Duplicate IDs are still caught by the separate ID check.
4. **Budget.** Count the final files, including the corpus and any publish-assets carrier, before committing, and split cleanly if you reach 30.
