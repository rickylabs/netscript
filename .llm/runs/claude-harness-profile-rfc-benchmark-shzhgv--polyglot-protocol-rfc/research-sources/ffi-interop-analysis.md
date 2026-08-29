# ffi-interop — analysis for NetScript RFC-5

Group: `ffi-interop`. Sources analyzed: Bootsharp (C#/.NET wasm ↔ JS), wasmbuild + wasm-bindgen
(Rust wasm ↔ JS), Go `syscall/js`, Deno FFI (`Deno.UnsafeCallback`). Extract:
`/home/user/netscript/.llm/tmp/docs/ffi-interop-raw.md` (all citations are to that file's section
numbers). Analyst framing: these are **in-process FFI boundaries**, not subprocess protocols — so
several requested sections (lifecycle state machine, heartbeat, versioning) are largely *absent by
design* in these systems. That absence is itself a finding: FFI systems substitute **compile-time
contracts and explicit resource handles** for runtime protocol machinery. What transfers to
NetScript is the contract/codegen discipline, the direction-explicit event model, the typed error
boundary, and the keepalive/refcount semantics — not wire framing (there is no wire).

---

## 1. Message / verb inventory with wire shapes

None of the four systems has a message protocol in the RFC-5 sense; the "verbs" are function
calls, property accesses, and event operations across an in-memory boundary. Inventory per system:

### 1.1 Bootsharp (extract §1.2–1.6)

| Verb class | Guest (C#) declaration | Host (JS) surface | Direction |
|---|---|---|---|
| Method export | `[Export] static string GetBackendName()` | `Backend.getBackendName()` function | host → guest |
| Method import | `[Import] static partial string GetFrontendName();` (no body; generator emits it) | property that **must be assigned before `boot()`**: `Program.getFrontendName = () => ...` | guest → host |
| Module export | `[assembly: Export(typeof(IBackend))]` on an interface or non-static class | generated TS namespace with functions/vars | host → guest |
| Module import | `[assembly: Import(typeof(IFrontend))]` — **must be an interface**; Bootsharp generates the C# impl that calls JS | host implements the generated TS spec | guest → host |
| Event (exported) | C# `event Action<T>` | JS `EventSubscriber<[T]>` — `.subscribe(fn)` | guest fires → host listens |
| Event (imported) | real C# event on the imported interface | JS `EventBroadcaster` (host fires) + subscribable C# event | host fires → guest listens |
| Property | C# property | exported → TS variable; imported → accessor pair requiring pre-boot assignment | both |
| Instance binding | mutable class/interface crossing the boundary | passed **by reference**; property get/set and method calls traverse live in both directions (§1.4) | both |

Wire shape: "a custom efficient binary serialization format" — **not JSON**, fully automatic, no
marshalling attributes (§1.5). Serialization applies **only to immutable-semantics types** (structs,
records, read-only collections); mutable types become live reference proxies. Scalar mapping table
in §1.5 (`long`→`BigInt`, `DateTime`→`Date`, enums→numbers with generated name↔index maps,
dictionaries→ES6 `Map`, `IReadOnly*`→plain arrays/maps).

### 1.2 wasm-bindgen (extract §2.2)

Verbs are Rust `extern "C"` declarations inside `#[wasm_bindgen(...)]` blocks, refined by ~24
attributes (`catch`, `constructor`, `method`, `getter`/`setter`, `js_name`, `js_namespace`,
`module`, `variadic`, `structural`, …). Import resolution has three attach points (§2.2.1, §2.2.4):

- `module = "specifier"` → `import { X } from "specifier"` glue; `./`-, `../`-, `/`-prefixed
  strings are local JS snippet paths.
- `inline_js = "..."` → module text embedded in the attribute.
- **No attribute → global scope**: `let illmatic = this.illmatic;` (ambient host API).

Wire shape: none — direct JS values; per-type mapping sub-pages (§2.3 note: `Array<T>`,
`Promise<T>`, `Map<K,V>` supported via type erasure).

### 1.3 Go `syscall/js` (extract §3.1–3.2)

Fully dynamic, reflection-style verb set on `Value`: `Get/Set/Delete/Index/SetIndex`,
`Call(m, args...)`, `Invoke(args...)`, `New(args...)`, conversions (`Bool/Int/Float/String/Type`),
checks (`IsUndefined/IsNull/IsNaN/Truthy/InstanceOf`). Host→guest callbacks via
`FuncOf(fn func(this Value, args []Value) any) Func`. Bulk transfer is explicit copy:
`CopyBytesToGo` / `CopyBytesToJS` (Uint8Array only). Type mapping table in §3.1
(`map[string]interface{}` → new object, etc.). No static contract at all — the opposite pole from
Bootsharp.

### 1.4 Deno FFI (extract §4)

One verb: invoke a C function pointer. Guest→host callbacks are
`new Deno.UnsafeCallback({parameters: [...], result: "..."}, fn)` with a declared signature drawn
from the `NativeType` union (`"u8"…"f64"`, `"u64"…"isize"` as bigint, `"bool"`, `"pointer"`,
`"buffer"`, `"function"`, `{struct: [...]}`; `"void"` in return position only) (§4.3). The
signature object **is** the wire shape declaration. `ForeignFunction` extras: `nonblocking?`
(thread-pool execution returning a Promise), `optional?` (missing symbol does not fail `dlopen`).

---

## 2. Lifecycle state machine (as actually implemented)

No source implements a task lifecycle state machine. What exists is **boundary-object lifecycle**:

- **Bootsharp** (§1.2, §1.6): two-phase init — (1) *wire phase*: all imported members MUST be
  assigned onto the generated namespace objects; (2) `await bootsharp.boot()`. Calling order is
  enforced by documentation convention ("must be assigned before runtime initialization"), not by a
  protocol handshake. No shutdown/teardown, and §1.4 explicitly notes disposal/lifetime of interop
  instances is **not documented** — a known hole.
- **Go `syscall/js`** (§3.2): `FuncOf` → usable → `Release()` (mandatory; "must not be invoked
  after calling Release"; calling Release *while the function is still running* is allowed).
  Execution model: a JS→Go invocation "pauses the event loop and spawns a new goroutine"; nested
  wrapped calls share that goroutine; a blocking wrapped function deadlocks the JS event loop
  (calling fetch from it → "immediate deadlock").
- **Deno FFI** (§4.2): `new UnsafeCallback` → optionally `ref()`/`threadSafe()` → `unref()` →
  `close()` (invalidates the pointer, stops event-loop wakeup). The ref count is a genuine small state
  machine: refcount > 0 ⇒ foreign-thread calls wake the event loop **and** the process is kept
  alive; `unref()` gives up keepalive but "does not disable event-loop wakeup"; `close()` is
  terminal.
- **wasm-bindgen**: no lifecycle on the import side ("n/a", §5 table).

Cross-source summary table (§5) confirms the split: explicit release is required exactly where the
host cannot statically know the callback's lifetime (Go, Deno), and absent/undocumented where the
generator owns both sides (Bootsharp, wasm-bindgen).

**Reading for NetScript:** the FFI world's lifecycle unit is the *capability handle*, not the task.
A protocol that hands a guest a progress/cancel channel should treat that channel as a handle with
an explicit terminal transition (close), because two of four mature systems found that leaving it
implicit produced either mandatory-manual-release APIs or documented gaps.

## 3. Heartbeat / cancellation / deadline mechanics

- **Heartbeat:** none, anywhere. The closest analog is Deno's `ref()`/`unref()` keepalive (§4.2):
  a ref'ed callback "keeps Deno's process from exiting while the callback still exists and is not
  unref'ed." That is liveness-as-refcount rather than liveness-as-heartbeat — the *host* holds
  proof a guest interaction is still expected, instead of the guest emitting periodic proof.
- **Cancellation:** Bootsharp's API surface lists a `CancellationToken` class (sitemap, §1.1), so
  cancellation is a first-class marshallable type at that boundary — but the page itself was not
  fetched; its semantics (linked token? host-triggerable?) are **UNVERIFIED**. No other source has
  any cancellation primitive; Go allows `Release()` during execution but that invalidates future
  calls, it does not cancel the running one.
- **Deadline/timeout:** absent in all four sources.
- **Thread-safety of the wake path** (the part these systems *did* solve): Deno callbacks "are
  always thread safe in that they can be called from foreign threads without crashing. However,
  they do not wake up the Deno event loop by default" (§4.2, verbatim) — being callable and being
  *noticed* are separate guarantees, and waking is opt-in (`threadSafe()` = constructor with one
  `ref()` pre-applied). Go's warning is the mirror image: a wrapped Go function that blocks stops
  the entire JS event loop (§3.2).

**Reading for NetScript:** FFI systems get away without heartbeats because host and guest share a
process and death is mutual. Subprocess tasks do not — so NetScript cannot copy this omission; it
should copy the *separation of concerns*: "guest may signal" vs. "host is awakened/keeps waiting"
are distinct protocol obligations (refcount/lease vs. delivery).

## 4. Error taxonomy (retryable vs terminal)

**No source represents retryable-vs-terminal.** What is represented:

- **wasm-bindgen `catch`** (§2.2.2): the only opt-in structured error channel. An imported function
  annotated `catch` must return `Result<T, JsValue>`; a JS exception becomes `Err(exception)`. The
  taxonomy is therefore binary and opt-in per call site: *caught JS value* vs. *uncaught*. The
  default is dangerous (verbatim): "By default wasm-bindgen will take no action when Wasm calls a
  JS function which ends up throwing… Rust code **will not execute destructors**. This can
  unfortunately cause memory leaks" — fixable only with `-Cpanic=unwind` + `std`.
- **Go `syscall/js`** (§3.1): two error types with distinct meanings — `Error` (wraps a JS error;
  a *domain* failure crossed the boundary) vs `ValueError` (a `Value` method invoked on an
  incompatible type; a *contract-misuse* failure). This is the extract's only two-category error
  taxonomy: foreign failure vs. marshalling/contract violation.
- **Bootsharp**: error handling not documented in any fetched page.
- **Deno FFI**: no error model documented for callbacks.

**Reading for NetScript:** the Go split (foreign-error vs contract-violation) is the seed of a real
taxonomy: NetScript's structured error should at minimum distinguish `task-domain` failures
(guest logic failed — possibly retryable) from `protocol` failures (malformed frame, bad type —
terminal, a bug). The current `error: string|null, exitCode` collapses both. Retryability itself
must be a NetScript addition; no precedent here.

## 5. Versioning + capability negotiation

Essentially absent as *runtime* mechanisms; present as *compile-time and tooling* mechanisms:

- **Contract-as-interface** (Bootsharp §1.3): the imported host API is a C# interface, and the
  generated `.g.d.mts` TypeScript spec (§1.6) is the machine-checked statement of what the host
  must provide. Version skew is a type error at build time, not a negotiation at runtime.
- **`optional?: true`** (Deno FFI §4.3): the one genuine runtime capability-negotiation primitive
  in the corpus — a symbol marked optional does not fail `dlopen` when missing, letting the caller
  probe and degrade. This is exactly the shape of tiered conformance: mandatory core symbols +
  optional extended symbols.
- **wasmbuild `--check`** (§2.1): CI gate validating that checked-in generated bindings match the
  source contract — drift detection as a build gate rather than a runtime version field.
- **Pre-boot assignment as implicit handshake** (Bootsharp §1.2/§1.6): imported members must be
  assigned before `boot()`; boot is the moment the capability set is frozen. UNVERIFIED whether
  boot fails loudly on a missing assignment (not documented).
- Nothing anywhere carries a protocol version number on the wire.

## 6. Transport + framing choices, and why

There is no transport: all four boundaries are shared-memory, in-process. The choices that *do*
carry rationale:

- **Bootsharp custom binary format over JSON** (§1.5): chosen for efficiency; viable only because
  the generator owns both encoder and decoder and ships them together — the format never meets a
  third-party implementation. Corollary rule: only immutable types serialize; mutable types pass
  **by reference** as live proxies (§1.4), and BCL types are excluded from proxying "to prevent
  leaking the entire .NET runtime into the generated interop layer."
- **Explicit copy for bulk bytes** (Go §3.1): `CopyBytesToGo`/`CopyBytesToJS` make the copy cost
  visible instead of hiding it behind value conversion; restricted to `Uint8Array`.
- **Signature-object framing** (Deno §4.3): the `{parameters, result}` definition is a
  self-describing frame schema declared once at handle creation, not per call.
- **Blocking vs nonblocking as a per-symbol flag** (Deno §4.3): `nonblocking: true` moves the call
  to a thread pool and returns a Promise — the sync/async decision is part of the declared
  contract, not the caller's whim.
- **Module-vs-global attach** (wasm-bindgen §2.2.1): imports resolve against a named ES module or
  fall back to global scope; the global fallback is documented but produces an ambient, unverifiable
  dependency (see §8). JS snippets have hard environment limits: no `import` statements inside
  snippets, no `--target nodejs`/`no-modules` support (§2.2.4) — cautionary evidence that
  host-supplied glue code is the least portable part of an interop system.

**Why this matters for NetScript:** NetScript's transport (stdio/env today; whatever RFC-5 picks)
is the opposite regime — separate processes, potentially separate authors of each side. That
inverts Bootsharp's binary-format tradeoff (NetScript needs a self-describing, versioned, textual
or length-prefixed format a third party can implement from the spec) while *keeping* the
declared-contract and explicit-cost lessons.

## 7. STEAL CANDIDATES for NetScript's protocol

Each candidate: extract citation → NetScript pillar → conformance tier (0 = mandatory core,
1 = standard citizenship, 2 = extended).

1. **Contract-first, codegen-second adapter model.** Bootsharp derives both sides of the boundary
   plus typed declarations from one interface declaration (§1.2, §1.3, §1.6); wasmbuild `--check`
   gates generated-output drift in CI (§2.1). NetScript: the RFC-5 protocol schema (zod/oRPC
   already on the workers surface) becomes the single source; port/adapter packages
   (Python/Rust/Go/.NET) are *generated or conformance-checked* against it, with a `--check`-style
   drift gate in CI. → **interop, tier 0** (the mechanism that makes every other tier checkable).

2. **Optional-symbol capability probing.** Deno FFI `optional?: true` lets a load succeed with a
   reduced symbol set (§4.3). NetScript: the hello/handshake message declares which optional verbs
   (progress, heartbeat, cancel-ack, checkpoint) the guest implements; the host degrades instead of
   failing. This is the *mechanism* behind tiered conformance: tier 0 verbs mandatory, tier 1/2
   verbs declared-optional. → **interop + lifecycle, tier 0**.

3. **Two-category error split: domain failure vs contract violation.** Go's `Error` (foreign error
   crossed the boundary) vs `ValueError` (contract misuse) (§3.1). NetScript's structured error
   object should carry `kind: "task" | "protocol"` at minimum — task errors are candidates for
   retry policy; protocol errors are terminal bugs and must never be retried blindly. Replaces
   `error: string|null`. → **lifecycle, tier 0**.

4. **Errors as explicit typed results, opt-in exception capture.** wasm-bindgen `catch` →
   `Result<T, JsValue>` with the original exception as payload (§2.2.2). NetScript: the final
   result frame's error branch carries a structured cause (message, type/code, stack when
   available, language-native payload passthrough) rather than exit-code archaeology.
   → **lifecycle, tier 0**.

