# Independent Docs11a source review

PASS (slice 11a source review: FilePathChip, AttributeChip, FileTree and Figure)

The four copied components implement the reviewed checkpoint natively and honestly. I found no blockers.

- **FilePathChip** (`packages/fresh-ui/registry/components/ui/file-path-chip.tsx`):
  - The exact path is captured per request and passed to `clipboard.writeText` (lines 58-74). Missing clipboard access is an error, with no `execCommand` fallback and no timer.
  - **Stale results:** a request counter is bumped on every attempt, on a `path` or `copy` change during render (lines 46-49) and on unmount (lines 50-56). Completions only apply while still mounted, latest, and for the same `copy` and `path`. There's no claim to cancel a write already issued.
  - **State:** `data-state` is derived (copied or rest), and `aria-busy` is set only while pending. The status is an always-mounted `role=status` polite region, only showing real outcomes. Errors are made *visible* through the error class as well as announced (lines 99-112). Starting a new attempt or changing the path clears it, as I advised.
  - **Controls:** the copy button stays enabled, gets an accessible name with a blank-label fallback, and is described by the `code` element through a `useId` ID. That settles the duplicate "Copy path" concern. `copy={false}` removes it, and the root has no tab stop.
- **AttributeChip** (`attribute-chip.tsx`): text-only, `name=` followed by `JSON.stringify(String(value))`. Zero, `false`, `null`, empty strings, quotes and markup are all kept as escaped text, and it never touches the DOM or adds a tab stop. The `data-size` axis is sm or md.
- **FileTree** (`file-tree.tsx`):
  - A frame with `role=group` and a non-blank label (with `role` and `aria-label` removed from the props type), containing native nested `ul`/`li` with explicit list roles.
  - **Validation** (lines 45-68): the ancestor set is scoped to the current path (as I advised), IDs must be unique and non-blank, type and ownership are checked, and files can't have children.
  - **Rows:** each row carries `data-type`/`data-ownership`, a decorative folder or `file-text` glyph, a localizable visually hidden type label, and name, comment and tag. The tag stays accessible when `tag={false}`, and ownership `none` has no tag unless the caller supplies one.
  - No tree role, selection, collapse, guides or key manager.
- **Figure** (`figure.tsx`): a native `figure` with a media wrapper and a `figcaption` that keeps zero values (`caption != null`). Width and media are axes, the caller owns the media and alt text, and there's no placeholder, crop or fetch.
- **L0 and boundaries:** the Lucide `folder` path is verified from the primary source, the ISC/Feather notice is kept, and the full `ICON_PATHS` vocabulary equals Z1. None of the four L2 items imports another. No token, dependency, version or lock change.
- **Evidence:**
  - 32 Chromium cases and 32 Firefox/WebKit cases (light only, not full certification).
  - A real native write that resolves to Copied in all three engines; Chromium also reads back the just-written fixture text with granted permissions. The mocked missing, rejected, out-of-order and unmount cases add to the real baseline rather than replace it.
  - A real 720 × 360 image load and the 2:1 geometry, RTL with no overflow, zero console errors, zero serious or critical axe findings and zero allowances.
  - 603 combined contract, registry and embedding tests and 5 installed-copy and closure tests passed. The wrappers passed with nothing dropped, along with quality, preflight, docs accuracy, export drift, the 259-page site build and native publish (0 slow types).
  - The 124 doc-lint failure stays explicit under #2531, with 0 new and 0 removed diagnostics.

**Non-blocking:**
- `AttributeChip` shows JSON escaping (`"a\"b"`). Note that in the README, so readers aren't surprised it isn't HTML-attribute escaping.
- **Budget:** 28 source and carrier files plus the expected Icon MCP corpus update makes 29. If raw git inspection after the source commit also shows a publish-assets carrier change, that's 30, which must be split or reconciled honestly rather than reported as zero.

Next:
1. The source commit, then the four carriers, quality at the current source, native publish refresh, and the same evidence review.
2. Before any further implementation, rebase the parent onto the advanced main (`43aa891e`, conflicts reported on #2488) and restack the child, keeping both main's Utility styling and every combined behavior.

Toc/AnchorNav/RuledGrid/Hero, the Desktop audit and the original Shell Toc integration (11b), the declared extensions and all-style harness (12) and the final runtime, whole-phase and CI work (13) are still required. No READY.
