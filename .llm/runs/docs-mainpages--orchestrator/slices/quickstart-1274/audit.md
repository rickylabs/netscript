# Audit — #1274 Quickstart rewrite (opposite-family, evidence-only)

- **Auditor lane:** Claude-family, adversarial, reviewing Codex-authored docs.
- **Under audit:** worktree `/home/codex/repos/ns-quickstart`, branch `docs/quickstart-1274-work`,
  commits `a6d7f27` + `4ab0107`. Files: `docs/site/quickstart.vto` (277 lines),
  `docs/site/tutorials/storefront/01-scaffold.md` (238 lines).
- **Evidence basis:** live `--help` from `packages/cli/bin/netscript.ts` (v0.0.4), `packages/cli` /
  `packages/mcp` / `packages/service` source, and a **real end-to-end scaffold walk executed in this
  lane** (scaffold → `aspire restore`/`start` → `db init|generate|seed` → `deno task check` →
  `contract add`/`add-route`/`service add`/`add-handler`/`ui:add` → teardown). The generator's
  `report.md` was treated as claims only; two of its validation statements are refuted below.
- **Verdict: FAIL_FIX.**

---

## Verdict summary

| Gate | Subject | Result |
| --- | --- | --- |
| 1 | Command and flag accuracy | **PASS** (2 minor notes) |
| 2 | Claims that contradict the issue | **FAIL** — 2 of 3 confirmed, 1 refuted (blocking) |
| 3 | The wave-6 test, applied literally | **FAIL** — 2 blocking, 9 major |
| 4 | Sync with `storefront/01-scaffold.md` | **FAIL** — 7 live divergences |
| 5 | Orientation over length | **PARTIAL** — 3 acceptance items unmet, 1 padding block |
| 6 | Site gates | **PASS** |

The page is a large, genuine improvement in orientation. It fails on one thing that matters more
than everything it fixed: **its own verify gate cannot be satisfied on a fresh scaffold**, for a
reason the page does not disclose and partly *causes* by recommending the broken import mapping.
Three of seven boxes are red on a clean walk. A wave-6 agent instructed "satisfy its checklist, then
build" either halts or learns on its first task that this page's hard rule is decorative.

---

## Gate 1 — Command and flag accuracy: **PASS**

Every command and flag on both pages was checked against live `--help` and, where marked, executed.

### Commands executed successfully in a real scaffold

```sh
# in /tmp/.../scratchpad
deno run -A packages/cli/bin/netscript.ts init my-app --db postgres --service --yes   # exit 0
#   → "Created: 218 files, 45 directories"; example service defaults to name "users"
cd my-app/aspire && aspire restore                                                    # exit 0
aspire start                                                                          # exit 0
netscript db init --name init                                                         # exit 0
netscript db generate                                                                 # exit 0
netscript db seed                                                                     # exit 0
netscript contract add orders                                                         # exit 0
netscript contract add-route orders recent --method GET --path /orders/recent         # exit 0
netscript service add --name orders                                                   # exit 0
netscript service add-handler orders recent                                           # exit 0
netscript ui:add page orders --island --project-root apps/dashboard                    # exit 0
netscript plugin install worker --name workers --dry-run --ci --skip-confirmation     # exit 0
aspire stop --apphost ./apphost.mts                                                   # exit 0
```

### The generator's three "corrected the issue's syntax" claims — all CONFIRMED

- `contract add-route orders recent --method GET --path /orders/recent` — correct. `--method` and
  `--path` are both `(required)` per live help; usage line is
  `add-route <contract> <procedure> --method <method> --path <route>`. Executed; the `recent`
  procedure landed in `contracts/versions/v1/orders.contract.ts` and **survived** the subsequent
  `service add --name orders` (verified: `route({ method: 'GET', path: '/orders/recent' })` still
  present after the service was added).
- `service add --name orders` — correct. `--name` is not merely documented, it is enforced:
  `packages/cli/src/public/features/plugins/.../install-plugin-command.ts` pattern
  `requireString('--name', options.name)` is mirrored in
  `packages/cli/src/public/features/services/add/add-service-command.ts`; `service add` has no
  positional argument (`Usage: netscript service add`).
