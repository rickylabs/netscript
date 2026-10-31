# 2026-10-31 — Published 0.0.8 parity fixture

Install streams before workers: the worker plugin composition requires streams. Normal `generate plugins` prepares the consumer lock; a check directly after plugin install can correctly return inspection-failure because inspection will not write an incomplete lock. Normal `generate aspire` validates the composition and can install an npm dependency tree. Snapshot project sources and locks but exclude node_modules trees (which contain symlinks); do not modify or delete dependency caches.

Full `deno task e2e:cli` exits 1 at preflight.aspire in this environment because Aspire doctor fails and Docker is unavailable. Cleanup also fails to query Docker; no runtime fixture was started. Read-only leak-check identifies unrelated resources with unknown ownership; leave them alone. Its raw report includes private paths and must live outside Git, not in public run evidence.

Correction after Windows run 41207980660: normal generate aspire is redundant and was removed from the shared smoke. Init/plugin installation already generate canonical Aspire outputs; use those for the clean check. The extra normal generation encountered DNS failure on Windows before checks. Linux confirms clean and hostile parity without it. Keep the historical failed attempt unproven; require a passing retry.
