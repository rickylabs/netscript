# Run Inspector — component rethink

## Design question

What components make one correlated run fast to diagnose without turning exact execution evidence
into an abstract dashboard chart?

Run Inspector is a timed execution instrument. The run list establishes correlation context, the
center rail exposes ordered steps, duration, attempts, and compensation, and the right column keeps
events and logs adjacent to the selected run.

## Anchor references

- `11-ref.png`: correlated-run table and focused inspector relationship.
- `05-ref.png`: time-analysis trace, datum labels, and compact diagnostic density.

## Component decisions

- Rebuilt the run list as contiguous records and the four totals as one flat statistical rail.
- Removed the decorative completion gauge; exact steps-done, attempt, compensation, and elapsed
  values remain visible in the run header.
- Treated the step sequence as a duration-labeled execution rail, with retry and compensation shown
  as execution branches rather than unrelated status cards.
- Kept input, event, and log payloads as exact records because those values are evidence, not chart
  material.
- Flattened outer surfaces to Card backgrounds, internal hairlines, and small shadows; copper is the
  sole chromatic channel for selection, timing, and correlated event markers.
- Removed decorative arrow glyphs and neutralized the inherited status-rainbow markers.

## Self-verification

Playwright CLI captured main, selected run, dark, and 390px mobile states in
`run-inspector-refix-shots/`. Zero rendered holes, console errors, console warnings, and horizontal
overflow were found.
