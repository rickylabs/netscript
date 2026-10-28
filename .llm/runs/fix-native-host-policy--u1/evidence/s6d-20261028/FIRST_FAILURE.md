# S6d first actual run: native endpoint text assumption failed

Executed source161 lines, SHA256 c5cd5dfc31cd78be0271d54b12ccfda8a7633adecaa5ca85af6489bf4a553096.
Owning suite7 passed /1 failed /0 ignored in12490ms. Seven-file nonempty types/lint/fmt and
new-owner quality0 findings/0 allowances passed. First source and all raw receipts are immutable.

The bind row reached native Deno.errors.AddrInUse after observing the selected upstream occupied.
Actual message contains no endpoint:

```text
Une seule utilisation de chaque adresse de socket (protocole/adresse réseau/port) est habituellement autorisée. (os error 10048)
```

The assertion requiring message.includes('127.0.0.1:' + front) failed. This is an invalid test
assumption about native localized error text; it does not qualify the intended endpoint oracle.
The blocker-preservation assertion and normal-path upstream rebind were therefore not reached.
Failure cleanup closed the owned blocker and rebound both front/upstream without any secondary
AggregateError. Child status/stdout/stderr/stdin settled. Sentinel and CORS rows were not run.

All116 protected bindings match. Eighteen captured runtime-fixture children settled; seven owned
paths are absent; twelve native addon hashes match. Frozen S4 watchdog/output controls retain their
separate behavior. No production/helper/permission/config/debt/lock changes or test skips.

Returned to root before any correction. Proposed narrow replacement is structural endpoint proof
through the actual owned blocker.addr, native serve port/hostname and the caller getter boundary,
with exact native AddrInUse and actual blocker-preserving refusal/postclose rebind retained.
No claim that native error text includes an endpoint; no localization regex or new permission.