5. **Direction-explicit event duality.** Bootsharp generates `EventSubscriber` for guest-fired
   events and `EventBroadcaster` for host-fired events — the direction is in the type, not the
   docs (§1.3). NetScript: separate the guest→host event stream (progress, logs, heartbeats) from
   host→guest signals (cancel, config update) as two named channels in the protocol, each with its
   own verb namespace, instead of one bidirectional grab-bag. → **communication + observability,
   tier 1**.

6. **Pre-start capability freeze ("wire before boot").** Bootsharp requires every imported host
   member assigned before `boot()` (§1.2, §1.6). NetScript: the handshake completes — versions
   exchanged, capabilities declared, correlation/trace context delivered (fixing bug D-4's class of
   omission by making context delivery a *protocol obligation*, not an env-var courtesy) — before
   the first payload byte. TASK_ID/TASK_PAYLOAD-only startup becomes the tier-0 legacy fallback.
   → **communication + observability, tier 1**.

7. **Explicit terminal transition for capability handles.** Go `Func.Release()` (mandatory, legal
   mid-call, §3.2) and Deno `close()` (§4.2) vs Bootsharp's undocumented disposal (§1.4).
   NetScript: streams/channels opened during a task get explicit close/finalize frames; task end
   implies close of all child handles (so a crashed guest can't leak host-side waiters).
   → **lifecycle, tier 1**.

8. **Lease/refcount liveness semantics.** Deno's `ref()`/`unref()`/`threadSafe()`: refcount > 0 ⇒
   process kept alive + event loop woken; callable-without-crashing is guaranteed regardless
   (§4.2). NetScript: model heartbeat as a *lease* the guest renews; host-side, "task may still
   speak" (accept late frames without crashing) and "task keeps the worker slot alive" (lease
   valid) are separate guarantees — a task past its lease can still deliver a final result frame
   without wedging the queue. → **lifecycle, tier 2**.

