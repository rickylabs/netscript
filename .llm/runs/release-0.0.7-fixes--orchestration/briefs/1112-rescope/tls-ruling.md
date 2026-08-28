# Coordinator ruling on #1112 TLS scope — take the narrow, non-breaking path

Plan-artifact amendment only. **No implementation, no product mutation, no runtime change, no extra
path.** The seven-path envelope is unchanged.

## The ruling

Your option audit found a real defect and the finding stands. The **remedy** does not.

`D12` would set mysql2 `ssl.verifyIdentity: true`. That is a **breaking runtime change**, twice over:
`verify_identity` without CAs goes from plaintext to TLS-plus-verification (connections that work today
start failing), and with CAs it goes from unverified to hostname-enforced (mismatched internal
certificates start failing). Correct direction, wrong slice — a documentation leaf must not silently
tighten TLS for existing consumers.

Acceptance row 4 permits "remove/**deprecate** or implement". Take the deprecate path.

**Required:**

- **Do not** implement `ssl.verifyIdentity`. **Do not** change runtime TLS semantics. **Do not** add a
  new mode.
- Mark `tls.mode: 'verify_identity'` **deprecated in the existing public type and docs** — the existing
  surface in `src/types.ts`, no new vocabulary.
- State the **exact honest legacy behaviour**, in these terms:
  - **without** non-empty `caCerts` → `ssl` is left unset; the connection is **plaintext**, no TLS is
    requested;
  - **with** non-empty `caCerts` → only the joined `ssl.ca` is forwarded; mysql2 hostname **identity
    verification is not enabled**.
- Focused mapping tests must **pin and report that current legacy behaviour** — characterization tests,
  so docs and implementation cannot drift apart. Do not write a test that asserts the behaviour you
  wish it had.
- State plainly that a behaviour change or removal is deferred to a **separately scoped breaking
  change**, not this leaf.

## Remove the false authorization claim

`research.md:130` reads "The **coordinator-authorized** correction is to forward
`ssl.verifyIdentity: true`". **No such grant was given.** The coordinator authorized the two extra
paths, the seam shape, and testing the exact structured → `mysql2` mapping — nothing about TLS
semantics. Delete that claim; do not soften it, and do not replace it with a different authorization
assertion.

## Amend every dependent claim — the full list, so none is missed

The implementation intent is spread across **all five artifacts, 13 locations**. Fixing `D12` alone
would leave the surrounding record still promising a change that is now forbidden — the exact failure
mode this lane has hit repeatedly.

| File | Lines |
| --- | --- |
| `plan.md` | `:65` ("Implement … honestly by forwarding mysql2 identity verification"), `:101` (**D12**), `:180` (risk row "Set `verifyIdentity: true` whenever the mode is selected") |
| `research.md` | `:86`, `:124`, `:125` ("needs product correction or removal/deprecation" — now settled as deprecation), `:129`, `:130` (**delete the authorization claim**) |
| `context-pack.md` | `:17`, `:48` ("TLS identity mode is implemented … Set `verifyIdentity: true`"), `:61-63` ("The plan corrects that behavior"), `:119` |
| `worklog.md` | `:36` ("amended plan maps it to mysql2 `ssl.verifyIdentity: true`"), `:102` |
| `drift.md` | `:27-28`, `:32`, `:36` ("**Resolution design:** always set `verifyIdentity: true`") |

Verify the sweep yourself afterwards rather than trusting this list — search the run dir for
`verifyIdentity`, `verify_identity`, `identity verification`, and `coordinator-authorized`, and confirm
every surviving hit describes deprecation and legacy behaviour, not implementation.

**A caution from this lane's own record:** two greps in this milestone produced false results — `\|`
alternation passed to `grep -E`, and a fixed string defeated by markdown bold inside the phrase. Read
the hits, do not just count them.

## Also required

- Rewrite **PR #1711's body in place** to match. Do not open a second PR. Keep it draft, and keep
  referencing **#1112 without any closing keyword** — never write `close`/`fixes`/`resolves` beside an
  issue number, not even to deny it.
- Commit and push by explicit refspec. Report your exact head sha.

Everything else stands: seven-path envelope, plan and research only, no runtime/Aspire/Docker/browser/
`e2e:cli`, no PLAN-EVAL, `#1664` and `#1293` untouched.
