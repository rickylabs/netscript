# S6f minimal explicit-write-denial fixture proposal

PROPOSAL ONLY against pushed0292488bc2739e9e21c35a4a02bb89341addb12a. Root's S6f instruction
requires a concrete proposal before any helper/permission change. No S6f source or child was run.

The accepted294-line fixture always emits `--allow-write=<owned scratch>` and exposes only
denyAllocator/denyFfi. It cannot express the planned explicit write-denied runtime child. Positive
file storage already fits its existing scratch read/write authority and same-sandbox sequential
children. Only the negative switch is missing. No extra positive grant is needed.

## Exact two-owner footprint

1. `plugins/streams/services/src/tests/test_utils/service-runtime-fixture.ts`:294 to295 lines,
   existing cap300. Current SHA256227414514886bd42086b3e814bd3e4822cdd7e64125b847e6edf453fac927f9c.
   Add `readonly denyWrite?: boolean;` to RuntimeOptions. Replace only its runtime write argv entry:

   ```ts
   options.denyWrite ? '--deny-write' : `--allow-write=${scratch}`,
   ```

   Omitted/false defaults retain the exact previous argv. True substitutes denial for the existing
   grant; it never broadens authority. Cache-info/discovery, cleared environment, cache/native
   resolution, exact addon grants, sys/net/read/run limits,30s/2s/32KiB bounds and cleanup stay fixed.
   No configurable extra argv, arbitrary path or new exported helper. Deno2.9.7 run --help confirms
   native --deny-write; retain its actual raw help/exit in the proposal evidence folder.
2. New `plugins/streams/services/src/service-storage_test.ts`, target220-250, hard cap260;
   two Deno.test registrations with sanitizeOps/sanitizeResources/sanitizeExit explicitly true.
   All other test/production/facade/main/README/config/lock/debt owners remain frozen, including
   accepted357-line lifecycle owner4833545d and every historical evidence bundle.

## Audited native behavior and executable rows

Installed MCP find_guidance was used. Exact native durability.ts, bounded-file-store.ts, proxy.ts,
storage-restart_test.ts and bounded-file-store_test.ts were read. Existing restart tests use
allow-all and process termination, so they are retained reference evidence, not reused as proof
of bounded native manual cleanup. The exact public factory remains the shortest qualification path.
No store injection, private close, process-kill-as-success or new launcher is proposed.

Parent test1 uses one sandbox per file/memory mode and two fresh sequential runtime children.
Parent creates the file data directory inside owned scratch before either child. Writer and reader
reuse that scratch only within one sandbox lifetime; the fixture removes it after both settle.
The child sets STREAMS_DATA_DIR only for file mode, uses valid explicit native auth policy and
loopback front port0, and selects an owned upstream using the existing allocator opt-in.

Writer PUTs `before|`, records nonempty native Stream-Next-Offset, POSTs `after`, then consumes a
real front snapshot and records exact bytes plus final native offset. The expected stream path is
unique. Direct upstream snapshot must match, binding the actual selected upstream. After native
manual stop both ports rebind. Parent validates the writer's structured receipt and passes its
opaque offsets/expected bytes to the reader through checked stdin; no guessed offset arithmetic.
Reader's file snapshot must equal writer bytes/final offset; reading from the writer's first offset
must return exactly `after` and the same final offset. Fresh memory reader must return404 for the
same non-live snapshot path, body consumed. Each native handle stops and both actual ports rebind.
Health is consumed through the front: file mode/durable true/probe passed, no dataDir key; memory
mode/durable false/probe not-applicable. This proves orderly restart only, not crash durability.

Parent test2 table uses four fresh sandboxes/children: empty string; missing child path; regular
file; existing directory with denyWrite:true. Parent provisions the regular file and denied-write
directory before dispatch so denied child setup itself needs no write. Empty/missing/non-directory
must reject with exact `STREAMS_DATA_DIR must name an existing directory.` Missing retains the
native NotFound cause. The write-denied row must reach the native Deno.open storage probe and fail
with Deno.errors.NotCapable identifying write access to the unique .netscript-storage-probe-UUID
inside the owned configured directory. Normalize separators using existing standard path APIs;
do not accept a loader/read/network/compiler/timeout error or broad wrapper message as this oracle.
Record exact native class/message/path. No mode-bit chmod, runtime permission mutation, fake Error,
allow-all or silent fallback. Source order verifies storage failure precedes upstream construction;
no running handle may return, and both selected listener ports must remain bindable.

All bodies are consumed/cancelled; primary failures precede secondary cleanup failures. Success
markers occur only after native handles/listeners settle. Unexpected successful startup must be
stopped through its public handle and fail the row. Final parent cleanup verifies owned scratch
removed only after child status/stdout/stderr/stdin settlement on either outcome.

## Gates and stopping boundary

After authorization, write the new test and exact two-line fixture change, then owning12/0/0
(current10 plus2; S6b deferred), eight-file nonempty types/lint/fmt, both changed-owner quality0/0,
protected hashes with only this explicit fixture exception, default-positive argv preservation,
cap and owned-cleanup proofs. No whole-architecture repeat. Preserve every genuine failure.
Windows results are local evidence; Linux stays pending genuine CI. Any extra runtime read/write,
FFI, env, net, run, graph or helper need stops before further changes. Root reads complete source
and every native row before S6f checkpoint. No production or later legacy scope is proposed.
