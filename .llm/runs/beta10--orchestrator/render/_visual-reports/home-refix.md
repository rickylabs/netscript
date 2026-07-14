# Home — component rethink

## Design question

What composition answers “is my app wired and operating as declared, and where do I act next?”
without becoming a grid of unrelated KPI cards?

Home is one operations canvas: execution rate and outcome records lead, a compact fact rail replaces
three repeated mini-charts, the incident summary connects affected entities to actions, and wiring
coverage plus recent signals provide system context.

## Anchor references

- `08-ref.png`: unified operations canvas mixing a time series, exact system records, and activity.
- `03-analytics-cards.png`: chart/table/channel-bar composition with clear metric hierarchy.

## Component decisions

- Made the execution area chart the primary temporal view and converted trigger/override/saga cards
  into one contiguous fact rail.
- Kept wiring health as a true 16/20 coverage radial and outcomes as a true distribution channel.
- Removed the redundant capability donut; capability mix now reads as exact share records.
- Flattened all Home Cards to `--ns-card` + `--ns-shadow-xs` with internal hairlines.
- Removed decorative icons, colored incident rail, sparkline repetition, and multicolor deltas; one
  copper analytical channel ties the mixed views together.

## Self-verification

Playwright CLI captured main, alternate time-range selection, dark, and 390px mobile states in
`home-refix-shots/`. Zero rendered holes, console errors, and horizontal overflow were found.
