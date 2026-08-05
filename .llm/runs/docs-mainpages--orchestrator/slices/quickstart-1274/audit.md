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

---

# Re-audit (f0d4ea191)

- **Auditor lane:** Claude-family, adversarial, opposite-family re-audit of a Codex+Gemini fix round.
- **Under audit:** worktree `/home/codex/repos/ns-quickstart`, branch `docs/quickstart-1274-work`,
  HEAD `f0d4ea191`. Files: `docs/site/quickstart.vto` (276 lines),
  `docs/site/tutorials/storefront/01-scaffold.md` (238 lines).
- **Evidence basis:** `packages/cli`, `packages/mcp`, `packages/telemetry`, `packages/database`,
  `packages/fresh-ui` source read at **`origin/main`** (`00f96af76`) — the tree that produced
  `0.0.5-canary.10`; live `--help` and live `ui:list` / `ui:add` runs from
  `packages/cli/bin/netscript.ts`; a Zod 4.4.3 execution of the page's own code sample; and both
  site gates run by me. `fixround-agy.md` was treated as claims only — **four of its claims are
  refuted below.**
- **Stale blockers not re-reported:** the `@database/zod` barrel regression and the
  `QueryClientPort` catalog failure. Both confirmed closed at source on `origin/main`
  (`7db204620` restores the barrel; `18b5b2bbf` fixes the QueryClient seam).
- **Branch-vs-main note (not a page defect):** the branch is 21 commits behind `main` and its own
  `packages/cli/.../deno-json.ts:46` still maps `@database/zod` to `schemas/models/index.ts`. Every
  claim below is judged against `origin/main`, which is what a reader installs. The page is only
  true once this branch sits on `main`.
- **Verdict: FAIL_FIX** — 3 blocking, 4 major, 4 minor.

---

## Part 1 — Disposition of the 9 prior major findings (plus the 2 blockers)

| Prior | Subject | Disposition |
| --- | --- | --- |
| BLOCKING-1 | Verify gate unsatisfiable/undisclosed | **FIXED** |
| BLOCKING-2 | `@database/zod` section taught the broken mapping | **FIXED** (but see new blocking-B) |
| MAJOR-1 | `aspire start` detaches in non-TTY | **PARTIALLY FIXED** → new blocking-A |
| MAJOR-2 | Contradicts CLI's printed `deno task aspire:start`; drops 300s budget | **FIXED on Quickstart; NOT FIXED on storefront** |
| MAJOR-3 | `service add` needs an Aspire restart | **FIXED** |
| MAJOR-4 | Teardown leaves a second AppHost + container | **FIXED** |
| MAJOR-5 | `deno task check` misses `.tsx` | **FIXED** |
| MAJOR-6 | Triage callout misses the real failures | **FIXED** |
| MAJOR-7 | `/design` answers 302 | **PARTIALLY FIXED** — redirect target is wrong → new major-D |
| MAJOR-8 | `ui:*` family + populated `components/ui/` invisible | **NOT FIXED** → new blocking-C |
| MAJOR-9 | No headless route to `<fresh-app-url>` / `<service-url>` | **NOT FIXED** → new blocking-A |
| gate-4 | Storefront sync | **PARTIAL** — 4 of 7 divergences remain |
| gate-5 | First-hour commands not collected, `/cli-reference/` unlinked | **FIXED** |
| minor-1 | `--minimum-dependency-age` unstable status | **FIXED** (`quickstart.vto:25`) |
| minor-15 | Trees omit `tests/`, `client.ts`, `utils.ts`, `package.json`, `node_modules/` | **FIXED** (see minor-c) |
| minor-16 | Padding / triple restatement / legacy-`crud.ts` paragraph | **FIXED** |
| minor-17 | Page never states what was verified | **FIXED BY OVERCLAIM** → new major-G |

### Evidence for each

