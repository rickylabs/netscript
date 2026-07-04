# PROPOSED LABELS PATCH — `.github/labels.yml`

> **NOT APPLIED.** The live `.github/labels.yml` is untouched on the plan branch (#397 stays pure
> planning). This diff is applied in the morning as a normal reviewed edit **on the merge**, not on
> the plan branch.
>
> **Live-repo reality (read-only sweep this session):** the repo **already carries** `wave:v1`,
> `wave:v1-min`, `wave:defer`, `epic:ai-stack`, `epic:deployment`, `epic:harness-v3`,
> `epic:roadmap-reforecast`. The `.github/labels.yml` *file* declares **none** of them — it is stale.
> So this patch is mostly **documentation catch-up** (recording labels that already exist), plus the
> **3 genuinely new** epic labels the roadmap needs:
> `epic:telemetry-revamp`, `epic:dev-dashboard`, `epic:docs-cut`.
>
> **Repo-side `gh label create` is therefore only the 3 new epic labels** — the `wave:*` block below
> already exists live and needs no `create`. (`add-first, never delete-live` per netscript-pr; this
> patch only adds.)

## Unified diff

```diff
--- a/.github/labels.yml
+++ b/.github/labels.yml
@@ -149,6 +149,43 @@
 - name: "gate:jsr"
   color: "d4c5f9"
   description: "Run the JSR publish/audit gate"
 
+# ── epic: multi-slice program epics (umbrella grouping) ──────────────────────
+- name: "epic:ai-stack"
+  color: "5319e7"
+  description: "NetScript AI Stack epic (#238)"
+- name: "epic:telemetry-revamp"
+  color: "5319e7"
+  description: "Telemetry revamp epic (Spine-1 enabler)"
+- name: "epic:dev-dashboard"
+  color: "5319e7"
+  description: "Dev Dashboard epic (Spine-1 headline, ships as a plugin)"
+- name: "epic:docs-cut"
+  color: "5319e7"
+  description: "beta.7 docs release cut epic (tutorials + positioning)"
+- name: "epic:deployment"
+  color: "5319e7"
+  description: "Enterprise deployment epic (#327)"
+- name: "epic:roadmap-reforecast"
+  color: "5319e7"
+  description: "beta.3->stable roadmap re-forecast epic (#391)"
+- name: "epic:harness-v3"
+  color: "5319e7"
+  description: "Agentic Workflow Doctrine V3 epic (#389)"
+
+# ── wave: release-train bucket (maps to milestone) ───────────────────────────
+- name: "wave:v1"
+  color: "c2e0c6"
+  description: "v1 release train (beta.5-beta.8 cuts)"
+- name: "wave:v1-min"
+  color: "c2e0c6"
+  description: "v1 minimal-cuttable-bar work"
+- name: "wave:defer"
+  color: "c2e0c6"
+  description: "Deferred to stable or backlog"
+
 # ── cross-cutting flags ──────────────────────────────────────────────────────
 - name: "rfc"
   color: "5319e7"
   description: "Request for Comments — substantial/breaking design change"
```

## Repo `gh label create` list (morning)

Only the labels **not already live** — verified this session:

```
epic:telemetry-revamp   5319e7   "Telemetry revamp epic (Spine-1 enabler)"
epic:dev-dashboard      5319e7   "Dev Dashboard epic (Spine-1 headline, ships as a plugin)"
epic:docs-cut           5319e7   "beta.7 docs release cut epic (tutorials + positioning)"   # only if OF-2 Opt-2
```

Everything else in the diff (the `wave:*` block + `epic:ai-stack/deployment/harness-v3/
roadmap-reforecast`) **already exists on the repo** and must **not** be re-created — the diff only
reconciles the file to match live state.

## Notes

- Colors: epics reuse the umbrella purple `5319e7` (matches `type:umbrella`); `wave:*` uses a light
  green `c2e0c6` (any unused hex is fine — cosmetic; adjust to house preference).
- If the owner picks **OF-2 Opt-1** (rescope #232), drop the `epic:docs-cut` line from both the diff
  and the create-list.
- This patch does not delete or rename any existing label (strips nothing off live issues).