- `ui:add table orders` is **not** a valid triad — confirmed. `add-ui-command.ts:58,64,70` branches
  on `kind === 'page'`, `kind === 'island'`, else treats `kind` as a **registry item name**. Live
  `ui:list` enumerates `data-table` and `responsive-table`; there is no `table`. `ui:add table
  orders` would fail registry resolution.

### Other verified forms

- Install form: `deno install --help` on deno 2.9.3 confirms `-g`, `-A`, `-f`, `-n`, and
  `--minimum-dependency-age`. Correct on **both** pages.
- `--editor <none|zed|vscode>` — confirmed in live `netscript init --help`.
- `agent init --host claude|vscode|all`, `--editor none|zed|vscode`, `--with-docs` — all three exist
  verbatim in live `netscript agent init --help`.
- `db migrate --name add_orders` — `--name <name>` present in live `db migrate --help`.
- `ui:add page orders --island --project-root apps/dashboard` — `--project-root` is taken **literally**
  (`resolveProjectRoot = projectRoot ? host.resolvePath(projectRoot) : findDeployProjectRoot(cwd)`,
  `public-command-dependencies.ts:192-194`), and `scaffoldUiPage` writes to
  `resolve(projectRoot, 'routes', segment)`. So passing the *app* workspace is required and correct.
  Executed; produced exactly `apps/dashboard/routes/orders/index.tsx`,
  `routes/orders/(_islands)/OrdersIsland.tsx`, `routes/orders/(_shared)/query-loaders.ts`.
  Targeted `deno check --unstable-kv` over all three: **exit 0** — the page's "supplies a compiling
  composition" claim holds.
- `plugin install worker --name workers` — executed with `--dry-run`; both `worker` and `workers`
  resolve to the workers plugin ("Installed worker plugin ... Created 4 plugin files").
- `contract version --help` — exists (`add <name>` subcommand).
- `aspire stop --apphost ./apphost.mts` — `--apphost <apphost>` confirmed in `aspire stop --help`;
  executed, exit 0.
- Scalar path `/api/docs` — confirmed at
  `packages/service/src/presets/define-service.ts:17` ("Scalar docs at /api/docs").
- `<fresh-app-url>/design/composition` — confirmed:
  `apps/dashboard/routes/(design)/design/composition.tsx` exists in the scaffold.

### Minor notes (not blocking)

- **minor-1.** `--minimum-dependency-age` is marked `(Unstable)` by `deno install --help` on
  2.9.3. The page presents it without qualification. Low risk, but a reader on a future Deno that
  renames it gets no signal. Optional one-clause addition.
- **minor-2.** Storefront's enumerated `--help` group list is incomplete — see gate 4, drift-2.

---

## Gate 2 — Claims that contradict the issue

### 2a. "21 MCP tools, not 24" — **page CORRECT**

`packages/mcp/src/domain/tool-types.ts` `TOOL_NAMES` contains exactly 21 entries. I counted them
against the page's seven-family table: every name on the page is in the source, every source name is
on the page, no invented names, no omissions. The issue's "24" is stale (the issue's own table also
enumerates 21).

### 2b. "The CLI already prints db init/generate/seed in Next steps" — **page/report CORRECT**

`packages/cli/src/kernel/application/scaffold/orchestrate-init_test.ts` asserts the full ordered
`initNextSteps` list for `dbEngine: 'postgres'`, including `netscript db init --name init`,
`netscript db generate`, `netscript db seed`. My live scaffold printed them as steps 6–8. The report
is right that no CLI edit was warranted for that acceptance item.

### 2c. "#1254's `@database/zod` single-model limitation no longer applies" — **REFUTED · BLOCKING**

The alias *was* repointed. But the page's characterisation of what that means is wrong, and the
instruction it derives is actively harmful.