**BLOCKING-1 — FIXED.** Both root causes are closed at source on `origin/main`: `7db204620`
(#1299) repoints `@database/zod` to `crud.ts` and `18b5b2bbf` (#1300) fixes the QueryClient seam.
The checklist at `quickstart.vto:147-153` now presents seven boxes with the hard rule intact, and
the triage callout (`:158`) names the remaining known flake verbatim — *"`aspire restore` / `start`
can occasionally time out under heavy system load with `Failed to prepare: A task was canceled`;
re-running the start command usually succeeds"* — which is exactly the disclosure the brief asked
for. Same sentence present at `01-scaffold.md:228`. Verified by source, not by a fresh end-to-end
walk; the six-of-seven verdict is taken from the brief's machine proof on `0.0.5-canary.10`.

**BLOCKING-2 — FIXED (mapping).** `origin/main` `packages/cli/src/kernel/templates/workspace/deno-json.ts:43-47`
maps `@database/zod` → `./database/<engine>/schema/.generated/zod/crud.ts`. The barrel writer
`packages/database/scripts/fix-zod-imports.ts` `writeCrudZodBarrel()` enumerates
`schemas/models/*.schema.ts` and emits, **per discovered model**, exactly
`<Model>Schema`, `<Model>InputSchema as <Model>CreateInput`, and
`<Model>UpdateInputObjectZodSchema as <Model>UpdateInput`; it throws rather than emit a partial
row. `packages/database/tests/zod-crud-barrel_test.ts` asserts two models (`Product`, `Warehouse`)
round-trip. `db generate` reaches it: the embedded generator asset calls
`runWriteCrudZodBarrel(ZOD_OUTPUT_DIR, CRUD_MODEL_NAME)` after `generateZodSchemas` succeeds
(`packages/cli/src/kernel/assets/embedded.generated.ts:121`). The scaffold's own contract template
(`assets/service/contract.ts.template:10-14`) imports `{{modelName}}CreateInput`,
`{{modelName}}Schema`, `{{modelName}}UpdateInput` from `@database/zod` — satisfied by that barrel.
**The page's prose at `quickstart.vto:88` and `:104` is accurate.** The code sample below it is not
— see blocking-B.

**MAJOR-2 — FIXED on the Quickstart, NOT FIXED on the storefront.** `quickstart.vto:110-117` now
prescribes `cd aspire; aspire restore; cd ..; deno task aspire:start` and states the 300s budget.
Both halves check out: `deno-json.ts:88` generates
`"aspire:start": "cd aspire && ASPIRE_CLI_START_TIMEOUT=300 aspire start"`, and
`init-orchestrator.ts:104` prints
`deno task aspire:start  # 300s cold-start budget; override ASPIRE_CLI_START_TIMEOUT if needed`.
**The 300s budget is stated.** But `01-scaffold.md:163-167` still says `cd aspire` → bare
`aspire start`, so the two pages now issue different start commands and the tutorial silently
drops the budget the scaffold author raised on purpose. See major-E.

**MAJOR-3 — FIXED.** `quickstart.vto:183` names the regeneration and the required stop/restart.

**MAJOR-4 — FIXED, and the fix-round's reasoning is correct.** `origin/main`
`packages/cli/src/kernel/adapters/database/operation-runner.ts` `executeDetached()` now wraps the
db-operation AppHost in `try { … } finally { await this.stopDetached(apphostPath, aspireDir,
startedPid); }` and removes the operation-request file — so the second AppHost my prior walk found
under `aspire/db-operation/` no longer survives a `netscript db` command. The page's simplified
single-stop teardown (`quickstart.vto:270`) is therefore correct today. The persistence claim is
also correct: `packages/cli/src/kernel/templates/aspire/generate-appsettings.ts:157,168,179` emit
`Persistent: true` for database resources. `aspire stop --apphost <path>` accepts "a path to the
Aspire AppHost project file or a directory", per live `aspire stop --help` (Aspire 13.4.6), so
`./aspire/apphost.mts` from the workspace root is a valid form.

**MAJOR-5 — FIXED.** `deno-json.ts:96` generates
`check: 'deno check apps/**/*.ts services/**/*.ts contracts/**/*.ts'`. The page states that scope
verbatim at `:210` and supplies the explicit `.tsx` command at `:213` with the exact paths
`ui:add page … --island` writes.

**MAJOR-6 — FIXED.** The triage callout now covers the flake that actually occurs and points
headless readers somewhere. (Where it points them is blocking-A.)

**MAJOR-8 — NOT FIXED.** The family and the pre-populated directory are now *mentioned*
(`quickstart.vto:192-202`), which is what the fix-round claims. But **every command in that
subsection is written in a form that does not work from where the page tells you to stand.** Proven
below (blocking-C). Surfacing a command that misfires is worse than not surfacing it: the prior
finding was "an agent that does not know `data-table` is already in its project will write a table
by hand"; the current text produces a `ui:list` output that *tells* the agent nothing is copied.

**MAJOR-9 — NOT FIXED.** See blocking-A.

**gate-4 storefront sync — PARTIAL.** Fixed: the `--help` group list now includes `agent` and
`config` (`01-scaffold.md:58-59`); `tests/` appears in both trees; the non-TTY sentence and the
flake note are now in both pages; the unsatisfiable `curl` box is satisfiable again and its
retry-loop advice is gone. Still divergent: bare `aspire start` vs `deno task aspire:start`
(major-E); the port doctrine contradiction (major-F); the storefront still has no orientation
counterpart — no MCP surface table, no `agent init`, no `ui:*`, no Scalar `/api/docs`, no
owned/generated marking, and its tree still omits `apps/dashboard` internals, root `AGENTS.md`,
`.mcp.json`, `package.json`, and `node_modules/` (minor-d).

**gate-5 — FIXED.** `quickstart.vto:238-257` collects the first-hour commands in one table and
links `/cli-reference/`. All twelve rows check out against live `--help`.

---

## Part 2 — New findings

### BLOCKING-A — the non-TTY path routes headless readers to two tools that cannot answer the question

This is the defect the fix round was specifically trying to remove, and it re-created it one level
down. The page hangs five separate instructions off `get_app_status` / `doctor`:

- `:119` — "query app status using the MCP `get_app_status` or `doctor` tools (below) to verify
  running resources and **discover allocated URLs**"
- `:121` — "use the URLs beside each resource in the dashboard (**or returned by `get_app_status`**)"
- `:141` / `:149` / `:151` — the verify boxes substitute `get_app_status` for the dashboard
- `:168` — "Inspect them via the Aspire dashboard or by calling MCP `get_app_status` /
  `list_api_services`"
- `:236` — "`get_app_status` or `list_api_services` to resolve runtime URLs headlessly"
- `01-scaffold.md:173-174, 216, 228` — same substitution

**`get_app_status` returns no resource name, no per-resource health, and no URL.** Its flow
(`packages/mcp/src/application/flows/get-app-status-flow.ts`) hands three telemetry queries to
`aggregateAppStatus`, whose entire return value is
(`packages/mcp/src/application/telemetry-aggregation.ts:90-95`):

```ts
return {
  status: errors > 0 ? 'fail' : resources.length === 0 || spans.length === 0 ? 'warn' : 'pass',
  counts: { resources: resources.length, spans: spans.length, errors },
  domains,   // per-domain span counts, not resources
};
```

`AppStatusSummary` (`packages/mcp/src/domain/telemetry-summaries.ts:23-27`) has exactly those three
fields. The package's own README row confirms it: *"`get_app_status` — Health verdict, counts,
per-domain summaries."* It counts **telemetry** resources, which are OTLP emitters — Postgres and
Redis containers do not emit OTLP and therefore cannot appear at all. The verify box
*"the dashboard (or MCP `get_app_status`) shows the Fresh app, example service (`users`), Postgres,
and Redis healthy"* is not satisfiable by that tool under any circumstance.

**It is also pointed at the wrong port by default.** `resolveTelemetryEndpoint`
(`packages/mcp/src/domain/telemetry-endpoint.ts`) falls back to `http://localhost:18888` unless
`NETSCRIPT_TELEMETRY_ENDPOINT` or `ASPIRE_DASHBOARD_PORT` is set in the MCP server's own
environment. Aspire allocates the dashboard port at runtime (my prior walk: `https://localhost:45603`),
and an agent-host-spawned stdio server inherits neither variable. The realistic headless result of
following the page is `{"status":"warn","counts":{"resources":0,"spans":0,"errors":0}}` — which the
page has taught the agent to read as its verification step.

**`doctor` cannot answer it either.** Its Aspire family
(`packages/mcp/src/infrastructure/aspire-doctor-family.ts:43-56`) `stat`s
`aspire/apphost.mts` on disk and returns `{name:'aspire_graph', status:'pass', summary:'<marker>'}`.
It is a **static file check**. Nothing in it reads a running process, a resource list, or a URL.

**`list_api_services` is the one tool that does answer it**, and the page names it only twice, never
as the primary. `createListApiServicesFlow` → `serviceSummary`
(`packages/mcp/src/application/flows/list-api-services-flow.ts:52-72`) returns per row
`{name, status, source, baseUrl, specUrl, docsUrl, operationCount}`, where
`specUrl = baseUrl + '/api/openapi.json'` and `docsUrl = baseUrl + '/api/docs'`. `rowFromProbe`
(`application/service-endpoint-directory.ts:244-254`) puts `baseUrl` in the row's base object, so
the URL survives every non-`running` status. Its `aspire-cli` source
(`infrastructure/service-endpoints/aspire-cli-endpoint-source.ts:131-157`) enumerates **every**
`aspire describe` resource that has a name and an HTTP URL — the Fresh app included.

**Exact replacement** for `quickstart.vto:119` (second and third sentences) and the `:121` clause:

> If your terminal is not interactive (a CI job or an agent tool call), `aspire start` detaches,
> prints the AppHost PID and dashboard URL, and returns; the resources keep running. The dashboard
> itself needs a browser and a login token, so read the running graph from the shell instead:
>
> ```sh
> aspire describe --apphost ./aspire/apphost.mts --format Json --non-interactive --nologo
> ```
>
> That prints every resource with its allocated endpoint — the Fresh app URL, the service URL,
> Postgres, and Redis. From an agent host, the MCP equivalent is **`list_api_services`**, which
> returns `baseUrl`, `specUrl`, and `docsUrl` per resource. Do **not** use `get_app_status` or
> `doctor` for this: `get_app_status` returns only a health verdict and aggregate counts (no names,
> no URLs) and reads a telemetry endpoint that defaults to `http://localhost:18888`, which is not
> the port Aspire allocated; `doctor` checks project files on disk, not running processes.

Then change `:121` to "(or the `baseUrl` of each row returned by `list_api_services`)", `:141`,
`:149`, `:151` and `:168` from `get_app_status` to `list_api_services` or the `aspire describe`
command, `:236` to drop `get_app_status` from the URL-resolution sentence, and apply the same
substitution at `01-scaffold.md:173-174, 216, 228`. Keep `get_app_status` where the page uses it for
what it does do — a one-line health verdict — and keep `get_recent_errors` in the triage callout.

### BLOCKING-B — the corrected derivation section's only code sample throws at runtime

`quickstart.vto:92-102` is the page's single worked example of the newly-corrected contract
derivation. It picks a field the scaffold does not have:

```ts
export const UserSchemaV1 = DatabaseUserSchema
  .pick({ id: true, name: true, status: true, createdAt: true })
```

The scaffolded model (`packages/cli/src/kernel/assets/database/schema.prisma.template`) is:

```prisma
model {{modelName}} {
  id        Int      @id @default(autoincrement())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

No `status`. `modelName` = `toPascalName(singularize(serviceName))`
(`validate-init.ts:136-138`) and `SCAFFOLD_DEFAULTS.SERVICE_NAME = 'users'`
(`scaffold-defaults.ts:10`), so `UserSchema` really is the reader's model — the sample is
addressed to the exact scaffold the page just created. Zod is pinned at `jsr:@zod/zod@4.4.3` across
the workspace, and Zod 4 rejects unknown keys in `.pick()`. Executed:

```text
$ deno run -A t.ts   # zod 4.4.3, z.object({id,name,createdAt,updatedAt}).pick({...status:true})
PICK_THREW: Unrecognized key: "status"
```

A wave-6 agent copying the page's own example gets an immediate crash on the first contract it
writes — from the section the fix round rewrote to be authoritative.

**Exact replacement** for `quickstart.vto:92-102`:

```ts
import { UserSchema as DatabaseUserSchema } from '@database/zod';
import { z } from 'zod';

// The scaffolded User model has id, name, createdAt, updatedAt. Pick only fields
// that exist in schema.prisma; add new public fields with .extend().
export const UserSchemaV1 = DatabaseUserSchema
  .pick({ id: true, name: true, createdAt: true })
  .extend({
    name: z.string().min(1).max(120),
    status: z.enum(['draft', 'active', 'archived']),
  });
```

and add one sentence after it: *"`.pick()` throws if you name a field the Prisma model does not
have — add the column in `schema.prisma` and re-run `netscript db migrate` / `db generate` first,
or introduce it with `.extend()` as `status` is introduced here."*

### BLOCKING-C — every `ui:*` command in the new UI subsection is written to run against the wrong root

`quickstart.vto:196-202` tells the reader, from the workspace root, to run bare
`netscript ui:list`, `netscript ui:add <item>`, `netscript ui:update`, `netscript ui:remove` —
while the very next command block at `:207` correctly carries `--project-root apps/dashboard`. The
page is internally inconsistent, and the bare form is the wrong one.

All `ui:*` commands resolve their root through the same resolver
(`packages/cli/src/public/features/root/public-command-dependencies.ts:192-194`):
`projectRoot ? host.resolvePath(projectRoot) : await findDeployProjectRoot(host.cwd())`.
`findProjectRoot` (`kernel/adapters/config/deploy-config.ts:59-86`) walks up until it finds
`netscript.config.ts` or a workspace `deno.json` — in a NetScript workspace that is the **workspace
root**, not `apps/dashboard`. `listUiRegistryItems`
(`kernel/application/ui/registry.ts:130-142`) then derives `installed` from
`fs.exists(resolveTarget(projectRoot, file.target))` with `@ui/ → components/ui/`
(`registry.ts:68`) — i.e. `<workspace-root>/components/ui/…`, which never exists.

Executed against a minimal fixture (workspace root with `netscript.config.ts` + workspace
`deno.json`; `data-table` and `empty-state` present under `apps/dashboard/components/ui/` and
`apps/dashboard/assets/ui/`, matching their real registry targets):

```text
$ netscript ui:list                                # exactly as the page instructs
available   data-table   block
available   empty-state  block

$ netscript ui:list --project-root apps/dashboard
installed   data-table   block
installed   empty-state  block
```

So the page's stated purpose for the command — *"inspect every available component and **its local
copy status**"* — returns the opposite of the truth, on every one of the 46 items the scaffold
pre-copies. And `ui:add` does not merely misreport, it writes to the wrong place:

```text
$ netscript ui:add panel                           # exactly as the page instructs
Installed 5 Fresh UI registry items.  Copied 9 files.
Wrote <workspace-root>/assets/styles.css.  Merged 3 deno.json imports.

$ find . -type f
<workspace-root>/components/ui/panel.tsx      ← outside the Fresh app
<workspace-root>/assets/ui/panel.css          ← outside the Fresh app
<workspace-root>/lib/cn.ts                    ← outside the Fresh app
<workspace-root>/deno.json                    ← root workspace config mutated
<workspace-root>/apps/dashboard/components/ui/data-table.tsx   (pre-existing, untouched)
```

Three directories Fresh never reads, plus a mutated root `deno.json`. This is a worse outcome than
the hand-written island the finding exists to prevent.

**Exact replacement** for `quickstart.vto:196-202`:

> The `ui:*` commands act on an **app workspace**, not the repository root, so pass
> `--project-root apps/dashboard` to every one of them (bare invocations resolve to the workspace
> root and will both misreport copy status and write files where Fresh cannot see them):
>
> ```sh
> netscript ui:list --project-root apps/dashboard
> ```
>
> `ui:list` marks each item `installed` or `available`; the ~46 items of the `foundation`
> collection are already `installed` in a fresh scaffold. Reach for one of those before writing a
> component by hand. Use `netscript ui:add <item> --project-root apps/dashboard` to copy another
> (`ui:list --collections` shows the `ai`, `dashboard-blocks`, and `desktop` collections that are
> not pre-copied), `netscript ui:update --project-root apps/dashboard` to refresh unmodified
> copies, and `netscript ui:remove <item> --project-root apps/dashboard` to drop one. The fifth
> command in the family, `netscript ui:init`, installs the Fresh UI foundation into an app that
> does not have it — a scaffolded app already does.

Add `| Inspect UI component registry | `netscript ui:list --project-root apps/dashboard` |` to the
first-hour table at `:252` (currently the bare form).

### MAJOR-D — `/design` redirects to `/design/tokens`, not `/design/composition`

Both pages now assert the wrong target. `quickstart.vto:152`: *"it returns an HTTP 302 redirect to
`/design/composition`, so scripted checks require `curl -L`"*; identical at `01-scaffold.md:221`.
Source (`packages/cli/src/kernel/assets/app/routes/(design)/design/index.tsx.template`):

```ts
export const handler = define.handlers({
  GET(ctx) {
    return ctx.redirect(appRoutes.designTokens.href());
  },
});
```

and `router.ts.template:37` defines `designTokens: createRouteReference('/design/tokens', …)`.
`/design/composition` is a sibling page (`composition.tsx.template` → `appRoutes.designComposition`),
reachable only by navigating to it — which matters because `quickstart.vto:165` separately tells the
reader to *"Read `/design/composition` before deciding what belongs on the server or in an island."*
An agent asserting the `Location` header, or one that follows the stated redirect expecting the
composition page, is wrong either way. **Replace** `/design/composition` with `/design/tokens` in
the redirect sentence on both pages, and leave the `:165` bullet as the separate instruction it is.

### MAJOR-E — the storefront still drops the 300s cold-start budget and contradicts its sibling

`01-scaffold.md:163-167` still prescribes `cd aspire; aspire restore; aspire start`. The Quickstart
(`:110-117`) prescribes `deno task aspire:start` and explains why. Both pages describe the same
first run of the same scaffold; a reader now has two authorities, and the tutorial's is the one the
CLI does *not* print. **Replace** `01-scaffold.md:163-167` with the Quickstart's block verbatim
(`cd aspire` / `aspire restore` / `cd ..` / `deno task aspire:start`) plus the one-sentence
rationale, and update the triage check at `:228` — which currently asks *"did you `cd aspire` before
`aspire start`"* — to match.

### MAJOR-F — the port doctrine still contradicts, and the pinned-port trade-off is still unstated

Quickstart `:121`: *"There is no application or service port to memorise."* Storefront `:79`,
`:83`, `:195-199`, `:214-222`: `--service-port 3001`, `curl http://localhost:3001/health`, a verify
box on 3001, and the same 40-word inline parenthetical the prior audit flagged as padding covering
an unresolved decision. Live `netscript init --help` states the cost the tutorial never mentions:

```text
--service-port <port>  Pin the example service to this Aspire host port (weakens `aspire start --isolated`).
```

**Either** drop the pin from the tutorial and teach the dashboard / `list_api_services` route
(consistent with the sibling page), **or** replace the parenthetical at `:79` with one honest
sentence: *"This track pins the service to port 3001 so the `curl` checks below are copy-pasteable.
Pinning weakens `aspire start --isolated`, so omit `--service-port` in real projects and read the
allocated URL from the dashboard."*

### MAJOR-G — the page now asserts a verification it did not receive

`quickstart.vto:275`: *"All commands, flags, and paths on this page have been verified against
NetScript CLI source and live `--help` output on Deno 2.x (Linux and Windows)."* The prior run's
own `report.md` was explicit that Windows was **source-reviewed only**, and `fixround-agy.md`
records no Windows execution either. Blocking-B, blocking-C and major-D are each a command or path
on this page that live execution refutes, so "all … verified … live" is false on Linux too. A
provenance claim that overstates is worse than the silence it replaced. **Replace** with:

> *Verified on Linux against NetScript CLI source and live `--help` output on Deno 2.x. The
> PowerShell path notes are source-reviewed, not executed on Windows.*

### Minors

- **minor-a — `ui:init` is missing from an enumeration presented as exhaustive.** Live
  `netscript --help` lists `ui:add`, `ui:init`, `ui:list`, `ui:update`, `ui:remove`. Both pages
  write "the `ui:*` family (`ui:list`, `ui:add`, `ui:update`, `ui:remove`)"
  (`quickstart.vto:27`, `01-scaffold.md:59`). Add `ui:init` to both parentheticals; the
  blocking-C replacement text already explains what it is for.
- **minor-b — "over 60 components" is inflated.** `quickstart.vto:194`. The registry has **66**
  items total (`freshUiRegistryManifest.items.length === 66`), of which the scaffold pre-copies the
  `foundation` collection — **46** items — plus `floating-styles` and `control-props`
  (`DEFAULT_UI_INIT_ITEMS`, `kernel/application/ui/registry.ts:75-79`, consumed at
  `writers/write-app-files.ts:182-184`). Every item the page names by hand (`data-table`,
  `stats-grid`, `detail-layout`, `empty-state`, `panel`, `filter-form`, `chart-block`) is in
  `foundation` and genuinely pre-copied. Say "~46 of the registry's 66 items are already copied".
- **minor-c — the tree shows files `netscript init` does not write.** `quickstart.vto:47` lists
  `.mcp.json` as `[generated] agent-host MCP wiring` inside the §2 scaffold tree, but `.mcp.json` is
  written only by `netscript agent init` (`packages/cli/src/public/features/agent/init/init-agent.ts`
  is the sole writer), which the page introduces later at `:81`. Root `AGENTS.md` is annotated
  correctly; `init` itself writes only `apps/dashboard/AGENTS.md`
  (`writers/write-app-files.ts:176`). Annotate `.mcp.json` the same way: `# [generated] written by
  `agent init``.
- **minor-d — the storefront still has no orientation counterpart.** No MCP table, no
  `agent init`, no `ui:*`, no Scalar `/api/docs`, no owned/generated marking; its tree
  (`01-scaffold.md:109-125`) still omits `apps/dashboard` internals, root `AGENTS.md`, `.mcp.json`,
  `package.json`, and `node_modules/`. The "long form" remains materially poorer on orientation
  than the "short form".

---

## Part 3 — The wave-6 walk, again

Walking the page as an agent with zero NetScript knowledge and no browser, executing only what it
says. What now works: install, scaffold, tree orientation, `deno task aspire:start` with a stated
cold-start budget, the db ordering, the disclosed flake and how to proceed, the `.tsx` type-check
gap, `service add` → restart, single-command teardown, the 21-tool table, the first-hour table, and
`/cli-reference/`. That is a real improvement over the prior round.

**Where the agent still halts or guesses:**

1. **After `deno task aspire:start`, it cannot learn a single URL.** The page's stated headless
   route (`get_app_status`, `doctor`) returns counts and a file-existence check. Three verify boxes
   and both "first tour" destinations depend on URLs it has no way to obtain. It must guess:
   *is there another tool?* (`list_api_services`, unstated as the answer) or *is there a shell
   command?* (`aspire describe`, never mentioned).
2. **Its first contract crashes.** It copies the page's derivation sample and gets
   `Unrecognized key: "status"`, with nothing on the page explaining that `.pick()` is
   schema-bound.
3. **Its UI leverage inverts.** `netscript ui:list` reports 46 pre-copied items as `available`; if
   it then runs `netscript ui:add data-table` it silently writes into the workspace root and
   mutates the root `deno.json`. It must guess that `--project-root apps/dashboard` — shown on the
   *next* command but not these — applies to the whole family.
4. **`/design` sends it to the wrong page.** It follows a documented redirect to
   `/design/composition` and lands on `/design/tokens`.
5. **Still unstated anywhere:** how to read a *service's* console logs headlessly (the page names
   `get_recent_errors` in triage but never connects it to "my service will not start"); what
   `netscript generate plugins` is for (named in the issue, absent from the page); and whether
   `deno task aspire:start:isolated` (generated at `deno-json.ts:89`) is ever the right choice.

