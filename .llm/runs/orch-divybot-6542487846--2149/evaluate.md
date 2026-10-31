# IMPL-EVAL round 2 — FAIL_FIX; evaluation cap reached

IMPL-EVAL round 2 fails on one small docs blocker: chapter 3 of the workspace tutorial still says chapter 2 migrated the primary database. Every other repair I asked for in round 1 is correct.

**Blocker: stale chapter 2 references in the workspace tutorial**
- `docs/site/tutorials/workspace/03-workspace-data.md:40`: the "Before you begin" check is `netscript db status  # primary datasource is migrated (chapter 2)`. The repaired chapter 2 now skips the auth migration on its kv-oauth track, and nothing else in chapters 1–2 migrates the primary datasource. A reader running this check will get an unmigrated result, while the comment says to expect a migrated one.
  - Fix: make the check confirm only that the primary datasource is reachable while Aspire is up, or drop that line.
- `docs/site/tutorials/workspace/01-scaffold.md:144-145`: says `db init`, `db generate` and `db seed` are used "from chapter 2 onward". Chapter 2 now runs them only on the better-auth side path; chapter 3 is where they are first required.
  - Fix: change it to chapter 3, or "on later chapters".

After the fix, regenerate the matching rows in the agent-docs prose carrier.

**Repairs from round 1 that now check out**
- **add-authentication recipe:**
  - The prerequisite now asks for KV only and says SQL is needed only for better-auth.
  - Step 4 only runs the migration when `NETSCRIPT_AUTH_BACKEND` is `better-auth`, defaulting to kv-oauth. The text explains how to switch backends with `--force` and that existing tables are kept.
  - The recipe test now asserts the default kv-oauth path skips the migration and still exports credentials before Aspire.
- **Tutorial chapter 2:** the outcome, Step 3 and the summary describe KV sessions with no auth SQL tables. The better-auth path appears only as a conditional aside.
- **Other pages:**
  - `index.md`, `01-scaffold.md`'s `--db postgres` row, `03-workspace-data.md`'s isolation wording, `06-deploy.md`, `glossary.md` (both rows), `cli-reference.md`, `identity-access/auth.md` and `plugins/auth/README.md` now tie the auth schema and SQL requirement to better-auth.
  - `data-persistence/database.md` was already correct.
  - No remaining text says auth always installs `auth.prisma` or `auth_users`.
- **Debt entry:** `CLI-INSTALL-PERSISTENCE-SELECTION-SHAPE` has an ID, reason, cost, the reason for deferring, owner, target, linked plan, status and a closing gate. That gate includes the coordinator's `scaffold.runtime` verdict, and the line and folder growth it records is stated honestly.
- **Code:** nothing has changed since the round 1 source review, which found no blockers.

The full `scaffold.runtime` suite is still unproven; coordinator CI has to run it, and that is not waived.

VERDICT: FAIL_FIX

Two consecutive FAIL_FIX verdicts terminate this leaf. No third evaluation was launched.