**Source:** `packages/cli/src/kernel/templates/workspace/deno-json.ts:43-46` maps
`@database/zod` → `./database/<engine>/schema/.generated/zod/schemas/models/index.ts`, with the
regression test at `generators_test.ts:203-214`. Both exist as the report claims.

**What is actually in that barrel** (from my real scaffold, after `db init` + `db generate`):

```text
database/postgres/schema/.generated/zod/schemas/models/index.ts
  export { UserSchema } from './User.schema.ts';        # ← the entire file
database/postgres/schema/.generated/zod/crud.ts
  export { UserSchema } from './schemas/models/User.schema.ts';
  export { UserInputSchema as UserCreateInput } from './schemas/variants/input/User.input.ts';
  export { UserUpdateInputObjectZodSchema as UserUpdateInput } from './schemas/objects/UserUpdateInput.schema.ts';
```

The **scaffold's own generated contract** imports from the alias:

```ts
// contracts/versions/v1/users.contract.ts:11
import { UserCreateInput, UserSchema, UserUpdateInput } from '@database/zod';
```

`models/index.ts` does not export `UserCreateInput` or `UserUpdateInput`. Consequences, both
reproduced live:

```text
$ deno task check          # after aspire start + db init + db generate + db seed
TS2345 [ERROR]: Argument of type 'QueryClientPort' is not assignable to parameter of type 'QueryClient'.
TS2305 [ERROR]: Module '.../zod/schemas/models/index.ts' has no exported member 'UserCreateInput'.
TS2305 [ERROR]: Module '.../zod/schemas/models/index.ts' has no exported member 'UserUpdateInput'.
Found 3 errors.  error: Type checking failed.

$ cd services/users && deno run -A --minimum-dependency-age=0 --node-modules-dir=none src/main.ts
error: Uncaught SyntaxError: The requested module '@database/zod' does not provide an export named 'UserCreateInput'
    at .../contracts/versions/v1/users.contract.ts:11:10
```

So the repoint did not resolve #1254 (closed) — it traded one defect for a worse one: **the example
service cannot start**, and `deno task check` is red for three reasons, not one. `crud.ts` — the
mapping the page tells readers to migrate *away from* — is the only one that currently satisfies the
scaffold's contract.

**The page says the opposite of the truth here:**

> Current scaffolds map `@database/zod` to the complete generated model barrel. If an older project
> maps it to `.generated/zod/crud.ts`, that legacy alias exposes only the primary CRUD model; update
> the scaffold/import mapping before deriving contracts for additional models.

"Complete" is false (one model schema, zero CRUD input schemas), and the migration advice points at
the broken mapping.

**Also refutes the report.** `report.md:131-145` states the only baseline `deno task check` failure
is the QueryClientPort error and that the full walk "passed"; `report.md:150-153` presents the alias
change as settled. Neither survives execution. The report's proof workspace either did not re-run
`deno task check` after `db generate` on a `--service` scaffold, or did not read all three errors.

**#1287 does not cover this.** `gh issue view 1287` is scoped to the QueryClientPort/`dehydrateQueryClient`
mismatch only. No open issue covers the `@database/zod` barrel regression — `gh issue list --search
"database/zod UserCreateInput"` and `--search "@database/zod barrel crud"` both return empty; #1254 is
CLOSED. **This needs a new issue filed before the page ships.**

---

## Gate 3 — The wave-6 test, applied literally: **FAIL**

I walked the page as an agent with no NetScript knowledge, executing only what it says.

### BLOCKING-1 — three of seven verify boxes cannot be ticked on a clean scaffold, and the page never says so

Executed the page's exact happy path (`init --db postgres --service --yes` → `aspire restore/start`
→ `db init --name init` → `db generate` → `db seed`), then each box:

| Box | Result |
| --- | --- |
| `netscript --help` lists the public command groups | PASS |
| `my-app/` contains `apps/ contracts/ services/ database/ plugins/ aspire/` | PASS |
| dashboard shows Fresh app, **service**, Postgres, Redis healthy | **FAIL** — no process ever ran with cwd under `services/`; the example service crashes on import (see 2c) |
| `netscript db init --name init` succeeded, initial migration exists | PASS (`20260804210210_init/migration.sql`) |
| Fresh app answers at the dashboard URL | PASS (vite dev on an Aspire-assigned port) |
| `<fresh-app-url>/design` renders the design reference | PARTIAL — returns **302**, not 200, to a plain `curl` (see MAJOR-7) |
| `deno task check` passes with no errors | **FAIL** — 3 errors |

The brief says the `deno task check` box is deliberately kept because of the known-open #1287.
**Keeping it is right. Not disclosing it is the defect.** The page contains no mention anywhere —
not in the checklist, not in the "If something is not green" callout — that a fresh scaffold is
currently expected to fail this box, why, or how to tell the known failure apart from the reader's
own breakage. The page's hard rule then reads:

> **Do not begin customising until every box is ticked.** An unverified base makes every later
> failure look like your code.

An agent that obeys this halts permanently. An agent that does not obey it has learned, on task one,
that this page's strongest instruction is not literal — which destroys the rule for the six boxes
that *are* satisfiable. This is the exact failure the gate exists to prevent, inverted.

**Exact replacement** — insert immediately after the "Do not begin customising…" paragraph
(`quickstart.vto:149-150`):

> ```
> {{ comp callout { type: "warning", title: "Two boxes are currently expected to fail" } }}
> On a freshly scaffolded workspace, <code>deno task check</code> reports errors that are ours, not
> yours, and the example service does not reach a healthy state. Both are tracked
> (<a href="https://github.com/rickylabs/netscript/issues/1287">#1287</a> and the
> <code>@database/zod</code> barrel regression). Until they are fixed, treat those two boxes as
> ticked <strong>only if</strong> the errors you see are exactly these:
> <ul>
> <li><code>TS2345 … 'QueryClientPort' is not assignable to … 'QueryClient'</code> in
> <code>routes/examples/&lt;service&gt;/(_shared)/service-showcase.ts</code></li>
> <li><code>TS2305 … has no exported member 'UserCreateInput' / 'UserUpdateInput'</code> from
> <code>@database/zod</code></li>
> </ul>
> <strong>Any other error is yours and must be resolved before you customise.</strong> Re-run
> <code>deno task check</code> after every generator step and compare against this list.
> {{ /comp }}
> ```

This keeps the gate honest, keeps it usable, and keeps it discriminating — which is the whole point.

### BLOCKING-2 — the `@database/zod` section teaches the mapping that breaks the workspace

See gate 2c. **Exact replacement** for `quickstart.vto:233-235`:

> Current scaffolds map `@database/zod` to the generated **model** barrel
> (`.generated/zod/schemas/models/index.ts`), which exports one `<Model>Schema` per Prisma model and
> nothing else. The CRUD input schemas (`<Model>CreateInput`, `<Model>UpdateInput`) live only in
> `.generated/zod/crud.ts`. The scaffold's own example contract still imports those from
> `@database/zod`, so until that is reconciled you must import them from the `crud.ts` path directly:
>
> ```ts
> import { UserCreateInput, UserUpdateInput } from '../../database/postgres/schema/.generated/zod/crud.ts';
> ```
>
> Model schemas — the ones you `pick`/`extend` above — come from `@database/zod` as shown.

### MAJOR-1 — `aspire start` detaches in a non-TTY; the page assumes a human at a terminal

Executed with stdout redirected (exactly how an agent harness runs a command):

```text
Starting Aspire AppHost in the background...
     AppHost:  apphost.mts
   Dashboard:  https://localhost:45603
         PID:  573202
✅ AppHost started successfully.
```

The command **returns**. It does not stay in the foreground, and it prints **no one-time login
token**. The page says:

- §3: "Leave this terminal running and open the dashboard URL and one-time login token that `aspire
  start` prints."
- triage callout: "is `aspire start` still running with its resources healthy"

Both are unusable for the agent this page is written for. Add one sentence after `quickstart.vto:102`:

> If your terminal is not interactive (a CI job or an agent tool call), `aspire start` detaches, prints
> the AppHost PID and dashboard URL, and returns; the resources keep running. Use
> `aspire stop --apphost ./apphost.mts` to stop them, and the MCP `get_app_status` / `doctor` tools
> (below) to read resource health, since the dashboard needs a browser and a login token.

### MAJOR-2 — the page's `aspire start` contradicts the CLI's own printed next steps, and drops the cold-start budget

The live scaffold printed:

```text
  2. cd aspire  # TS AppHost lives here, isolated from the Deno workspace
  3. aspire restore  # download TypeScript AppHost SDK modules (run once)
  4. cd ..
  5. deno task aspire:start  # 300s cold-start budget; override ASPIRE_CLI_START_TIMEOUT if needed
```

and the scaffolded `deno.json` defines
`"aspire:start": "cd aspire && ASPIRE_CLI_START_TIMEOUT=300 aspire start"`.

The page instead says `cd aspire` → `aspire start`, which loses `ASPIRE_CLI_START_TIMEOUT=300`. On a
first cold run (image pulls, SDK restore) that is precisely the timeout the scaffold author raised on
purpose. A reader now has two different instructions from two authorities. Prefer the task the CLI
itself recommends; replace `quickstart.vto:94-98` with:

> ```sh
> cd aspire
> aspire restore   # once per machine
> cd ..
> deno task aspire:start   # wraps `aspire start` with a 300s cold-start budget
> ```
>
> `deno task aspire:start` is what the CLI's own "next steps" prints. It sets
> `ASPIRE_CLI_START_TIMEOUT=300`, which a first cold start needs while container images download.

and update the triage callout's third check accordingly (it currently asks "did you enter `aspire/`
before starting" — irrelevant once the task is used).

### MAJOR-3 — `service add` requires an Aspire restart, and the page does not say so

The page says `service add` "creates the service workspace and registers it with Aspire" — accurate
about registration, silent about effect. In my walk `service add --name orders` reported "Regenerated
28 Aspire helper files", but the already-running AppHost kept the old graph; `orders` never appeared.
An agent will look for its new service in the dashboard, not find it, and start debugging its own
code. Add after `quickstart.vto:188`:

> `service add` regenerates the Aspire helper files. A running AppHost does not pick that up — stop
> it (`aspire stop --apphost ./apphost.mts` from `aspire/`) and start it again before you expect the
> new service in the dashboard.

### MAJOR-4 — the closing teardown command does not tear down

`aspire stop --apphost ./apphost.mts` reported success, and yet after it:

- a **second AppHost** was still running under `my-app/aspire/db-operation/` — the `netscript db
  init|generate|seed` commands spawn their own AppHost there, and the page's stop command does not
  touch it;
- the Postgres container survived, because `appsettings.json` declares
  `"Persistent": true, "DataPath": ".data/postgres"`.

I had to run `aspire stop --apphost ./apphost.mts` a second time from `aspire/db-operation/` and then
`docker stop/rm` the container (proven mine by mount path) to get clean. For agents doing repeated
build/teardown cycles this is a guaranteed leak. Replace `quickstart.vto:272-277`:

> When you are finished locally, stop **both** AppHosts — the application graph and the one the
> `netscript db` commands start:
>
> ```sh
> cd aspire && aspire stop --apphost ./apphost.mts
> cd db-operation && aspire stop --apphost ./apphost.mts
> ```
>
> The Postgres container is declared `Persistent` in `appsettings.json`, so it deliberately survives
> both. Stop it with Docker when you want the disk back.

### MAJOR-5 — `deno task check` does not cover what `ui:add` produces

The scaffolded task is `deno check apps/**/*.ts services/**/*.ts contracts/**/*.ts` — **no `.tsx`**,
no `database/`, no `plugins/`. The page makes this task the verify gate and then tells the reader to
generate a page and an island, both `.tsx`, which the gate silently ignores. Add to the feature-loop
section, after `quickstart.vto:203`:

> `deno task check` covers `.ts` under `apps/`, `services/` and `contracts/` only. Type-check the
> `.tsx` the generator wrote explicitly:
> `deno check --unstable-kv "apps/dashboard/routes/orders/index.tsx" "apps/dashboard/routes/orders/(_islands)/OrdersIsland.tsx"`.

### MAJOR-6 — the triage callout does not cover the two failures that actually happen

"If something is not green" covers: is Aspire up, is Docker up, did you `cd aspire`, and a Windows
npm-materialisation path. None of those is what fails. What fails on a clean run is (a) the example
service never becoming healthy and (b) `deno task check`. Fold the BLOCKING-1 replacement above into
this callout's neighbourhood, and add a line telling the reader how to read a *service* failure
without a browser (resource logs are only reachable via the dashboard today — MCP `get_recent_errors`
/ `get_app_status` is the agent-usable route and the page already lists both tools without ever
connecting them to this moment).

### MAJOR-7 — `/design` answers 302, not 200

`curl -o /dev/null -w "%{http_code}" http://localhost:<fresh-port>/design` → **302**. A browser
follows it; an agent checking status codes records a failure. Change the box at
`quickstart.vto:146` to name the redirect:

> - [ ] `<fresh-app-url>/design` renders the generated design reference (it redirects, so a scripted
>   check needs `curl -L`).

### MAJOR-8 — the `ui:*` family and the pre-copied component library are still invisible

This is the issue's headline under-leverage finding (#1073, the 772-line hand-written island) and it
is only half-addressed. The page shows `ui:add page … --island` and nothing else. Not shown:
`ui:init`, `ui:list`, `ui:update`, `ui:remove` — the issue's acceptance item asked for "the `ui:*`
family", not one command.

More importantly, my scaffold ships **`apps/dashboard/components/ui/` already populated** with the
registry (`data-table.tsx`, `stats-grid.tsx`, `detail-layout.tsx`, `empty-state.tsx`, `panel.tsx`,
`filter-form.tsx`, `chart-block.tsx`, … ~60 files), and `ui:list` prints the full catalogue with
availability status. The page's tree labels the directory "[owned] copied UI registry source" and
never tells the reader *that it is already full*, or that `ui:list` exists. An agent that does not
know `components/ui/data-table.tsx` is already in its project will write a table by hand — which is
the measured failure. Add after `quickstart.vto:202`:

> Your app already contains the copied component registry under `apps/dashboard/components/ui/`.
> Run `netscript ui:list` to see every item and whether it is already copied, `netscript ui:add
> <item>` to copy one more (for example `data-table`, `stats-grid`, `empty-state`), and `netscript
> ui:update` to refresh unmodified copies. Reach for a registry item before writing a component.

### MAJOR-9 — no headless route to the base URLs the page depends on

The page correctly teaches "ports are allocated at runtime, the dashboard is the authority", then
hangs four separate instructions off `<fresh-app-url>` and `<service-url>` — the verify boxes, both
first-run destinations. For an agent there is no way to obtain those URLs: the dashboard needs a
browser and a login token that (per MAJOR-1) is not printed in a non-TTY. The MCP table lists
`get_app_status` and `list_api_services`, which are exactly the answer, but the page never links the
capability to the need. One sentence in §3 closes this; see the MAJOR-1 replacement.

### minor-3 — the page never states what was verified, on which platform

Issue acceptance: "The page is walked end to end on Windows and on Linux, and **states what is
verified**." The page states nothing. The report is honest that Windows was source-reviewed only —
that honesty needs to reach the page, not stay in the run artifact.

---

## Gate 4 — Sync with `storefront/01-scaffold.md`: **FAIL**

They are closer than before — install form, dashboard-URL-not-a-port, the db init/generate/seed
block, and the "Do not begin customising" rule are now identical in both. But they do not read as
short form / long form of one account. Seven live divergences:

1. **Project trees disagree, and both are incomplete.** Quickstart lists `AGENTS.md`, `.mcp.json`,
   `.netscript/`, `WEB-LAYER.md`, `components/ui/`, `.generated/` and **omits `tests/`**; storefront
   lists `tests/` and omits every item in that first list. Neither lists what a real scaffold
   actually has at the root: `package.json`, `node_modules/`, `tsconfig.json`, `.github/`,
   `deno.lock`, `README.md`. A root `package.json` + `node_modules/` in a *Deno* project is exactly
   the kind of thing an unfamiliar agent trips over; it appears on neither page.
2. **Storefront's `--help` group list is wrong by omission.** It says the reader "should see the
   public groups: `init`, `contract`, `db`, `deploy`, `generate`, `marketplace`, `plugin`, `service`,
   `ui:add`, and `ui:init`". Live output also contains **`agent`**, **`config`**, `ui:list`,
   `ui:update`, `ui:remove`. Omitting `agent` is the notable one — it is the entry point to
   everything the Quickstart's MCP section is about. Replace with: "…`agent`, `config`, `contract`,
   `db`, `deploy`, `generate`, `init`, `marketplace`, `plugin`, `service`, and the `ui:*` group".
3. **Port doctrine contradicts.** Quickstart: "There is no application or service port to memorise."
   Storefront: `--service-port 3001`, `curl http://localhost:3001/health`, and a verify box on 3001,
   patched with a 40-word parenthetical mid-sentence. The parenthetical is padding covering an
   unresolved decision. Worse, live `netscript init --help` says `--service-port` "weakens
   `aspire start --isolated`" — the tutorial pins the port without mentioning the cost. Either drop
   the pin and teach the dashboard (consistent with the sibling page) or state the trade-off.
4. **The `curl` box is unsatisfiable and its triage sends readers into a retry loop.** Given the
   `@database/zod` regression, the example service never starts. Storefront says "A failed `curl`
   usually means the service has not finished starting — give it a few seconds and retry." That
   advice will loop forever.
5. **Storefront has no orientation counterpart at all** — no MCP surface, no `agent init`, no
   `ui:*`, no Scalar `/api/docs`, no owned/generated marking. The "long form" is now materially
   *poorer* on orientation than the "short form", which inverts the intended relationship.
