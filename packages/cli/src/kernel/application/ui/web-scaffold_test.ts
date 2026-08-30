import {
  assert,
  assertEquals,
  assertFalse,
  assertRejects,
  assertStringIncludes,
  assertThrows,
} from "@std/assert";
import { MemoryFileSystemAdapter } from "../../adapters/scaffold/memory-fs.ts";
import { scaffoldUiIsland, scaffoldUiPage } from "./web-scaffold.ts";

const APP_ROOT = "/workspace/shop/apps/dashboard";
const ROUTER_PATH = `${APP_ROOT}/router.ts`;
const ROUTER_SOURCE =
  `import { createRouteReference } from '@netscript/fresh/route';
import { routes } from './routes.ts';

export const appRoutes = {
  home: routes.$route,
} as const;
`;

type PlannedFile = {
  readonly path: string;
  readonly content: string;
  readonly role?: string;
};

function queryModule(service = "orders"): string {
  return `import { createQueryFactories } from '@netscript/sdk/query';
export const ${service}Name = '${service}';
export const ${service}Queries = createQueryFactories({
  service: { contract: ${service}Contract, client: ${service}Client },
}).service;
`;
}

const PERSISTENT_CONTRACT =
  `import { createCrudContract } from '@netscript/contracts/crud';
export const OrdersCrudContractV1 = createCrudContract({ resource: 'orders' });
`;
const MEMORY_CONTRACT = `export const OrdersListInputSchemaV1 = z.object({
  limit: z.number(),
  offset: z.number(),
});
`;

async function seedApp(
  fs: MemoryFileSystemAdapter,
  options: {
    readonly fallback?: boolean | string;
    readonly contract?: string;
  } = {},
): Promise<void> {
  await fs.writeFile(ROUTER_PATH, ROUTER_SOURCE);
  const exampleDir = typeof options.fallback === "string"
    ? options.fallback
    : "service";
  const queryPath = options.fallback
    ? `${APP_ROOT}/routes/examples/${exampleDir}/(_lib)/service-query.ts`
    : `${APP_ROOT}/lib/orders.ts`;
  await fs.writeFile(queryPath, queryModule());
  await fs.writeFile(
    "/workspace/shop/contracts/versions/v1/orders.contract.ts",
    options.contract ?? PERSISTENT_CONTRACT,
  );
}

function plannedFiles(result: unknown): readonly PlannedFile[] {
  return (result as { readonly files: readonly PlannedFile[] }).files;
}

function assertDataScreenPlan(files: readonly PlannedFile[]): void {
  assertEquals(
    files.map((file) => file.role).sort(),
    ["island", "page", "query-loader", "route-registration"],
  );
  const source = files.map((file) => file.content).join("\n");
  for (
    const fragment of [
      "from '@app/router.ts'",
      ".withRoute(appRoutes[",
      "createNetScriptQueryClient",
      ".list.queryOptions(input)",
      ".list.clientKey(props.input)",
      "fetchQuery",
      "QueryIsland",
      "useIslandQuery",
      "initialData: props.initialData",
      "initialDataUpdatedAt: props.cachedAt",
      "JSON.stringify(query.data",
    ]
  ) {
    assertStringIncludes(source, fragment);
  }
  assertFalse(source.includes("useSignal(0)"));
  assertFalse(source.includes("queryLoaders = {}"));
}

Deno.test("page --island emits a persistent data-screen plan and route registration", async () => {
  const fs = new MemoryFileSystemAdapter();
  await seedApp(fs);

  const result = await scaffoldUiPage(
    { projectRoot: APP_ROOT, path: "admin/status", island: true },
    fs,
  );
  const files = plannedFiles(result);
  assertEquals(files.length, 4);
  assertDataScreenPlan(files);
  assertEquals(
    files.map((file) => file.path).sort(),
    [
      ROUTER_PATH,
      `${APP_ROOT}/routes/admin/status/(_islands)/StatusIsland.tsx`,
      `${APP_ROOT}/routes/admin/status/(_shared)/query-loaders.ts`,
      `${APP_ROOT}/routes/admin/status/index.tsx`,
    ].sort(),
  );
  assertStringIncludes(
    await fs.readFile(ROUTER_PATH),
    "'admin.status': createRouteReference",
  );
  // Regression: a runtime scaffold.runtime run against a real project caught the emitted
  // `return <QueryIsland>...</QueryIsland>;` as a single line the generated project's own
  // `deno fmt --check` then rejected. The template must always emit the multi-line JSX form
  // deno fmt itself produces, independent of component name length.
  assertStringIncludes(
    await fs.readFile(`${APP_ROOT}/routes/admin/status/(_islands)/StatusIsland.tsx`),
    "  return (\n    <QueryIsland>\n      <StatusData {...props} />\n    </QueryIsland>\n  );",
  );
});

Deno.test("page --island dry-run plans the memory dialect through the init fallback without writes", async () => {
  const fs = new MemoryFileSystemAdapter();
  await seedApp(fs, { fallback: true, contract: MEMORY_CONTRACT });
  const before = new Map(fs.getFiles());

  const result = await scaffoldUiPage(
    {
      projectRoot: APP_ROOT,
      path: "activity",
      island: true,
      dryRun: true,
    } as Parameters<
      typeof scaffoldUiPage
    >[0],
    fs,
  );
  const files = plannedFiles(result);
  assertDataScreenPlan(files);
  const loader = files.find((file) => file.role === "query-loader")?.content ??
    "";
  assertStringIncludes(loader, "offset: 0");
  assertFalse(loader.includes("sortBy"));
  assertEquals(fs.getFiles(), before);
});

