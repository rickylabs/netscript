# RFC-5 analysis — group `restate-spec` (round 2: ratification pass)

Role: reverse-engineering analyst, round 2. Mandate: against the new primary-source extract,
RATIFY or DEMOTE two round-1 steals that rested on unratified evidence — S9 (echo-back
versioning with yankable versions) and S13 (terminal-message discipline) from
`temporal-durable-analysis.md` — and settle how Restate actually delivers cancellation to a
running handler.

Evidence base (all citations below refer to section labels in
`restate-spec-raw.md`, fetched 2026-08-20):

- **S2** — legacy-repo prose spec `service-invocation-protocol.md` (V1–V3 era; the ONLY prose
  spec that exists at any probed path). Extract Parts A1–A11.
- **S4** — CURRENT `protocol.proto` on `restatedev/restate` `main` (declares V1–V7). Extract
  Parts B1–B9.
- **S5** — current `discovery.proto` (Part C). **S6** — `legacy.proto`, `SuspensionMessageV6`
  (Part D). **S3** — legacy-repo proto, V1–V3 generation (Part E).
- Part F — docs.restate.dev search snippets only; every direct docs/README/CHANGELOG URL 404'd
  (13 failed fetches listed in the raw). Part F items stay UNVERIFIED throughout.

Evidence-tier convention used below: **[CURRENT]** = attested in a file on `restatedev/restate`
`main` today (S4/S5/S6); **[LEGACY-PROSE]** = attested only in the archived V1–V3-era prose
spec (S2/S3); **UNVERIFIED** = neither.

---

## 1. Verdict on S9 — echo-back versioning + yankable version enum

**VERDICT: RATIFY, as a split claim.** The steal survives, but its two halves now carry
different evidence tiers, and one detail of the round-1 wording must be corrected.

### 1.1 Yankable version enum — RATIFIED [CURRENT]

Raw §B1 quotes the current `ServiceProtocolVersion` enum verbatim: `V3 = 3;` and `V4 = 4;` are
both annotated `// **Yanked**` in the file shipping on `main` today, inside an enum that runs
V1→V7 with per-version changelog comments. Round-1's "enum with yanked V3/V4" is exactly right.

