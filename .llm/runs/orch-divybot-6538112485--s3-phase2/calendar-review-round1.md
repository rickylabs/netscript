FAIL_FIX

**Blocker: days in the middle of a range are drawn as fully selected (ink fill) instead of the light range-middle fill.**

- **Where:**
  - In `registry/components/ui/calendar.tsx:313-315`, `chosen` is true for the endpoints *and* every day between them.
  - `calendar.tsx:335-341` then sets `data-state='selected'` on all of those days, so middle days carry both `data-state='selected'` and `data-range='middle'`.
  - In `registry/components/ui/calendar.css`, `[data-range='middle']` (line 11: `--ns-selected`, radius 0) and `[data-state='selected']` (line 12: `--ns-primary`/`--ns-primary-fg`) have the same specificity. The later rule wins, so middle days get the primary fill, with only square corners setting them apart.
  - Line 14's `:not([data-state='selected'])` also removes the hover state from middle days.
- **Why it's a blocker:**
  - The F13 binding says selected days are `primary/default` + `primary/fg` and range-middle days are `surface/selected` with radius 0.
  - The Utility light and dark review render shows light middle days between ink endpoints. Middle days also have their own hover, focus, today and disabled variants.
  - So every range drawn by Calendar and by the range DatePicker is visually wrong.
  - The browser spec only checks the `data-range`/`aria-selected` attributes (`gap-tests/calendar.spec.ts:71-75`), so it can't catch this.
- **Required fix:**
  - Set `data-state='selected'` only for actual endpoints (`selected.includes(iso)`). Middle days should get `rest`, `today` or `disabled` like any other day, with `data-range='middle'` carrying the range.
  - Keep `aria-selected="true"` on the middle cells (`<td>`), since they're part of the selection.
  - Let middle days use the normal hover rule, or give them a middle-specific hover that matches the review.
  - In `calendar.spec.ts`'s range case, add a computed-style check: a middle day's background must differ from an endpoint's background (or equal the resolved `--ns-selected`) in both light and dark.
  - Rerun the calendar browser projects and render fixtures. If the contract note now makes the middle state explicit, refresh `contracts.json`.

Everything else holds up:

- **Date arithmetic (`calendar-date.ts`):**
  - Strict ISO parsing on a UTC-noon base, with no year 0–99 remapping, and invalid dates are rejected by round-tripping.
  - Month moves clamp the day to the new month, leap centuries are handled natively in UTC, and dates stop at year 0001 and 9999.
  - Selection is a sorted list of ISO strings, independent of the local clock.
  - Invalid or overfilled `value`, an unordered range, and `min > max` all throw.
- **Keyboard:**
  - Left/right are swapped in right-to-left layouts.
  - Home/End go to the start or end of the week depending on `weekStartsOn`.
  - PageUp/PageDown move a month, Shift+PageUp/PageDown move a year, and all moves clamp to `min`/`max`.
  - Disabled days are skipped, with a 366-step cap so a rule that disables every day can't loop forever.
  - There's exactly one tab stop. The focus-moving layout effect is keyed on the tab date and the view, so it handles rapid month changes.
  - Moving focus never changes the selection.
  - All of this is exercised in the browser: leap day, month and year, Home/End, the bounded/disabled calendar, and controlled refusal.
- **Days:**
  - Days are native buttons.
  - Days outside the month are `aria-hidden` muted spans with no interaction.
  - Today is marked with `aria-current="date"`.
- **DatePicker:**
  - It reuses the public native `Dialog` for modal focus, Escape and focus return, and the visible Cancel uses `Dialog.Close`.
  - Open state and value can each be controlled independently. A single choice closes the picker, and so does the second click of a range.
  - The hidden input submits ISO dates joined by `/`, and is disabled when the picker is.
  - Anchoring is CSS-only, behind `@supports`.
  - The `:modal` boundary test only tolerates focus landing on BODY and then re-entering the dialog. It proves programmatic focus can't reach the background, and focus returns to the trigger.
- **Registry and install:**
  - `calendar-date` is a `registry:lib` dependency of both components.
  - The reviewed list now names `calendar` and `date-picker` as components and `calendar-date` as support.
  - The install test copies through the real `ui:add`, maps the consumer's `@netscript/fresh-ui/interactive`, and runs check/lint.

Non-blocking:

1. `today` defaults to the current UTC date (`calendar.tsx:53`). That keeps server and client in agreement, but for users in non-UTC timezones `aria-current="date"` and the starting view can be off by a day around midnight. Document that apps should pass `today` (the user's local date), or compute the default from local fields on the client.
2. When DatePicker passes `value` while its dialog content stays mounted, Calendar's month view and focused day persist between openings. Opening the picker on the selected month is still worth one reopen assertion in the browser test.