Deno.test("page --island discovers the example query client under its real service-named directory, not only the literal 'service' fallback", async () => {
  const fs = new MemoryFileSystemAdapter();
  await seedApp(fs, { fallback: "users", contract: MEMORY_CONTRACT });

  const result = await scaffoldUiPage(
    {
      projectRoot: APP_ROOT,
      path: "activity",
      island: true,
      dryRun: true,
    } as Parameters<typeof scaffoldUiPage>[0],
    fs,
  );
  assertDataScreenPlan(plannedFiles(result));
});

Deno.test("data-bound scaffold names the prerequisite and performs zero writes without a binding", async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(ROUTER_PATH, ROUTER_SOURCE);
  const before = new Map(fs.getFiles());

  await assertRejects(
    () =>
      scaffoldUiPage(
        { projectRoot: APP_ROOT, path: "orders", island: true },
        fs,
      ),
    Error,
    "netscript service add --name <service> --with-client",
  );
  assertEquals(fs.getFiles(), before);
});

Deno.test("target collision preflight rejects before writing any other planned file", async () => {
  const fs = new MemoryFileSystemAdapter();
  await seedApp(fs);
  const islandPath = `${APP_ROOT}/routes/orders/(_islands)/OrdersIsland.tsx`;
  await fs.writeFile(islandPath, "// owned island\n");
  const before = new Map(fs.getFiles());

  await assertRejects(
    () =>
      scaffoldUiPage(
        { projectRoot: APP_ROOT, path: "orders", island: true },
        fs,
      ),
    Error,
    islandPath,
  );
  assertEquals(fs.getFiles(), before);
});

Deno.test("force replaces all generated targets after complete preflight", async () => {
  const fs = new MemoryFileSystemAdapter();
  await seedApp(fs);
  for (
    const path of [
      `${APP_ROOT}/routes/orders/index.tsx`,
      `${APP_ROOT}/routes/orders/(_islands)/OrdersIsland.tsx`,
      `${APP_ROOT}/routes/orders/(_shared)/query-loaders.ts`,
    ]
  ) {
    await fs.writeFile(path, "// stale generated target\n");
  }

  const result = await scaffoldUiPage(
    {
      projectRoot: APP_ROOT,
      path: "orders",
      island: true,
      force: true,
    } as Parameters<
      typeof scaffoldUiPage
    >[0],
    fs,
  );
  assertDataScreenPlan(plannedFiles(result));
  assertFalse(
    (await fs.readFile(`${APP_ROOT}/routes/orders/index.tsx`)).includes(
      "stale",
    ),
  );
  assertStringIncludes(
    await fs.readFile(ROUTER_PATH),
    "'orders': createRouteReference",
  );
});

Deno.test("plain page uses appRoutes registration without requiring a query binding", async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(ROUTER_PATH, ROUTER_SOURCE);

  const files = plannedFiles(
    await scaffoldUiPage({ projectRoot: APP_ROOT, path: "about/team" }, fs),
  );
  assertEquals(files.map((file) => file.role).sort(), [
    "page",
    "route-registration",
  ]);
  const page = await fs.readFile(`${APP_ROOT}/routes/about/team/index.tsx`);
  assertStringIncludes(page, "import { appRoutes } from '@app/router.ts';");
  assertStringIncludes(page, ".withRoute(appRoutes['about.team'])");
  assertFalse(page.includes("createRouteReference"));
});

Deno.test("standalone islands use the route-tree convention and query mode binds the list factory", async () => {
  const fs = new MemoryFileSystemAdapter();
  await seedApp(fs);

  await scaffoldUiIsland({ projectRoot: APP_ROOT, name: "live-counter" }, fs);
  const queryResult = await scaffoldUiIsland(
    { projectRoot: APP_ROOT, name: "query-panel", query: true },
    fs,
  );
  assert(await fs.exists(`${APP_ROOT}/routes/(_islands)/LiveCounter.tsx`));
  assertFalse(await fs.exists(`${APP_ROOT}/islands/LiveCounter.tsx`));
  assertEquals(plannedFiles(queryResult)[0].role, "island");
  const queryIsland = await fs.readFile(
    `${APP_ROOT}/routes/(_islands)/QueryPanel.tsx`,
  );
  assertStringIncludes(queryIsland, "useIslandQuery");
  assertStringIncludes(queryIsland, ".list.queryOptions(");
  assertStringIncludes(queryIsland, ".list.clientKey(");
  // Regression: a runtime scaffold.runtime run against a real project caught the emitted
  // `return <QueryIsland>...</QueryIsland>;` as a single line the generated project's own
  // `deno fmt --check` then rejected. The template must always emit the multi-line JSX form
  // deno fmt itself produces, independent of component name length.
  assertStringIncludes(
    queryIsland,
    "  return (\n    <QueryIsland>\n      <QueryPanelData />\n    </QueryIsland>\n  );",
  );
});

Deno.test("semantic golden rejects the old counter and empty-loader emission", () => {
  const oldFiles: PlannedFile[] = [
    {
      path: "index.tsx",
      role: "page",
      content: ".withLayer('orders', () => <div />, () => ({}))",
    },
    {
      path: "OrdersIsland.tsx",
      role: "island",
      content: "const count = useSignal(0);",
    },
    {
      path: "query-loaders.ts",
      role: "query-loader",
      content: "export const queryLoaders = {} as const;",
    },
    { path: "router.ts", role: "route-registration", content: ROUTER_SOURCE },
  ];
  assertThrows(() => assertDataScreenPlan(oldFiles), Error);
});