The ratification also surfaces *why* yanking matters, which round 1 could not see: the legacy
proto (raw Part E) documents V3 as the version that added "invocation cancellation, invocation
ID retrieval, and idempotency keys for call entries" — and the current enum yanks V3 and V4,
then reintroduces cancellation in V5 under a redesigned model ("Immutable journal … New command
to cancel invocations", §B1). So Restate used the yank mechanism to retract a shipped
cancellation design and re-land it two versions later without renumbering or breaking decode of
the enum. That is the strongest possible argument for the steal: a version registry where
"exists" and "may be negotiated" are separate properties. NetScript's `NS_TASK_PROTOCOL`
registry should carry a `yanked: true` bit from day one.

### 1.2 Version-in-media-type + echo-back — RATIFIED [LEGACY-PROSE], V7 restatement UNVERIFIED

Raw §A4 gives the rule verbatim from the prose spec: content-type
`application/vnd.restate.invocation.vX` chosen by the runtime; "The SDK MUST return back the
same content-type in the successful response case."

Two corrections/caveats against round-1's wording:

1. **The 415 is a SHOULD, not a MUST.** §A4: "If the SDK doesn't support the content-type, It
   SHOULD close the stream replying back with a `415` status code." Round 1 compressed this to
   "`415` on mismatch"; an RFC-5 conformance clause copying this must not upgrade it to MUST if
   it wants to cite Restate as precedent.
2. **The echo rule is only attested in the V1–V3-era archived prose spec.** No prose spec for
   the current V5–V7 command/notification model exists at any probed path (raw "Collection
   gaps"). The current proto's version enum [CURRENT] proves versioned negotiation is alive
   through V7, and the content-type carries the version *by construction of the enum's
   purpose statement in §A4* — but whether the echo-back sentence is restated unchanged for V7
   is UNVERIFIED. There is no counter-evidence of change; the claim is demoted only in
   evidence tier, not in content.

Adjacent Part-F snippet — SDKs "declare a range from minimum (included) to maximum (included)
Service Protocol supported version" during registration — is consistent with `discovery.proto`
existing and versioned [CURRENT, Part C], but the range-declaration behavior itself remains
UNVERIFIED (search snippet, page 404'd). Do not cite it as normative precedent; cite the
media-type + enum pair instead.

### 1.3 Net effect on the RFC

Keep S9 in the steal register with this citation shape: yank mechanism → current
`protocol.proto` on main (hard evidence); echo-back handshake → archived
`service-invocation-protocol.md` §"Content type and protocol version" (legacy-era evidence,
behavior believed current, restatement unverifiable). The NetScript translation is unchanged:
host declares `NS_TASK_PROTOCOL=<v>` at spawn, task echoes it in its first structured frame,
mismatch is a distinct handshake-failure outcome (not a task failure), and the version registry
supports yanking.

---

## 2. Verdict on S13 — terminal-message discipline

**VERDICT: RATIFY.** This is now the best-attested claim in the group — double-attested in the
prose spec and corroborated by MUST-comments in the current proto.

1. **The closed terminal set, with implicit-close mapped to unknown failure** [LEGACY-PROSE],
   raw §A3 verbatim: "A message stream MUST start with `StartMessage` and MUST end with either:
   One `SuspensionMessage` / One `ErrorMessage` / One `EndMessage`. If the message stream does
   not end with any of these two messages, it will be considered equivalent to sending an
   `ErrorMessage` with an unknown failure." (The "these two" vs three-item list is a typo in
   the upstream spec itself; reproduced faithfully.)
2. **Second attestation from the failure chapter** [LEGACY-PROSE], raw §A9: closing the stream
   "without `EndMessage` or `SuspensionMessage` or `ErrorMessage` … is equivalent to sending an
   `ErrorMessage` with unknown reason."
3. **Current-proto corroboration** [CURRENT], raw §B3: `EndMessage` — "Implementations MUST
   send this message when the invocation lifecycle ends"; `SuspensionMessage` — "Implementations
   MUST send this message when suspending an invocation." The three terminal frame types
   (`SuspensionMessage` 0x0000+1, `ErrorMessage` 0x0000+2, `EndMessage` 0x0000+3) all survive
   into V7 as the complete terminal set — no fourth terminal frame was added in four protocol
   generations.

Caveat for honesty: the specific *implicit-close ⇒ unknown-failure equivalence sentence* is
prose-spec-only, so its V7 restatement shares the §1.2 UNVERIFIED status. The MUST-send
obligations, however, are on `main` today.

Round 1 also drew a distinction worth ratifying explicitly: §A9 separates "close with
`ErrorMessage`" (SDK-reported, "used by the runtime for accurate reporting") from "close
without any terminal frame" (runtime-synthesized unknown failure). These are *different
producers of the same failure class*, which is exactly the NetScript translation S13 proposed:
subprocess exit without a terminal protocol frame = a distinct engine-synthesized
`UnknownFailure` — not a parse error, not `success: false`, and never trusted from the task
itself. Additionally §A9's "the SDK MUST NOT assume that every journal entry previously sent on
the same message stream has been correctly stored" ratifies round-1 anti-pattern A4
(delivered ≠ durable) at the same evidence tier.

One enrichment from the current proto that round 1 could not have: `ErrorMessage` is no longer
just "transient failure, please retry." V7 adds `ErrorBehavior { RETRY = 0; PAUSE = 1;
FAIL = 2; }` plus `next_retry_delay`, with 0=RETRY chosen deliberately so old SDKs' unset field
keeps legacy semantics (§B3). The terminal-frame taxonomy is therefore: `EndMessage` (journal
complete — note terminal *business* failure travels inside `OutputCommandMessage.failure`, §A9,
not as `ErrorMessage`), `ErrorMessage` (attempt aborted, with sender-directed disposition
retry/pause/fail and blame pointers `related_command_index/name/type`), `SuspensionMessage`
(voluntary yield with a declared wake condition). This three-way split plus the synthesized
fourth outcome (unknown failure) is the complete outcome algebra NetScript's RFC should copy.

---

## 3. Cancellation: how Restate actually delivers it — SETTLED at the wire level

Round-1 open question #1: "v5+ `SendSignalCommandMessage`/`SignalNotificationMessage` look like
the cancel path but the extract never says so." The new extract settles the mechanism to the
extent the proto can, and the residue is precisely delimited.

### 3.1 What is now CONFIRMED [CURRENT]

Cancellation in current Restate is **a built-in signal, delivered in-band as a notification on
the invocation's own message stream** — not a dedicated control frame, not a transport action:

- `enum BuiltInSignal { SIGNAL_UNKNOWN = 0; CANCEL = 1; reserved 2 to 15; }` (§B6). CANCEL is
  signal index 1, in a reserved built-in range with 14 slots held for future control verbs.
- Signals reach the handler as `SignalNotificationMessage` (type `0xFBFF`, §B6), carrying
  `signal_id{idx|name}` + `result{void|value|failure}` — the same duck-typed notification shape
  as every completion (`NotificationTemplate`, §B5). A running handler therefore learns of
  cancellation the same way it learns a sleep finished: by reading its stream.
- A *suspended* handler can be woken by cancellation: the V7 `SuspensionMessage` carries a
  `Future` await-tree whose leaves include `waiting_signals` / `waiting_named_signals`
  (§B3/§B4), and its V6 predecessor already had `repeated uint32 waiting_signals`
  (`legacy.proto`, Part D). An SDK that lists signal 1 in its await set converts cancellation
  into a resume event. SuspensionMessageV6's field proves signals predate V7.
- One invocation cancels another by `SendSignalCommandMessage{target_invocation_id,
  signal_id{idx|name}, result}` (§B6) — cancel-the-target is the sender-side special case of
  general signaling, "Fallible: Yes / Completable: No".
- Lineage [CURRENT enum comments + Part E]: V3 shipped a dedicated
  `CancelInvocationEntryMessage` ("Cancel the target invocation id or the target journal
  entry", legacy table §A7); V3/V4 were yanked; V5 reintroduced "New command to cancel
  invocations" under the immutable journal. Cancellation is the feature the yank mechanism
  exists for.

### 3.2 What is inferred (strong, but not stated in one sentence anywhere fetched)

That the runtime, upon an external/user cancellation request, emits
`SignalNotificationMessage{idx: 1}` to the running handler is the only reading consistent with
the proto (CANCEL lives in the signal id-space; signals have exactly one delivery vehicle), but
no fetched sentence says "cancellation is delivered as signal 1." Label: INFERRED-FROM-PROTO.

A second structural consequence, INFERRED from §A3's transport modes: in request/response
fallback mode "the runtime cannot send messages anymore" once the SDK starts responding — so an
in-flight handler on a fallback stream *cannot receive* the cancel notification mid-attempt; it
can only observe cancellation at its next suspension/replay boundary. In-band cancellation
inherits the transport's duplexity. This is the same lesson as round-1 S14 (named degraded
mode) applied to cancel, and it matters directly for NetScript: a T1 framed-stdout task without
a readable stdin channel is structurally in "fallback mode" — cancel-by-frame is impossible,
and the design must say so rather than pretend (T0/T1 keep signal/SIGKILL as the only cancel;
frame-based cooperative cancel is a T2-duplex-only feature).

### 3.3 What remains UNVERIFIED

1. **SDK obligations upon receiving CANCEL** — must it stop eagerly, run compensation, and
   which terminal frame does a cancelled invocation end with (`OutputCommandMessage{failure}`
   with a canonical code? `ErrorMessage{behavior: FAIL}`?). No fetched source states this. The
   409/"cancelled" failure semantics cannot be cited from this corpus.
2. **The non-cooperative backstop.** `discovery.proto` V3 (Part C) lists "inactivity timeout,
   abort timeout" as per-service discovery options — naming strongly suggests
   ignore-the-signal ⇒ runtime abort after a deadline, which would mirror the
   cooperative-then-SIGKILL shape NetScript already planned, but the semantics are one enum
   comment; UNVERIFIED.
3. **Whether admin-API/user-initiated cancellation shares the SendSignal path** end-to-end, vs
   a runtime-internal route that merely converges on the same notification. Invisible at the
   proto layer.
4. Whether the V5-era "new command to cancel invocations" *is* `SendSignalCommandMessage` or a
   since-replaced dedicated message: the current registry (§B2) shows no dedicated cancel
   command, but intermediate V5/V6 protos were not fetched.

**Bottom line for the RFC:** Restate may now be cited as precedent for *cancellation as an
in-band, awaitable, reserved-id signal with sender-side targeting* (proto-level, current main).
It may NOT yet be cited for cancelled-outcome semantics or grace/abort timing — those need
`docs.restate.dev/references/errors` or SDK source, both unreachable this round.

---

## 4. New round-2 findings worth adding to the steal register

- **R2-A. Reserved built-in control-signal range.** `CANCEL = 1; reserved 2 to 15;` (§B6) —
  one enum reserves the next 14 control verbs before any exists. Directly answers round-1
  anti-pattern A8 ("once a protocol ships without a cancel path, retrofitting forces a new
  transport mode"): NetScript should reserve a built-in signal id-space in the T1 envelope even
  though Tier 1 only defines CANCEL. Pillar: lifecycle. Tier 1 (reservation), Tier 2 (use).
- **R2-B. Sender-directed retry disposition on the error frame.** `ErrorBehavior`
  RETRY/PAUSE/FAIL + `next_retry_delay` overriding engine policy for exactly one attempt, with
  enum value 0 chosen for wire-compat with older SDKs (§B3). Extends round-1 S8; PAUSE
  (park for operator attention, neither retry nor fail) is a state NetScript's register lacks.
- **R2-C. Await-point disclosure as observability.** `AwaitingOnMessage` (§B4) — SDK MAY tell
  the runtime what it is blocked on, runtime treats it as advisory and self-expiring. Cheap,
  optional "why is this task stuck" telemetry for T2 workers; composes with the `Future`
  combinator tree (worked example: `Promise.all([c3, Promise.race([s1, s2])])`).
- **R2-D. Propose-then-notify for non-deterministic side effects.** `ProposeRunCompletionMessage`
  → durable → replayed as an ordinary notification in stable relative order (§B5): the ack is
  ordered *relative to notifications*, which is the subtle part NetScript's checkpoint verb
  (round-1 S10) must copy to make replay deterministic.
- **R2-E. Custom-entry escape hatch with a fenced type range** (`>= 0xFC00`, reserved field
  numbers 13/14/15, §A11) [LEGACY-PROSE]: vendor extension space carved out of the type
  registry from day one — the frame-type analogue of R2-A.

---

## 5. Consolidated unverifiability ledger (round 2)

| # | Claim | Status |
|---|-------|--------|
| U1 | Echo-back content-type rule (and 415-SHOULD) restated for V5–V7 | UNVERIFIED — no current prose spec exists at any probed path; rule attested V1–V3 era only |
| U2 | Implicit-close ⇒ unknown-failure sentence restated for V5–V7 | UNVERIFIED — same gap; MUST-send terminal comments on main corroborate the discipline itself |
| U3 | Discovery-time min/max protocol-version range declaration | UNVERIFIED — Part F search snippet; docs page 404 |
| U4 | Runtime delivers cancel as `SignalNotificationMessage{idx:1}` | INFERRED-FROM-PROTO (structure confirmed; sentence absent) |
| U5 | Cancelled-invocation terminal frame + SDK obligations on CANCEL | UNVERIFIED |
| U6 | "Abort timeout" = non-cooperative cancellation backstop | UNVERIFIED (enum comment naming only) |
| U7 | Identity of the V5 "new command to cancel invocations" | UNVERIFIED (V5/V6 intermediate protos not fetched) |
| U8 | Numeric u16 header constants beyond `0x…+N` comments; `0x04000+10` typo upstream | as-written in source; constants file not fetchable |

Narrow refetch that would clear the most residue: `docs.restate.dev/references/errors` (U5),
any V5/V6 tag of `protocol.proto` (U7), and a current SDK's invocation handler (U4, U5).

## 6. Round-1 cross-updates

- `temporal-durable-analysis.md` S9 → RATIFIED (split tiers, §1 above; correct "415 on
  mismatch" to SHOULD). S13 → RATIFIED (§2). S14 (named degraded mode) → strengthened: fallback
  mode provably forfeits in-band cancel (§3.2). A4 (delivered ≠ durable) → ratified verbatim.
  A8 → answered by R2-A. Open question #1 (cancellation) → settled at wire level per §3,
  residue U4–U7.
- Engine defect mapping unchanged from round 1; note D-9 (full `Deno.env.toObject()` leak) is
  orthogonal to everything here — Restate's version negotiation rides the content-type, not
  env, so adopting S9 via `NS_TASK_PROTOCOL` adds exactly one deliberate env var, which is the
  allowlist model the D-9 fix needs anyway.