9. **Declared sync/async per verb.** Deno `nonblocking?: boolean` puts the blocking contract in
   the symbol declaration (§4.3); Go documents that a blocking callback deadlocks the host loop
   (§3.2). NetScript: each protocol verb's spec states whether the host may block awaiting a reply
   (request/reply) or must not (fire-and-forget events), so adapters in thread-poor runtimes
   (Python sync workers) know which verbs they may service inline. → **communication, tier 1**.

10. **Canonical names + per-language idiom mapping owned by the adapter.** Bootsharp's deterministic
    C#→JS renaming (PascalCase→camelCase, overload suffixing, generics expansion, nullability →
    `| undefined` vs `?` vs `| null` by position) (§1.2, §1.6). NetScript: the protocol defines one
    canonical verb/field naming; each language adapter owns a *documented deterministic* mapping to
    local idiom (snake_case Python, etc.) so specs stay language-neutral without adapters feeling
    foreign. → **interop, tier 1**.

11. **Explicit bulk-transfer verbs.** Go's `CopyBytesToGo`/`CopyBytesToJS` make large-payload cost
    an explicit operation distinct from value marshalling (§3.1). NetScript: large payloads/results
    move via a distinct mechanism (size-capped inline frames + an out-of-band blob handle verb)
    rather than growing the "last JSON line of stdout" without bound. → **communication, tier 2**.

