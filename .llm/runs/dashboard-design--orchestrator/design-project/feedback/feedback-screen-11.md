# Feedback — S11 DB Migrations & Drift

**Screen:** `S11 Migrations` (lines ~1087–1162) · route `migrations`
**Intent:** "did I forget to apply a migration, or has the DB drifted from schema?"
**Verdict:** Correctly scoped (migration+drift state only, not a data browser). Tie the two
answers together.

## Working
- Migration table (`20260701_init` applied, `20260703_add_orders` applied, `20260706_add_receipts`
  PENDING), drift alert, introspect diff `code-block`, "Run migrate" with CLI-equivalent
  `netscript db migrate`, and the transient prisma-engine-flake note ("re-run clears").

## Findings

### P1 `[DATA]` The pending count must equal S1's "1 pending migration"
S1's stat card claims "1 pending migration." S11 must show exactly that one (`add_receipts`
PENDING) and nothing contradictory. Cross-check the number — it's a deep-link target, so a
mismatch is immediately visible.

### P2 `[UX]` The drift alert and the introspect diff should describe the SAME drift
"Schema drift on `orders`: column `status` type mismatch" (alert) and the fenced introspect diff
should be two views of one drift, not two independent mocks. The e2e question has two halves —
"forgot to apply" (pending row) and "drifted" (alert+diff) — and both halves must point at
concrete, matching evidence for the screen to actually answer it.

### P2 `[UX]` "Run migrate" is destructive-adjacent — confirm-gate it like every other mutation
Applying migrations changes the DB. Use the same confirm dialog (from→to summary + CLI-equivalent)
as S3/S12, and per the prompt keep it a **read-only preview of what would apply** until confirmed.
Also apply the beta.6 read-only convention (README cross-cutting #2) if migrate isn't wired yet.

### P3 `[DX]` Keep the prisma-engine-flake note — it's real operator empathy
The "transient Prisma schema-engine crash self-clears on re-run" note matches a known repo flake.
That's exactly the kind of only-we-know-this hint that builds trust; keep it in the error state.

## Best-in-class delta
This screen deliberately sits *off* the Appwrite/Directus schema-CRUD axis — those tools generate
data-browse/edit UI from schema, which NetScript delegates to Aspire + the `db` surface. S11's
narrow "migration + drift state" scope is the right complementary call (Aspire shows the DB
resource is *up*; it never shows migration state — the frequent "why is my query failing" root
cause). Don't let it grow toward a query console; the discipline here is a feature.