6. **`/design` box phrasing differs** ("Opening the Fresh app URL from the dashboard with `/design`
   appended" vs "`<fresh-app-url>/design`") — cosmetic, but they should be the same sentence.
7. **Both carry the non-TTY error from MAJOR-1** — storefront: "prints a URL and a one-time login
   token"; "Leave `aspire start` running in this terminal".

---

## Gate 5 — Orientation over length: **PARTIAL**

### Acceptance list from #1274

| Item | Status |
| --- | --- |
| Annotated project tree, generated vs owned | **Met, incomplete** — see gate 4 drift-1; also missing `apps/dashboard/client.ts` and `utils.ts`, the two files the page's own instructions depend on ("connect its query loader to the contract-derived client"; the generated page imports `definePage` from `@app/utils.ts`) |
| MCP surface by family + first two or three tools | **Met** — accurate, well-chosen (`doctor`, `find_export`, `get_operation_schema`) |
| `ui:add` and the `ui:*` family at the point of need | **Not met** — one command of five; see MAJOR-8 |
| Aspire as resource graph (ports, health, logs, traces, dashboard authority) | **Met** — the strongest section on the page |
| Scalar API reference as a first-run destination | **Met on the page**, unreachable in practice (BLOCKING-1) |
| "What next" routing by intent | **Met** |
| First-hour CLI commands collected in one place | **Not met** — they are spread across §1, §2, §3, §4, the feature loop and the MCP section. The issue asked for one place. There is also **no link to `/cli-reference/`**, which exists in this same site (`docs/site/cli-reference.md`, title "CLI reference") and is the natural destination. `netscript generate plugins`, named in the issue, appears nowhere |
| Six correctness bugs | 1 install ✔ · 2 file count ✔ (removed; live scaffold printed 218/45, confirming totals are option-dependent) · 3 `--editor` ✔ · 4 Windows **partial** (one `Set-Location` line + one npm-materialisation note; no Windows walk, no statement of that) · 5 db in happy path ✔ · 6 `agent mcp` stdio ✔ |
| Walked end to end on Windows and Linux, page states what is verified | **Not met** — page states nothing |

### Padding

- `quickstart.vto:233-235` — the legacy-`crud.ts` migration paragraph. Three lines addressed to a
  reader who does not exist on a Quickstart (no one arrives here with an old project), and wrong
  (BLOCKING-2). Cut it and use the replacement text in BLOCKING-2 instead.
- "the dashboard is the authority / URLs come from the dashboard" is stated three times
  (lines 106-108, 134, 171). Once, in §3, is enough; the later two can be a clause.
- Storefront's 40-word inline port parenthetical (line 79) — see gate 4 drift-3.

Everything else earns its space. The tree, the Aspire section, the feature loop and the MCP table
are all orientation, not words.

---

## Gate 6 — Site gates: **PASS**

Both run by me in `/home/codex/repos/ns-quickstart/docs/site`:

```text
$ deno task build
🍾 Site built into _site
  617 files generated in 11.22 seconds
BUILD_EXIT=0

$ deno task check:links
32775 internal links across 220 pages — all resolve
LINKS_EXIT=0
```

Every internal target the Quickstart references resolves (`/quickstart/aspire/`,
`/explanation/aspire/`, `/observability/`, `/explanation/contracts/`, `/ai/agent-tooling/`,
`/reference/mcp/`, the five what-next destinations, `/tutorials/storefront/`).

---

## Findings, ranked

**Blocking (must fix before this page becomes the wave-6 brief)**

1. Verify gate unsatisfiable and undisclosed — 3 of 7 boxes red on a clean walk; the page's hardest
   rule is therefore inoperative (BLOCKING-1, exact replacement supplied).
2. The `@database/zod` section states the opposite of current behaviour and directs readers away
   from the only working import path (BLOCKING-2 / gate 2c, exact replacement supplied). **Also
   requires a new issue** — the regression is not covered by #1287 and #1254 is closed.

**Major**

3. `aspire start` detaches in a non-TTY; "leave this terminal running" and the token instruction are
   unusable for an agent (MAJOR-1).
4. Page's `aspire start` contradicts the CLI's printed next steps and drops
   `ASPIRE_CLI_START_TIMEOUT=300` (MAJOR-2).
5. `service add` needs an Aspire restart — unsaid (MAJOR-3).
6. Teardown command leaves a second AppHost and a persistent container running (MAJOR-4).
7. `deno task check` does not cover the `.tsx` the page tells you to generate (MAJOR-5).
8. Triage callout misses both failures that actually occur (MAJOR-6).
9. `/design` returns 302 (MAJOR-7).
10. `ui:*` family and the already-populated `components/ui/` are invisible — the issue's headline
    under-leverage finding, half-addressed (MAJOR-8).
11. No headless route to `<fresh-app-url>` / `<service-url>` (MAJOR-9).
12. Storefront drift: wrong `--help` group list, contradictory port doctrine, unsatisfiable `curl`
    box with looping triage, no orientation counterpart (gate 4).
13. First-hour CLI commands not collected; `/cli-reference/` never linked (gate 5).

**Minor**

14. `--minimum-dependency-age` unstable-status unmentioned.
15. Trees omit `tests/`, `client.ts`, `utils.ts`, root `package.json`/`node_modules/`.
16. Triple restatement of dashboard-as-authority; legacy-`crud.ts` paragraph is padding.
17. Page never states what was verified or on which platform.

---

## Resource hygiene for this audit

Scaffold, both AppHosts and the persistent Postgres container created by this audit were stopped and
removed (container ownership proven by mount path
`…/763d39f5-…/scratchpad/my-app/.data/postgres`). Zero processes remain with a cwd under the audit
workspace. Five foreign `postgres-*` containers belonging to other worktrees were inspected and left
untouched. No files in `/home/codex/repos/ns-quickstart` were modified; no commits were made.