**Sync and vocabulary.** `grep -nE "#1[0-9]{3}|issue |PR #|harness|slice|wave-6|evaluator|openhands|codex"`
over both files returns **no matches** — issue numbers and internal-process vocabulary are cleanly
stripped from both pages. Gate PASS.

**Gates, run by me in `/home/codex/repos/ns-quickstart/docs/site`:**

```text
$ deno task build
🍾 Site built into _site
  617 files generated in 11.17 seconds
BUILD_EXIT=0

$ deno task check:links
32776 internal links across 220 pages — all resolve
LINKS_EXIT=0
```

---

## Verdict: FAIL_FIX

**Blocking**

- **A.** The non-TTY path routes headless readers to `get_app_status` / `doctor`, neither of which
  returns a resource name, a health state, or a URL — the exact dead end the fix was meant to
  remove. Replacement supplied.
- **B.** The corrected derivation section's only code sample throws `Unrecognized key: "status"` on
  the scaffold it is written for. Replacement supplied.
- **C.** Every `ui:*` command in the new UI subsection is written bare and resolves to the workspace
  root: `ui:list` reports 46 pre-copied items as missing, `ui:add` writes outside the Fresh app and
  mutates the root `deno.json`. Proven by execution. Replacement supplied.

**Major** — D `/design` redirect target wrong on both pages · E storefront still drops the 300s
budget and contradicts the Quickstart's start command · F port doctrine still contradicts and the
`--service-port` trade-off is still unstated · G the page asserts a Windows/live verification it
did not receive.

