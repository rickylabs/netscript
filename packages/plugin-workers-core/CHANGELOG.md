# Changelog

## Unreleased

- Add bounded bytes/JSON stdin to task builders and execution options; close stdin after delivery
  and use null stdin when no payload is supplied.
- Bound stdout/stderr capture (1 MiB per stream by default), expose executable adapter byte caps,
  and normalize running aborts/timeouts while terminating the owned subprocess.
- Add checked command outbox worker sink with branded target registration and normalized receipt settlement.
- Describe worker applied keys as an at-least-once guard window, including the effect-to-mark crash.