12. **Cancellation as a marshallable first-class type.** Bootsharp ships a `CancellationToken`
    class in its JS API surface (§1.1 sitemap; semantics UNVERIFIED). Signal for NetScript: cancel
    is a protocol object with identity (which attempt, requested-at, grace deadline), not a bare
    SIGTERM. → **lifecycle, tier 1** (flagged UNVERIFIED as precedent; the design need stands on
    NetScript's own gap analysis).

## 8. Anti-patterns to avoid

1. **Silent exception swallowing as the default error path.** wasm-bindgen without `catch`: host
   exceptions cross into the guest with no unwinding, destructors never run, memory leaks (§2.2.2
   verbatim). NetScript equivalent to avoid: a host that ignores malformed guest frames or a guest
   that dies without a terminal frame while the host keeps waiting. Every failure must surface as
   a structured protocol event; "no action" is never the default.

2. **Undocumented disposal/lifetime.** Bootsharp's interop-instances page documents creation and
   by-ref semantics but not cleanup (§1.4). If RFC-5 adds any stateful handle (stream, blob,
   checkpoint), its terminal transition must be specified in the same document that introduces it.

3. **Ambient/global host API.** wasm-bindgen's no-`module` fallback binds imports to global scope
   (`let illmatic = this.illmatic;`, §2.2.1) — an undeclared, unverifiable dependency on host
   environment shape. NetScript: never let adapters reach for ambient env/undocumented fds; every
   host capability arrives through the declared handshake (this is bug D-4 generalized: env-var
   courtesy context *is* an ambient API, and it silently dropped TRACEPARENT on the queue path).

4. **Opaque custom binary wire formats for multi-author boundaries.** Bootsharp's undocumented
   binary format works because one generator owns both ends (§1.5); NetScript's protocol will be
   implemented by third parties in many languages — the wire format must be self-describing,
   specified, and versioned (JSON/NDJSON or length-prefixed with a published schema), or tiered
   conformance is untestable.

5. **Synchronous blocking guest→host calls on the host's event loop.** Go: a blocking wrapped
   function blocks the JS event loop; async JS from within it is "an immediate deadlock" (§3.2).
   NetScript: no protocol verb may require the host to synchronously block its runtime loop
   awaiting guest computation; request/reply must be correlation-ID async.

6. **By-reference live object proxies across the boundary.** Bootsharp instance bindings (§1.4)
   are elegant in-process and impossible/pathological across processes (every property access a
   round trip). NetScript payloads stay values; anything reference-like is an explicit handle verb
   with explicit lifetime (see §7.7, §7.11).

7. **Leaking the whole host surface.** Bootsharp deliberately excludes BCL types from instance
   binding "to prevent leaking the entire .NET runtime into the generated interop layer" (§1.4).
   NetScript's host API to guests should be a small closed verb set, not a general RPC bridge into
   the worker runtime.

8. **Delivery without wakeup (half-guarantees left implicit).** Deno callbacks are callable from
   foreign threads but don't wake the event loop unless ref'ed (§4.2) — correct behavior requires
   knowing an implicit second flag. Any NetScript guarantee split (accepted vs processed,
   heartbeat-received vs lease-renewed) must be explicit in the protocol spec and testable in the
   conformance suite.

9. **Environment-restricted glue.** wasm-bindgen JS snippets don't work on `--target nodejs` or
   `no-modules` and can't use imports (§2.2.4). Adapter packages must not depend on
   runtime-specific side-channel features that fragment which hosts a conformant guest can run on.

## Open questions / UNVERIFIED

- Bootsharp `CancellationToken`, `Event`, `EventBroadcaster`/`EventSubscriber` API pages were not
  fetched (only the sitemap lists them, §1.1) — cancellation semantics, event delivery ordering,
  and unsubscribe behavior are UNVERIFIED.
- Whether Bootsharp `boot()` fails loudly when a required imported member is unassigned is not
  documented in the fetched pages.
- Bootsharp interop-instance disposal/lifetime is explicitly undocumented upstream (§1.4) — the
  anti-pattern claim rests on the absence, not on observed leaks.
- wasm-bindgen's full per-type mapping tables live on sub-pages that were not individually fetched
  (§2.3); only the generic-erasure note is confirmed.
- All four systems are in-process; every transfer claim in §7 is an analogy across a process
  boundary, not a like-for-like precedent — flagged where the gap changes the tradeoff (§6, §8.6).
