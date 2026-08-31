# RFC-5 source analysis — group "security-scoping" (round 2)

Analyst: reverse-engineering pass for NetScript RFC-5 (polyglot foreign tasks → scoped, short-lived,
attempt-fenced credentials; fix for engine defect D-9).

Extract analyzed:

- `/home/user/netscript/.llm/runs/claude-harness-profile-rfc-benchmark-shzhgv--polyglot-protocol-rfc/research-sources/security-scoping-raw.md`
  — cited below as **[L §1.x]** (AWS Lambda env/exec-role/container-creds/metadata),
  **[T §2.x]** (Temporal task token + heartbeats), **[K §3.x]** (Kubernetes bound SA tokens),
  **[X §4]** (RFC 8693 token exchange), **[M §5.1–5.3]** (Macaroons), **[B §5.4]** (Biscuit).

Failed fetches (biscuitsec.org intro/spec pages 403; Stanford macaroons PDF not text-extractable)
did **not** block analysis: the Biscuit GitHub SPECIFICATIONS.md [B §5.4] and the libmacaroons README
[M §5.3] cover the construction mechanics; only the macaroons paper's formal verification argument
is missing (flagged UNVERIFIED where relevant). No refetch was needed.

Engine defect anchor (round-1 corpus, `netscript-engine-audit.md` D-9): "Full parent env inherited
by every subprocess: `Deno.env.toObject()` is the env base, leaking supervisor secrets to foreign
tasks regardless of `permissions.env`" (`dax-process-runner.ts:91`); proposed fix "Start from an
allowlisted base env; make inheritance opt-in per task."

---

## 1. Mechanism inventory — what each source actually does

### 1.1 AWS Lambda: env is the *delivery channel*, never the *authority store*

Four distinct moves, all directly reusable:

1. **Reserved-key namespace.** Lambda splits env into *reserved* runtime-set keys
   ("cannot be set in your function configuration") and unreserved user keys [L §1.1]. The
   reserved set carries identity (`AWS_LAMBDA_FUNCTION_NAME/VERSION`), endpoints
   (`AWS_LAMBDA_RUNTIME_API`, `AWS_LAMBDA_METADATA_API`), and credentials (`AWS_ACCESS_KEY_ID`,
   `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN` "obtained from the function's execution role")
   [L §1.1]. The contract is *positive*: the platform enumerates exactly what it sets; everything
   else is user config. This is the inversion NetScript needs for D-9 — the env a task sees is a
   constructed document, not an inherited snapshot.
