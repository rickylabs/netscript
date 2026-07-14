# Dead-Letter Queues — component rethink

## Design question

What components best support fixing a failure mode before acting on individual dead-lettered
messages?

The screen is an incident triage board. Error-signature clusters are the dominant scan surface;
failed messages are the underlying ledger, and queue capacity is a secondary operational fact.

## Anchor references

- `11-devconsole-a.png`: compact fact rail, filterable records, and operational actions.
- `18-ref.jpg`: event-density overview paired with a detailed record surface.

## Component decisions

- Rebuilt the top strip as one flat factual rail; only the real two-hour arrival trend remains a
  chart.
- Made error signatures contiguous rows with count, sources, age range, arrival shape, and grouped
  actions instead of colored rounded cards.
- Removed decorative glyphs, retry pips, colored side rails, and severity rainbow styling.
- Kept queue depth/capacity as a restrained true-proportion track and the failed-message section as
  a dense data table.
- Used destructive red as the one screen accent because all records are terminal failures.

## Self-verification

Playwright CLI captured main, filtered-cluster, dark, and 390px mobile states in
`dead-letter-queues-refix-shots/`. Zero template holes, console errors, and horizontal overflow were
found.
