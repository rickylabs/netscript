FAIL_FIX (slice 7c2b: Alert, not the final IMPL-EVAL)

**Blocker: an Alert with no `title` shows no label, so its tone is only shown by colour and a hidden icon.**

- **Where:** `packages/fresh-ui/registry/components/ui/alert.tsx:93-95` renders the `title` part only when a caller passes `title`. There's no default label.
- **What the handoff requires:**
  - The owner note in the feedback ledger (`ledger-feedback.json`, ownerNotes) sets one header label: "icon + tone type or custom title, `<tone>/text`, Medium, body size".
  - Its deviation note lists the default text for each tone: Note, Info, Success, Warning, Error, Important.
  - `review/feedback/review-alert.png` shows that header on every untitled Alert, in all six tones and both emphases. A custom title replaces it ("Card expires soon").
- **Why it's a blocker:**
  - **Anatomy:** every untitled Alert, which includes every legacy `<Alert variant=…>children</Alert>` call, drops the header the design requires.
  - **Accessibility:** the icon is `aria-hidden` (line 88), and `role=status` vs `role=alert` only separates the urgent tones (line 72). So with no title, nothing in the text distinguishes info, success, important and neutral. That fails "don't rely on colour alone" (WCAG 1.4.1) for both screen-reader and colour-blind users.
  - The contract (`src/contracts/catalog/feedback/1.ts`: `title` "One sentence-case label", conditional part) and the fixtures carry the same gap, so the tests can't catch it.
- **Required fix:**
  - When `title` is `undefined`, render the default tone label in the `title` part (Note, Info, Success, Warning, Error, Important by `variant`), so the header always matches the ledger.
  - Let callers localize it, for example with an optional `toneLabel` prop or a labels map. Keep `title={false}` as an explicit opt-out for callers that must have no visible label. If you keep the opt-out, the tone should still reach screen readers through visually hidden text.
  - Update the B1 contract (title default and description) and `contracts.json`, the Utility fixtures and `tests/registry/alert.test.tsx`:
    - untitled Alerts render the tone label for each variant;
    - a custom title replaces it;
    - `title={false}` hides it.
  - Rerun the Alert browser and axe cases.

Everything else holds up:

- **Variants and emphasis:** the variant × emphasis axes are the ledger's 6 × 2. `variant` defaults to `info`, and the original four names still work. Custom icons, `icon={false}`, legacy `children` (with `description` taking precedence) and native attributes all work.
- **Strong emphasis:** neutral surface, no box edge, and a 2 px leading pseudo-rule that uses `important/text` for important, `marker` for neutral and info, and `<tone>/default` otherwise, as the ledger specifies.
- **Subtle emphasis:** tone fill and border. The header and icon use the tone text colour, the description inherits the body text colour, and all of these are existing tokens.
- **Visibility and dismissal:**
  - Visibility uses native `hidden`, so a closed Alert is out of layout, the tab order and the accessibility tree. A caller's own `hidden` still wins.
  - The close button sends `onOpenChange(false)` and respects a controlled refusal.
  - Native `onClose` keeps its DOM meaning, and focus never moves on mount.
- **The `bell` glyph** is the Lucide path, covered by the existing ISC/MIT notice, and the Icon name-set guard covers it.
- **Registry:** only Alert's new real runtime import adds the package root dependency, and the frozen fixture is unchanged.

Non-blocking:

1. **Glyph mismatch.** The review uses a check in a circle for success and an exclamation in a circle for destructive. The component uses a plain `check` and `alert-triangle` because the curated set lacks those circle glyphs. Record this as a documented deviation, or add the two glyphs (with their licence).
2. **Label type.** The ledger's label is body size and Medium weight, but `.ns-alert__title` uses `--ns-text-strong`. Confirm these resolve to the same type in Utility.
3. **Focus after dismissing.** Activating Close hides the focused button, so focus drops to `body`. Chromium continues Tab from that point, but a note in the docs, or moving focus to a sensible nearby element, would make this explicit.