**Minor** — a `ui:init` missing from an exhaustive-looking enumeration · b "over 60 components"
(46 of 66) · c `.mcp.json` shown in the `init` tree though only `agent init` writes it · d the
storefront still lacks an orientation counterpart.

## Resource hygiene for this re-audit

No scaffold was created and no AppHost or container was started. Two throwaway fixtures under this
session's scratchpad (`zodtest/`, `uiroot/`) were used for the Zod and `ui:*` proofs; `uiroot/` was
removed after the `ui:add` evidence was captured. No files in `/home/codex/repos/ns-quickstart` were
modified; no commits were made. The site gates write only `docs/site/_site` (build output, already
git-ignored).

---

## Final verification pass (58ddeeed4)

- **Under audit:** `58ddeeed4` on `docs/quickstart-1274-work`, diff against `f0d4ea191`
  (41 lines `quickstart.vto`, 14 lines `01-scaffold.md`).
- **Evidence:** the diff read in full; `origin/main` source re-checked for each claim the edits
  introduce; the corrected Zod sample and Deno's task-cwd rule **executed** in this lane; both site
  gates re-run by me (not taken from the coordinator's report).

### Per-finding disposition

| Finding | Disposition |
| --- | --- |
| BLOCKING-A — headless path routed to tools that cannot answer | **FIXED**, with one residual (R3) |
| BLOCKING-B — derivation sample throws | **FIXED** (executed) |
| BLOCKING-C — `ui:*` written against the wrong root | **FIXED in prose, NOT FIXED in the first-hour table** (R1) |
| MAJOR-D — `/design` redirect target | **FIXED**, both pages |
| MAJOR-E — storefront start command | **FIXED** functionally, with residuals (R2 + minor-f) |
| MAJOR-F — port doctrine / `--service-port` trade-off | **NOT ADDRESSED** — not merge-blocking |
| MAJOR-G — false Windows-verification claim | **FIXED** |
| minor-a `ui:init` · minor-b "over 60" · minor-c `.mcp.json` · minor-d storefront orientation | **NOT ADDRESSED** — none merge-blocking |

**BLOCKING-A — FIXED.** Substituted at every site I listed: `quickstart.vto:121` (the new
`aspire describe` block plus the explicit "do **not** use `get_app_status` or `doctor` for this"),
`:125`, `:149`, `:157`, `:159`, `:166`, `:176`, `:251`, and `01-scaffold.md:173-174`, `:216`,
`:228`. `get_app_status` now survives only in that warning and in the 21-tool family table, which
is correct — the tool is real, it just does not answer this question. Every factual claim the new
warning makes is source-backed: the 18888 default is `DEFAULT_TELEMETRY_ENDPOINT`
(`packages/mcp/src/domain/telemetry-endpoint.ts:2`), and `doctor`'s Aspire family really is a
`stat` on `aspire/apphost.mts` (`infrastructure/aspire-doctor-family.ts:43-56`).
`aspire describe [<resource>]` — "Describe resources in a running AppHost … If not specified, all
resources are shown" — is live-verified on Aspire 13.4.6, and `--apphost`, `--format Json`,
`--non-interactive`, `--nologo` are all real flags.

**BLOCKING-B — FIXED, executed.** The corrected sample runs clean on the pinned Zod:

```text
$ deno run -A t2.ts     # zod 4.4.3, .pick({id,name,createdAt}).extend({name,status})
OK keys: [ "id", "name", "createdAt", "status" ]
parse: {"id":1,"name":"a","createdAt":"1970-01-01T00:00:00.000Z","status":"active"}
```

The added comment and the `.pick()`-throws sentence are both accurate.

**BLOCKING-C — FIXED in prose, NOT FIXED in the table.** `quickstart.vto:206-217` now carries
`--project-root apps/dashboard` on `ui:list`, `ui:add`, `ui:update`, `ui:remove`, with the reason
stated correctly (workspace-root resolution, missing-copy misreport, second copy + root
`deno.json` edit — all three confirmed by my execution evidence above). But **`quickstart.vto:267`
still reads `| Inspect UI component registry | `netscript ui:list` |`** — the bare form, in the
page's own quick-reference table, 55 lines below the paragraph that says every `ui:*` command needs
the flag. See R1.

**MAJOR-D — FIXED.** `quickstart.vto:159` and `01-scaffold.md:221` now say `/design/tokens`,
matching `assets/app/routes/(design)/design/index.tsx.template` →
`appRoutes.designTokens.href()` → `/design/tokens` (`router.ts.template:37`). `quickstart.vto:173`
correctly still points at `/design/composition` as a separate page to read — not a defect.

**MAJOR-E — FIXED functionally.** The storefront block is now `cd aspire` / `aspire restore` /
`deno task aspire:start`, i.e. the task is invoked **from inside `aspire/`** with no `cd ..`. That
works, and I proved the mechanism rather than assuming it — Deno resolves the task from the
ancestor config and runs it with cwd set to that config's directory:

```text
$ cat deno.json    # at <root>;  aspire/ has no deno.json of its own
{"tasks":{"aspire:start":"cd aspire && pwd"}}
$ cd <root>/aspire && deno task aspire:start
Task aspire:start cd aspire && pwd
<root>/aspire            ← the inner `cd aspire` succeeded, so Deno's cwd was <root>
```

(Had Deno kept the invocation cwd, `cd aspire` would have failed and `&&` would have printed
nothing.) The 300s budget is now stated on both pages. Residuals R2 and minor-f below.

**MAJOR-G — FIXED.** `quickstart.vto:290` now says the flow "was walked end to end on Linux with
Deno 2.x. The Windows guidance is source-derived and has not been executed on Windows." That
matches the run record.

### New residuals introduced or left by this commit

**R1 — merge-blocking (one cell).** `quickstart.vto:267` still shows bare `netscript ui:list`. The
first-hour table is the page's own summary surface; an agent that reads it instead of scrolling
back gets exactly the behaviour the page warns about, and the page contradicts itself. **Replace
the cell with:**

> `netscript ui:list --project-root apps/dashboard`

**R2 — merge-blocking (one path).** `01-scaffold.md:173` tells the headless reader to run
`aspire describe --apphost ./aspire/apphost.mts …`, but at that point in the tutorial the reader is
standing in `my-shop/aspire/` — they were told to `cd aspire` eight lines earlier and never told to
leave. `./aspire/apphost.mts` does not exist from there. This is the storefront's only headless
endpoint-resolution command, and it fails as written. **Replace with** `--apphost ./apphost.mts`,
or prefix the sentence with "from the project root".

**R3 — merge-blocking (one clause).** `quickstart.vto:157` now reads:

> - [ ] Aspire is running; the dashboard — or `aspire describe --format Json`, or MCP
>   `list_api_services` — shows the Fresh app, example service (`users`), Postgres, and Redis with
>   endpoints.

`aspire describe` shows all four. **`list_api_services` cannot show Postgres or Redis.** Its
Aspire source keeps a resource only when `resourceHttpUrl` yields a URL
(`aspire-cli-endpoint-source.ts:135-136`, `if (!name || !baseUrl) continue;`), and
`normalizeDiscoveredEndpointUrl` returns `undefined` for any protocol that is not `http:`/`https:`
(`service-endpoints/endpoint-url.ts:13`) — Postgres and Redis publish `tcp://` endpoints. The other
contributing source reads only `NetScript.Services` from `appsettings.json`
(`appsettings-endpoint-source.ts:35-38`), never `Databases` or the cache. So an agent that verifies
this box through the MCP route sees two of four resources and either halts or ticks a box it did
not verify — the same failure mode as the original BLOCKING-1, one level down. **Replace the box
with:**

> - [ ] Aspire is running; the dashboard — or `aspire describe --apphost ./aspire/apphost.mts
>   --format Json` — shows the Fresh app, example service (`users`), Postgres, and Redis with
>   endpoints. (MCP `list_api_services` covers the HTTP resources only: the Fresh app and the
>   service. Postgres and Redis publish `tcp://` endpoints and do not appear there.)

**minor-e (not blocking).** `quickstart.vto:157`, `:176` and `:159` use `aspire describe
--format Json` without `--apphost`, while `:121` and `01-scaffold.md:173` use the full form.
Without the flag Aspire falls back to directory search. Use the full
`--apphost ./aspire/apphost.mts` form everywhere so a headless agent never depends on that search.

**minor-f (not blocking).** Storefront prose left stale by the MAJOR-E edit: `:161-162` still says
"Run it from the `aspire/` subfolder so the CLI finds `apphost.mts`" (the task cds itself from the
workspace root); the verify box at `:216` still says "`aspire start` is up"; the triage check at
`:228` still asks "did you `cd aspire` before `aspire start`". Also at `:228`, "inspect failure
diagnostics via the MCP `get_recent_errors` or `list_api_services` tools" — `list_api_services`
resolves endpoints, it is not a diagnostics tool. The Quickstart's equivalent sentence
(`:159`) already splits the two correctly; mirror it.

### Merge-blocking judgement on the deferred items (answering the coordinator)

- **MAJOR-F — not merge-blocking.** The port contradiction costs a reader confusion, not a failed
  command: `--service-port 3001` works, the `curl` box is satisfiable, and no instruction misfires.
  Fix in a follow-up; the one-sentence replacement is in the re-audit above.
- **minor-a / b / c / d — not merge-blocking.** `ui:init` omitted from an enumeration, "over 60"
  vs 46-of-66, `.mcp.json` shown one step early in the tree, and the storefront's missing
  orientation counterpart are all accuracy and completeness debt. None of them causes a reader to
  run a command that fails or to record a false verification.
- **R1, R2, R3 — merge-blocking.** Each is a single-line edit, and each makes an agent following
  the page either run a command that fails (R2), run the form the page itself warns against (R1),
  or tick a verify box it cannot satisfy by the route the page just prescribed (R3). R3 in
  particular is the exact defect class this audit opened on.

### Gates (re-run by me on `58ddeeed4`)

```text
$ cd docs/site && deno task build
🍾 Site built into _site
  617 files generated in 11.47 seconds
BUILD_EXIT=0

$ cd docs/site && deno task check:links
32776 internal links across 220 pages — all resolve
LINKS_EXIT=0
```

### Verdict: FAIL_FIX

All three blockers and MAJOR-D/E/G are genuinely fixed and verified — two of them by execution in
this lane, not by reading the diff. What remains is three one-line edits (R1, R2, R3), each of
which reintroduces a following-the-page failure in a surface the fix round did not sweep. Apply
those three and this page passes; MAJOR-F and minors a–f are follow-up debt and do not block.

### Resource hygiene

No scaffold, AppHost, or container was created this round. Two throwaway scratchpad fixtures
(`zodtest/`, `taskcwd/`) were used for the Zod and Deno-task proofs. No files in
`/home/codex/repos/ns-quickstart` were modified and no commits were made; `deno.lock` was touched
by an earlier CLI invocation in this session and restored with `git checkout HEAD -- deno.lock`.
The site gates write only the git-ignored `docs/site/_site`.

---

## Close-out verification (d49b8a252)

Diff against `58ddeeed4` read in full (5 lines `quickstart.vto`, 1 line `01-scaffold.md`). Each of
the four items re-checked against source and against the reader's actual working directory.

| Item | Disposition |
| --- | --- |
| R1 — bare `ui:list` in the first-hour table | **FIXED** |
| R2 — storefront `--apphost` path wrong for the reader's cwd | **FIXED** |
| R3 — verify box claimed `list_api_services` shows Postgres/Redis | **FIXED** |
| minor-e — `aspire describe` invocations missing `--apphost` | **FIXED** |

**R1 — FIXED.** `quickstart.vto:267` now reads
`` `netscript ui:list --project-root apps/dashboard` ``. Swept both pages for every `ui:*`
occurrence: the five executable invocations (`:207`, `:215-217`, `:222`, `:267`, `:268`) all carry
`--project-root apps/dashboard`. The remaining mentions are not invocations and are correct as
they stand — `:27` and `01-scaffold.md:59` name the command family in the `--help` group listing,
`:278` is a cross-reference, and `:211-212` are deliberate bare mentions **inside the warning
paragraph that explains what the bare form does wrong**. No copyable bare form survives.

**R2 — FIXED, and correct for where the reader is standing.** `01-scaffold.md:173` now uses
`--apphost ./apphost.mts`. Verified against both the page's own cwd and the scaffold layout: the
reader runs `cd aspire` in the Step 4 code block and is never told to leave before this sentence,
and `SCAFFOLD_FILES.APPHOST_MTS = 'apphost.mts'` relative to the `aspire/` directory
(`packages/cli/src/kernel/constants/scaffold/scaffold-files.ts:14`). So `./apphost.mts` resolves
from `my-shop/aspire/`, and the Quickstart's `./aspire/apphost.mts` remains correct for its own
reader at the workspace root. Both pages are now right for their own context rather than
copy-identical — which is the correct resolution.

**R3 — FIXED, applied verbatim.** `quickstart.vto:157` now names
`aspire describe --apphost ./aspire/apphost.mts --format Json` as the tool that shows all four
resources, and carries the parenthetical limiting `list_api_services` to the HTTP resources with
the `tcp://` reason. Both halves remain source-true: the Aspire source keeps a resource only when
`resourceHttpUrl` yields a URL (`aspire-cli-endpoint-source.ts:135-136`),
`normalizeDiscoveredEndpointUrl` rejects any non-`http:`/`https:` protocol
(`service-endpoints/endpoint-url.ts:13`), and the appsettings source reads only
`NetScript.Services` (`appsettings-endpoint-source.ts:35-38`). The box is now satisfiable by the
route it prescribes, and honest about the route it does not.

**minor-e — FIXED.** Every `aspire describe` **invocation** on both pages now carries `--apphost`:
`quickstart.vto:124`, `:157`, `:166` (the HTML-escaped one inside the triage callout), `:176`, and
`01-scaffold.md:173`. Three bare occurrences remain at `:129`, `:149`, `:159` — all three are
prose references to the tool's *output* ("the dashboard or `aspire describe` output is the
authority"), not commands a reader would copy. Correct as they stand.

### Gates (re-run by me on `d49b8a252`)

```text
$ cd docs/site && deno task build
🍾 Site built into _site
  617 files generated in 9.38 seconds
BUILD_EXIT=0

$ cd docs/site && deno task check:links
32776 internal links across 220 pages — all resolve
LINKS_EXIT=0
```

### Final verdict: PASS

Every blocking and major finding raised in this re-audit is closed and verified against
`packages/cli`, `packages/mcp`, `packages/telemetry`, `packages/database` and `packages/fresh-ui`
source at `origin/main`, with the two riskiest fixes proven by execution in this lane rather than
by reading the diff — the corrected derivation sample parsed clean on the pinned Zod 4.4.3, and
Deno's task-cwd rule was demonstrated to make the storefront's `deno task aspire:start` work from
inside `aspire/`. Walking the page again as an agent with no NetScript knowledge and no browser, I
can now reach a verified state, resolve every URL the page depends on, discover the feature loop
and the MCP surface, and know where to go next, without guessing at any command.

Carried forward as follow-up debt, none of it merge-blocking: **MAJOR-F** (the storefront pins
`--service-port 3001` while the Quickstart says there is no port to memorise, and neither states
that pinning weakens `aspire start --isolated`), **minor-a** (`ui:init` missing from the `ui:*`
enumeration on both pages), **minor-b** ("over 60 components" — the scaffold pre-copies the
46-item `foundation` collection out of 66 registry items), **minor-c** (`.mcp.json` shown in the
`netscript init` tree though only `netscript agent init` writes it), **minor-d** (the storefront
still has no orientation counterpart), and **minor-f** (storefront prose left stale by the
`deno task aspire:start` change: `:161-162`, `:216`, `:228`).

One standing caveat for the merge, not a page defect: this branch is behind `main` and its own
`packages/cli` tree still carries the pre-#1299 `@database/zod` mapping. The page is judged
against `origin/main` throughout, so it is correct only once this branch sits on `main`.

### Resource hygiene

Nothing started, nothing left running. Scratchpad fixtures removed. No files in
`/home/codex/repos/ns-quickstart` modified and no commits made; `deno.lock` was touched by CLI
invocations during this audit and restored with `git checkout HEAD -- deno.lock`. The gates write
only the git-ignored `docs/site/_site`.
