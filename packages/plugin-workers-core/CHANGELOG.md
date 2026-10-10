# Changelog

## Unreleased

- Add bounded bytes/JSON stdin to task builders and execution options; close stdin after delivery
  and use null stdin when no payload is supplied.
- Retain the last 1 MiB of stdout/stderr by default without failing chatty tasks; explicit output
  byte caps fail closed. Normalize aborts/timeouts and terminate owned process groups/trees.
- Add checked command outbox worker sink with branded target registration and normalized receipt settlement.
- Describe worker applied keys as an at-least-once guard window, including the effect-to-mark crash.