2. **Ambient authority is a role, resolved by the platform.** "Lambda automatically assumes your
   execution role when you invoke your function. You should avoid manually calling
   `sts:AssumeRole`" [L §1.2]. The task code never negotiates for credentials; the supervisor
   (platform) mints them and injects them. Least privilege is a *deploy-time policy artifact*
   (IAM policy on the role), tightened by observing actual usage ("IAM Access Analyzer reviews your
   AWS CloudTrail logs … generates a policy template with only the permissions that the function
   used") [L §1.2].
3. **Env-pointer-to-local-endpoint pattern.** The container credential provider puts *no
   credential* in env — it puts a **URL + auth token** there: `AWS_CONTAINER_CREDENTIALS_FULL_URI`
   / `_RELATIVE_URI` (appended to link-local `169.254.170.2`) plus `AWS_CONTAINER_AUTHORIZATION_TOKEN`
   or `_TOKEN_FILE`; "SDKs attempt to load credentials from the specified HTTP endpoint through a
   GET request" with the token as the `Authorization` header [L §1.3]. Credential material stays
   behind a fetch, so rotation and TTL live server-side. (The extract does not give the JSON
   response shape or loopback restrictions — noted UNVERIFIED there [L §1.3 note].)
4. **Per-environment bearer token as SSRF fence.** The metadata endpoint requires
   `Authorization: Bearer $AWS_LAMBDA_METADATA_TOKEN`; "Each execution environment receives a
   unique, randomly generated token at initialization. This token-based authentication provides
   defense in depth protection against Server-Side Request Forgery (SSRF)" [L §1.4]. I.e. even a
   *localhost* endpoint gets a per-instance secret so that a confused-deputy HTTP client inside the
   task cannot be steered into it. Error taxonomy is minimal: 401 (missing/invalid token),
   405 (non-GET), 500 [L §1.4].

Operational constraints worth copying verbatim: env values are literal strings, never expanded
[L §1.1]; total env ≤ 4 KB [L §1.1]; env is version-locked at publish [L §1.1]; AWS itself says
secrets should prefer a secrets service over env [L §1.1] — which is an argument for the pointer
pattern (3) over inlining credentials.

### 1.2 Temporal: the credential *is* the execution-attempt handle

- A Task Token is "a unique identifier for an Activity Task Execution" [T §2.1] — not for the
  activity *definition*, for the *execution*. It is "binary" (`ActivityInfo.TaskToken`), handed to
  an external system, which later calls `CompleteActivity(ctx, taskToken, result, err)` [T §2.2].
  The token "authorizes the `CompleteActivity` call by linking it to the original Activity"
  [T §2.2].
- **The fencing property NetScript wants is documented as a failure mode:** "Task Tokens can become
  invalidated upon Activity retry. When an Activity fails after transmitting its current Task Token
  to a remote service but before completing … the remote service is left holding an obsolete token"
  [T §2.1]. Temporal's escape hatch is completion by `(Activity Id, Workflow Id[, Run Id])` instead
  [T §2.1]. Read in reverse: a per-attempt token is *automatically* a stale-attempt fence — a
  zombie attempt's writes are rejected because its token no longer names a live attempt — and the
  ID-based bypass is precisely the hole that reopens the fence. RFC-5 should adopt the token and
  **not** adopt the ID-tuple bypass for mutating calls.
- Heartbeats are the liveness/cancellation channel: exceed the Heartbeat Timeout → "the Activity
  Task fails and a retry occurs"; heartbeats carry progress payloads the *next* attempt can read;
  "Activities that don't Heartbeat can't receive a Cancellation" [T §2.4]. The extract does not tie
  heartbeats to the task token ([T §2.4 note]) — UNVERIFIED whether Temporal's heartbeat RPC
  authenticates via the token, but the design slot is obvious: in RFC-5 the progress/heartbeat verb
  should authenticate with the same attempt credential, making progress-from-stale-attempt
  rejectable for free.
- The extract explicitly notes Temporal docs do **not** enumerate what operations a token holder may
  perform [T §2.1 note, §2.3]. So Temporal is prior art for *attempt binding*, not for *capability
  scoping* — the token authorizes "complete/fail this one execution," scope is implicit and total
  within that.

### 1.3 Kubernetes bound SA tokens: signed claims + issuer-side liveness check

The most complete short-lived-credential lifecycle in the corpus:

- **Minting:** TokenRequest API; projected volume declares `audience`, `expirationSeconds`
  (min 600 s, default 3600 s, "actual token duration might be shorter or longer than requested"),
  `path` [K §3.1]. Delivery is a *file mount*, not env — relevant to Tier-0 design: K8s chose
  file-over-env for its rotating credential, because env is immutable for a process's lifetime.
- **Binding:** the token embeds "extra private claims" naming the bound object — namespace, pod
  name **and uid**, node name+uid, serviceaccount name+uid [K §3.2]. Verification is not just
  signature-checking: "If the bound object no longer exists, authentication fails"; pending
  deletion → rejected 60+ s after deletionTimestamp; "The bound object's `metadata.uid` must match
  exactly" [K §3.2]. The **uid match** is the fencing move: a recreated pod with the same name has
  a new uid, so an old token cannot ride the name. NetScript translation: bind to
  `(executionId, attempt)` — an attempt number alone is a name; the execution record's identity is
  the uid.
- **Rotation/revocation:** kubelet refreshes at 80 % TTL or 24 h; tokens auto-invalidate on
  pod/SA deletion [K §3.1, §3.2]. Revocation-by-deleting-the-bound-object ("Secret" binding =
  "Manual revocation" lever) [K §3.2 table].
- **The offline-validation warning is load-bearing for RFC-5's verifier design:** offline JWT
  signature verification "cannot verify whether the bound object still exists"; "Always use
  TokenReview API for tokens with business-critical access, especially when bound to objects"
  [K §3.2]. I.e. even a *signed* capability credential still needs an issuer-side liveness lookup
  when it is object-bound. This collapses much of the opaque-vs-signed trade-off (see §3).
- Audience discipline: tokens without explicit audience are "valid for any service that accepts
  it … Security risk in multi-tenant environments" [K §3.2].

### 1.4 RFC 8693: vocabulary for derivation, not a mechanism to embed

Token exchange gives RFC-5 three reusable concepts [X §4]:

- **delegation vs impersonation**: delegation keeps both identities ("Principal A retains its own
  identity while B's delegated rights are exercised by A"). A NetScript task credential is a
  *delegation*: subject = the task/execution, actor = the runtime adapter/supervisor lineage.
- **`act` / `may_act` claims**: nested `act` expresses the chain ("outermost act claim represents
  the current actor"); `may_act` pre-authorizes who may become an actor. Useful if a task must
  mint a *further*-scoped credential for a sub-process (fan-out inside a foreign worker).
- **Down-scoping request grammar**: `resource`, `audience`, `scope` on the exchange request;
  response `scope` REQUIRED when it differs from the request — an honest-downgrade signal worth
  copying into any RFC-5 "refresh/derive credential" verb.

RFC 8693 presumes an online STS; it is the *escalation path* (a task trading its attempt credential
for, e.g., a narrower stream-topic-only credential to hand a subprocess), not the baseline.

### 1.5 Macaroons / Biscuit: offline attenuation, two constructions

- **Macaroons** [M §5.1–5.3]: bearer credential = chained HMACs over a root secret; "really easy to
  add a caveat, but impossible to remove a caveat" — holder-side, offline attenuation. Caveats
  "attenuate and contextually confine when, where, by who, and for what purpose" [M §5.2].
  Third-party caveats + discharge macaroons = decentralized proof requirements; a *binding*
  preparation step ties discharges to the root "preventing misuse in other contexts" [M §5.3].
  Verification requires the *root secret* at the verifier (MAC construction) — verifier and minter
  effectively share a key. That fits NetScript: supervisor is both minter and (loopback callback)
  verifier, so a symmetric construction costs nothing.
- **Biscuit** [B §5.4]: public-key chain-of-signatures; authority block grants, later blocks "only
  attenuate"; offline attenuation by appending blocks; verification needs only the root *public*
  key. Adds: Datalog checks (TTL as `check if time($0), $0 < …`), sealing (freeze against further
  attenuation), and per-block **revocation identifiers** (block signature bytes →
  `revocation_id(...)` facts checkable against a revocation list). Third-party blocks with isolated
  symbol tables.
- Shared lesson regardless of construction: express the grant as **monotonically narrowable
  structured caveats** (queue = X, key-prefix = Y, expiry = T, attempt = N), so the "capability
  list" is not an ad-hoc JSON but an attenuation chain whose *shape* prevents escalation.
  UNVERIFIED (paper PDF unavailable): the macaroons paper's formal claims about caveat semantics —
  the mechanics above come from the README and search summaries only.

---

## 2. Mapping mechanisms to RFC-5 tiers

| Mechanism (source) | T0 (env-only, framed stdout) | T1 (structured envelope) | T2 (long-lived duplex worker) |
| --- | --- | --- | --- |
| Reserved env-key namespace [L §1.1] | **Core.** `NETSCRIPT_*` reserved keys are the whole contract | Same keys, may also mirror in envelope | Same keys at spawn; per-attempt values must move off env (see below) |
| Inline credential in env (`AWS_SESSION_TOKEN` style) [L §1.1] | Workable: token minted at spawn, process is one attempt | Workable | **Breaks**: env is fixed at spawn, but a T2 worker serves many attempts → per-attempt tokens can't ride env |
| Env → pointer → local HTTP endpoint (`AWS_CONTAINER_CREDENTIALS_FULL_URI` + auth token) [L §1.3] | Optional (T0 tasks may never call back) | **Core**: env carries `NETSCRIPT_CALLBACK_URL` + bootstrap token; real per-attempt credential fetched/refreshed over loopback | **Core**: bootstrap token in env authenticates the *worker*; per-attempt tokens delivered in each task-dispatch frame over the duplex channel |
| Per-environment random bearer token as SSRF fence [L §1.4] | n/a (no callback) | **Required** on the loopback oRPC surface | **Required**; also gates the duplex channel handshake |
| Per-attempt task token, invalidated on retry [T §2.1–2.2] | Implicit: process lifetime ≈ attempt; token in env is per-attempt by construction | Token in envelope/env; result frame must echo it | Token per dispatched task message; completion/progress verbs carry it |
| Heartbeat as liveness + cancellation carrier [T §2.4] | Not available (stdout is one-way; cancellation = signal/kill only) | Progress frames double as heartbeats; cancellation via response only if transport allows | **Core**: heartbeat verb on duplex channel, cancellation delivered on it ("Activities that don't Heartbeat can't receive a Cancellation") |
| Bound-object claims + uid-exact-match + issuer liveness check [K §3.2] | Claims exist in whatever token is minted; verification is supervisor-side anyway | Same | Same; uid-analog = execution record identity, guards name-reuse |
| Audience binding [K §3.1–3.2, X §4] | `aud` = this supervisor instance's callback endpoint | Same | Same, plus per-channel audience for the duplex socket |
| Bounded TTL + refresh at %TTL [K §3.1–3.2] | TTL ≥ task timeout; no refresh (single shot) | Refresh via callback if task may outlive TTL | Refresh verb on the channel (kubelet-at-80 %-TTL model) |
| File-mounted token, rotated in place [K §3.1] | Alternative T0 delivery when env size (4 KB precedent [L §1.1]) or process-listing exposure is a concern: `NETSCRIPT_TOKEN_FILE` (mirrors `AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE` [L §1.3]) | Same option | The only file-based way to rotate for long-lived workers without a callback |
| RFC 8693 exchange (`act`, scope-downgrade) [X §4] | Out of scope | Optional derive-credential verb | Natural fit: worker exchanges bootstrap credential per attempt or for sub-process delegation |
| Offline attenuation chains (Macaroon/Biscuit) [M, B] | Shape of the credential if signed-list option chosen; T0 task treats it as opaque bytes | Task may attenuate before handing to a subprocess (offline, no supervisor round-trip) | Same; sealing [B §5.4] before handing to untrusted plugin code |

Tier-boundary conclusion the table forces: **T0/T1 can be credential-per-spawn (env-delivered);
T2 cannot** — per-attempt fencing at T2 requires the credential to travel in the task-dispatch
message (Temporal's model: token is a field of ActivityInfo delivered with the task [T §2.2]), with
env carrying only the worker-identity bootstrap token (Lambda metadata-token model [L §1.4]).

---

## 3. Credential shape candidates

### Candidate A — opaque per-attempt token (Temporal/Lambda-metadata style)

Random bytes minted by the supervisor at attempt start, stored server-side against
`{executionId, attempt, capabilities, expiry}`; delivered as `NETSCRIPT_TASK_TOKEN` (T0/T1) or in
the dispatch frame (T2). Verification = KV lookup on the supervisor.

- **For:** trivially small (env 4 KB precedent [L §1.1]); revocation is a row delete; the lookup is
  simultaneously the K8s-style liveness check ("If the bound object no longer exists,
  authentication fails" [K §3.2]) — attempt fencing is free because the row for attempt N is
  replaced when attempt N+1 is minted, exactly the Temporal invalidation semantics [T §2.1]; no
  crypto to specify in RFC-5; leaks reveal nothing about scope.
- **Against:** every verification is a supervisor-state read (fine for a *loopback* callback —
  verifier == minter == state owner); no offline attenuation — a task cannot narrow the credential
  for a subprocess without a supervisor round-trip (would need an RFC 8693-style exchange verb
  [X §4]); scope is invisible to the holder (debuggability: needs an introspection endpoint).

### Candidate B — signed capability list (K8s-JWT / Biscuit style)

Structured claims — `sub` = executionId, `attempt`, `aud` = callback endpoint, `exp`/`iat`/`jti`,
plus a capability block (`enqueue: [queues…]`, `kv_prefix`, `stream_topics`, `progress: true`) —
signed by the supervisor (HMAC suffices per the macaroon argument: verifier and minter are the same
process [M §5.3]; Ed25519 chain if third parties must verify [B §5.4]).

- **For:** self-describing (audit/debug by decoding); offline attenuation possible with a
  macaroon/biscuit construction — task appends caveats before delegating to a child, no supervisor
  round-trip [M §5.3, B §5.4]; supervisor restart-tolerant (stateless verify of signature+expiry);
  the capability block doubles as documentation of the task's declared surface.
- **Against:** K8s's own warning applies in full — offline validation "cannot verify whether the
  bound object still exists" [K §3.2], so **attempt fencing still demands a live check** that
  `(executionId, attempt)` is current; therefore a pure-signed design does not eliminate the
  state lookup, it only adds a second thing to verify. Size: the K8s claim set example is already
  substantial [K §3.2] and env totals have a 4 KB precedent [L §1.1]. Revocation needs
  infrastructure (Biscuit revocation-id lists [B §5.4]). More RFC surface to freeze (alg, claim
  names, canonicalization).

### Recommendation shape (grounded synthesis)

**Hybrid, weighted toward A:** opaque token as the *authenticator*, with the supervisor-side record
holding the capability list — because the verifier is the loopback supervisor itself, Candidate B's
only unique win (stateless/third-party verification) is mostly unused, while its unique cost
(fencing still needs the lookup [K §3.2]) is unavoidable. Keep B's *claims vocabulary* as the
**shape of the server-side record and of the introspection response**, so a later move to signed
tokens (or to macaroon-style holder attenuation for sub-delegation) changes encoding, not model.
The RFC 8693 exchange verb is the extension point for derivation when it's needed [X §4].
UNVERIFIED: no source in this extract benchmarks lookup-per-request cost; for a loopback endpoint
this is asserted negligible, not measured.

---

## 4. Fixing D-9: allowlisted env + credential as THE Tier-0 contract

D-9 (`Deno.env.toObject()` as env base) is fixed by adopting Lambda's reserved-namespace inversion
[L §1.1] wholesale:

1. **Constructed base, never inherited.** The subprocess env is built from scratch:
   (a) a minimal platform hygiene set — Lambda's unreserved list (`PATH`, `LANG`, `TZ`,
   `PYTHONPATH`, `NODE_OPTIONS`… [L §1.1]) is the model for what a language runtime legitimately
   needs; (b) the reserved `NETSCRIPT_*` block; (c) task-declared user env (`permissions.env`
   allowlist), values literal, never expanded [L §1.1]. Inheritance from the supervisor is
   opt-in per key, matching the audit's proposed fix for D-9.
2. **Reserved block = identity + endpoint + credential**, mirroring Lambda's triad [L §1.1, §1.4]:
   - identity: `NETSCRIPT_TASK_ID`, `NETSCRIPT_EXECUTION_ID`, `NETSCRIPT_ATTEMPT` (also closes the
     audit's D-5 "expose ATTEMPT to the subprocess" remedy), `NETSCRIPT_TIER`
   - endpoint: `NETSCRIPT_CALLBACK_URL` (loopback host:port, the `AWS_LAMBDA_RUNTIME_API` /
     `AWS_CONTAINER_CREDENTIALS_FULL_URI` slot [L §1.1, §1.3])
   - credential: `NETSCRIPT_TASK_TOKEN` (or `NETSCRIPT_TASK_TOKEN_FILE` for the file variant
     [L §1.3, K §3.1])
   Reserved keys are rejected in task config, exactly as Lambda rejects setting reserved keys
   [L §1.1].
3. **This is tier-complete for T0.** A T0 task that never calls back simply ignores the endpoint
   and token; its *entire* contract is env-in, framed-stdout-out — and because the env is now a
   closed, enumerated document, D-9 is closed *by the same mechanism* that delivers the credential.
   Budget discipline: keep the reserved block comfortably under the 4 KB total-env precedent
   [L §1.1].
4. **Version-locking precedent:** Lambda locks env at publish [L §1.1]; NetScript analog — the
   reserved-key *set* is versioned with the RFC-5 protocol version the task declares, so adding
   keys is additive per tier version, mirroring "clients should ignore unknown fields" [L §1.4].

## 5. What the loopback oRPC callback surface must verify per request

Synthesis of [L §1.4] (bearer + minimal error taxonomy), [K §3.2] (bound-object verification
order), [T §2.1] (attempt invalidation), [B §5.4] (checks-all-must-pass):

Per request, in order:

1. **Transport gate:** request arrived on the loopback listener the supervisor bound (the endpoint
   it advertised in `NETSCRIPT_CALLBACK_URL`). UNVERIFIED: no source in the extract documents
   loopback-only binding as a stated requirement (the AWS container-creds page explicitly lacks it
   [L §1.3 note]); asserted as NetScript design intent, with the token — not the interface — as the
   actual authenticator, per the SSRF defense-in-depth rationale [L §1.4].
2. **Token presence + validity:** `Authorization: Bearer` (or envelope field); unknown/expired →
   401-equivalent, wrong verb shape → 405-equivalent, mirroring the Lambda metadata error taxonomy
   [L §1.4]. Expiry checked against the record's TTL (bounded lifetime discipline [K §3.1]).
3. **Liveness of the bound execution (the K8s TokenReview step):** the `(executionId, attempt)`
   the token resolves to must (a) exist, (b) be the *current* attempt, (c) be in a running state.
   Exact-match discipline per "the bound object's `metadata.uid` must match exactly" [K §3.2];
   stale attempt → reject, which is the Temporal invalidation semantic enforced server-side
   [T §2.1]. A cancellation-pending state may, K8s-style, allow a short grace window
   (their 60 s-past-deletionTimestamp rule [K §3.2]) for final progress/result flush — policy knob,
   not a requirement.
4. **Audience/instance check:** token was minted by *this* supervisor instance for *this* endpoint
   (defends against replay across supervisor restarts or across projects sharing a machine) —
   the audience-binding warning [K §3.2].
5. **Capability check per verb, all-must-pass** [B §5.4 "must comply with all checks"]:
   - `enqueue(queue, payload)` → queue ∈ granted queue list
   - `kv get/set(key)` → key has granted prefix
   - `stream publish(topic, event)` → topic ∈ granted topics
   - `progress(payload)` / `heartbeat` → progress capability granted; **side effect:** response
     carries pending cancellation, the Temporal heartbeat-as-cancellation-carrier pattern [T §2.4]
     (this also gives D-12's missing progress channel an authenticated home)
   - `complete/fail(result)` → always permitted to the *current-attempt* token holder and to no one
     else [T §2.2]; terminal — subsequent requests with the same token fail the liveness check.
6. **No ID-tuple bypass:** mutating verbs authenticate by token only; completion-by-IDs (Temporal's
   `ActivityId/WorkflowId` alternative [T §2.1]) is exactly the fencing bypass and must not exist
   on this surface.
7. **Audit trail:** log `{executionId, attempt, verb, capability-decision}` per request — the
   Access-Analyzer loop ("generate a policy template with only the permissions the function used"
   [L §1.2]) applied to task capability declarations: observed usage tightens declared scope.

---

## 6. Steal-candidate summary

1. Reserved `NETSCRIPT_*` env namespace with rejected-if-user-set keys; constructed allowlisted
   base env (closes D-9) [L §1.1].
2. Env carries pointer+bootstrap-token, loopback endpoint serves the real per-attempt material
   (`AWS_CONTAINER_CREDENTIALS_FULL_URI` + `AUTHORIZATION_TOKEN` split) [L §1.3, §1.4].
3. Opaque per-attempt task token, invalidated by retry; echo-token-on-complete; no ID bypass
   [T §2.1–2.2].
4. Bound-claims verification order incl. exact-identity match + liveness lookup + deletion grace
   window (TokenReview discipline) [K §3.2].
5. TTL floor/default + refresh-at-80 %-TTL cadence for T2 credential refresh [K §3.1–3.2].
6. Heartbeat verb as cancellation carrier and progress channel [T §2.4].
7. Capability record vocabulary (aud/exp/jti/attempt + enqueue/kv-prefix/topics/progress) shaped so
   a later signed/macaroon encoding is a re-encoding, not a redesign [K §3.2, M §5.3, B §5.4].
8. RFC 8693 exchange verb reserved as the derivation/downscope extension point (`act` chains for
   sub-delegation) [X §4].

## 7. Open questions

1. Loopback binding: no fetched source states loopback-only listener requirements or the credential
   JSON response shape [L §1.3 note] — RFC-5 must specify both from scratch (UNVERIFIED territory).
2. Does Temporal authenticate heartbeats with the task token? Extract is silent [T §2.4 note];
   RFC-5 should decide independently (recommended: yes, same token).
3. T2 credential rotation without a callback round-trip: file-based rotation (K8s projected volume
   model [K §3.1]) vs in-band refresh verb — which does RFC-5 mandate, which is optional?
4. Should T0 tokens exist at all when the task makes no callbacks — is minting unconditional (audit
   uniformity) or capability-gated (less secret material in process listings/env dumps)?
5. Grace-window semantics for cancellation-pending attempts (K8s 60 s analog [K §3.2]): may a
   fenced-out attempt still flush final progress diagnostics, or is rejection absolute?
6. Macaroon paper's formal treatment of contextual caveats unavailable (PDF not extractable) — if
   holder-side attenuation is ever promoted from extension to core, refetch/verify the paper first.
