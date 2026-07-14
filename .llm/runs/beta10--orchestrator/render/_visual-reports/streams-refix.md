# Streams — component rethink

## Design question

What distinct views explain stream rate, wiring, and lag without forcing them into one chart?

Streams is a topic console with three data-native lenses: an area time series for throughput, a
producer→partitioned-log→consumer topology for ownership and fan-out, and a windowed heat matrix for
lag. The offset ledger and live tail supply exact records.

## Anchor references

- `04-finance-cards.png`: focused interactive time series with tooltip and exact range facts.
- `12-devconsole-b.png`: producer/workbench split and dense message records.

## Component decisions

- Flattened health facts into one contiguous Card rail and removed colored side rails.
- Kept the throughput area chart, topology, and lag matrix because each answers a different real
  question; none is decorative.
- Rebuilt chart/topology/table surfaces with flat `ns-card` shadows and internal hairline rules.
- Reduced status/category color to one teal data channel; lag severity remains text and magnitude,
  not a second palette.
- Kept the partition ledger and live event tail as precise DM Mono record structures.

## Self-verification

Playwright CLI captured Consume, Consumers-selected, dark, and 390px mobile states in
`streams-refix-shots/`. Zero rendered holes and zero horizontal overflow were found; the Streams
route introduced no console errors.
