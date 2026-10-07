# Binding bounded-stream cache/error claims

A tiny-frame replacement test cannot detect stale checkpoint use: the sole final checkpoint is above the requested start. Use >=2 frames >=64KiB, then replace with a same-size differently framed single payload; request an offset above the former mid-file boundary. Changed mtime, identity, and shrink must cold-scan0 and return the correct full requested frame.

Observe the capacity without exposing private cache state: for N large frames and cap C, oldest retained boundary is N-C+1. A request at the preceding boundary cold-scans0; at the oldest retained boundary seeks there. Removing the cap now fails. Multi-window patterned payloads under 37-byte reads pin both header and payload readExactly loops. chmod000 on a real segment (POSIX nonroot) pins metadata preservation; unchanged native store resets zero, bounded store must retain the stored offset. Restore permissions in finally.

18 service tests pass,0ignored on this Linux uid1000. Four isolated mutations each fail assertions. Temporary copied files cannot inherit npm package.json context via --config original member; use a minimal temp import map with exact npm:@durable-streams/server@0.3.7 and jsr:@std/assert@1 and --no-lock, preserving workspace lock. Evidence review-mutations.json and mutation-*.log.
