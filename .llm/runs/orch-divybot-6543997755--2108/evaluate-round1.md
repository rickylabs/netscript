**IMPL-EVAL round 1: PASS.** I found no blockers in the implementation, the evidence, the docs or the close-gate contract. Two actions are required before you mark the PR ready (below).

**What I verified**
- **Runtime proof logic holds up.**
  - **Saga replay:** the test saga adds one to `count` on each step and only reaches `completed` on the final message. Five messages are published, two of them duplicates, yet the final state is `completed` with count and version both 3. That only happens if each duplicate was applied zero times, and a transient match can't fake it.
  - **Runner outside Aspire:** the Aspire saga child is confirmed stopped before the direct runner starts. That runner gets a cleared environment with only KV settings and must report ready. It must not exit before the stored state advances.
  - **Job and trigger:** both are proven by stored completed records for the exact job and event ID, not just by the request being accepted.
  - **Resource health:** every runnable resource must be Running and Healthy and must have no database environment variable. The background children are checked with the existing readiness probe, and streams through its `/health/ready` endpoint.
- **The retained consumer matches the receipt.** I read its files without running anything:
  - `Databases` is empty.
  - `RequiresDb` is false on all five API entries and all three background entries.
  - Every plugin service entrypoint points at local branch source.
  - The receipt shows `ok`, count and version 3, the runner-outside-Aspire flag, and cleanup PASS.
- **Docs:** the new KV-only recipe in `add-a-plugin.md` uses commands and flags that exist (`plugin auth backend set` follows the order this page already documented). It states the background-readiness requirement and the shared store/projection settings. The old release-gate note is confirmed absent. The only change to the generated docs bundle is the edited page.
- **Public hygiene:** the run record, fixture and docs contain no operator paths, hostnames, allocated ports or session IDs. The auth key is deliberately public test material passed through the process environment, and no external OAuth login is claimed.
- **Scope and gates:** there is no `deno.lock` change and no new CI tier, label or milestone change. Leak-check left the one unknown-owner entry alone and found no owned survivors. The three source mutations each fail their targeted test, and the JSR audit adds no new public surface.

**Required before marking ready (not implementation defects)**
1. After the S2 commit, rerun `check:assets-barrel` on the committed head and record that it exits 0.
2. Rewrite the PR body. It still says "Plan & Design — READY FOR REVIEW". It should:
   - Keep `Refs` and no closing keyword.
   - List the scaffold and generator fixes.
   - Say plainly that local-source installs now launch branch source instead of the published JSR release, while public installs keep their pinned JSR versions.
   - Say the e2e-cli `scaffold.runtime` CI verdict is required and has not been run here.
   - Say there is no KV-only CI tier, and propose the KV variant as the follow-up.

**Carried forward from S1, still non-blocking:** with no jobs, the generated workers registry still imports `jobRetryRegistration` without using it. And the new local package lookup has no focused unit test; only the heavy consumer test would catch a revert.

VERDICT: PASS
