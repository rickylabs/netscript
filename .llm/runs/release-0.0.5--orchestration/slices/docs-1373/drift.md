# Drift: #1373

## 2026-08-09 — live issue has 12 acceptance rows

The dispatch summarizes eight rows, while the live issue contains four additional close-gated
rows: zero unresolved aliases in code samples, a focused non-default CLI test, and two negative
docs gates. This is minor scope clarification, not product rescope; all 12 remain required for the
closing PR.

## 2026-08-09 — published source count refined from 208 to 192

The initial shell count excluded selected private directories by name. The durable gate correctly
excludes every underscore-prefixed directory and reports 192 actual publishable `.md`/`.vto`
sources. The plan and evidence use 192; no content scope changed.

## 2026-08-09 — quickstart command mirror is not the executable source

CI correctly found the documented quickstart command and `QUICKSTART_DOCUMENTED_COMMANDS` unequal.
Opening the gate showed the constant is only the drift-test contract; `createQuickstartGates()`
constructs the command independently. Updating only the constant would make the comparison green
without executing `--with-client`. The correction therefore changes both seams and adds a focused
assertion on the executable gate. The real walk is Aspire/container-backed and remains unrun until
a serialized token is durably granted.
