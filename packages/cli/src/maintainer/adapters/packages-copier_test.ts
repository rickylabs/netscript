import { assertEquals } from "jsr:@std/assert@^1";
import { join } from "@std/path";
import { copyLocalPackages } from "./packages-copier.ts";

const LOCAL_PACKAGES = [
  "ai",
  "aspire",
  "cli",
  "config",
  "cron",
  "database",
  "fresh",
  "fresh-ui",
  "kv",
  "logger",
  "plugin",
  "plugin-ai-core",
  "plugin-auth-core",
  "auth-workos",
  "auth-better-auth",
  "auth-kv-oauth",
  "plugin-sagas-core",
  "queue",
  "runtime-config",
  "sdk",
  "service",
  "contracts",
  "plugin-workers-core",
  "plugin-streams-core",
  "plugin-triggers-core",
  "telemetry",
  "watchers",
];

Deno.test("copyLocalPackages keeps mysql adapter engine-specific while resolving database imports", async () => {
  const sourceRoot = await Deno.makeTempDir();
  const targetPath = await Deno.makeTempDir();

  for (const packageName of [...LOCAL_PACKAGES, "prisma-adapter-mysql"]) {
    await writePackage(sourceRoot, packageName);
  }
  await writeSourceRootDenoJson(sourceRoot);
  await writeRootDenoJson(targetPath);

  await copyLocalPackages({
    sourceRoot: sourceRoot,
    targetPath,
    dbEngines: ["postgres"],
  });

  assertEquals(
    await exists(join(targetPath, "packages/prisma-adapter-mysql")),
    false,
  );
  const databaseConfig = JSON.parse(
    await Deno.readTextFile(join(targetPath, "packages/database/deno.json")),
  ) as { exports: Record<string, string>; imports?: Record<string, string> };
  assertEquals(databaseConfig.exports["./adapters/mysql"], undefined);
  assertEquals(
    databaseConfig.imports?.["@opentelemetry/api"],
    "npm:@opentelemetry/api@^1.9.0",
  );
  assertEquals(
    await exists(
      join(targetPath, "packages/database/adapters/mysql.adapter.ts"),
    ),
    false,
  );

  const rootConfig = JSON.parse(
    await Deno.readTextFile(join(targetPath, "deno.json")),
  ) as {
    catalog?: Record<string, string>;
  };
  assertEquals(rootConfig.catalog?.["@opentelemetry/api"], "^1.9.0");
  assertEquals(
    await Deno.readTextFile(join(targetPath, ".netscript-source-root")),
    sourceRoot + "\n",
  );
});

Deno.test("copyLocalPackages copies mysql adapter only for mysql engine", async () => {
  const sourceRoot = await Deno.makeTempDir();
  const targetPath = await Deno.makeTempDir();

  for (const packageName of [...LOCAL_PACKAGES, "prisma-adapter-mysql"]) {
    await writePackage(sourceRoot, packageName);
  }
  await writeSourceRootDenoJson(sourceRoot);
  await writeRootDenoJson(targetPath);

  await copyLocalPackages({
    sourceRoot: sourceRoot,
    targetPath,
    dbEngines: ["mysql"],
  });

  assertEquals(
    await exists(join(targetPath, "packages/prisma-adapter-mysql")),
    true,
  );
  const databaseConfig = JSON.parse(
    await Deno.readTextFile(join(targetPath, "packages/database/deno.json")),
  ) as { exports: Record<string, string>; imports?: Record<string, string> };
  assertEquals(
    databaseConfig.exports["./adapters/mysql"],
    "./adapters/mysql.adapter.ts",
  );
  assertEquals(
    databaseConfig.imports?.["@netscript/prisma-adapter-mysql"],
    undefined,
  );
  assertEquals(
    await exists(
      join(targetPath, "packages/database/adapters/mysql.adapter.ts"),
    ),
    true,
  );

  const rootConfig = JSON.parse(
    await Deno.readTextFile(join(targetPath, "deno.json")),
  ) as {
    workspace: string[];
  };
  assertEquals(
    rootConfig.workspace.includes("./packages/prisma-adapter-mysql"),
    true,
  );
});

async function writePackage(root: string, packageName: string): Promise<void> {
  const packageRoot = join(root, "packages", packageName);
  await Deno.mkdir(packageRoot, { recursive: true });
  await Deno.writeTextFile(join(packageRoot, "mod.ts"), "export {};\n");
  if (packageName === "database") {
    await Deno.mkdir(join(packageRoot, "adapters"), { recursive: true });
    await Deno.writeTextFile(
      join(packageRoot, "adapters/mysql.adapter.ts"),
      "export {};\n",
    );
    await Deno.writeTextFile(
      join(packageRoot, "deno.json"),
      JSON.stringify({
        name: "@netscript/database",
        exports: {
          ".": "./mod.ts",
          "./adapters/mysql": "./adapters/mysql.adapter.ts",
        },
        imports: {
          "@opentelemetry/api": "catalog:",
        },
      }) + "\n",
    );
    return;
  }

  await Deno.writeTextFile(
    join(packageRoot, "deno.json"),
    JSON.stringify({
      name: `@netscript/${packageName}`,
      imports: {},
    }) + "\n",
  );
}

async function writeSourceRootDenoJson(sourceRoot: string): Promise<void> {
  await Deno.writeTextFile(
    join(sourceRoot, "deno.json"),
    JSON.stringify({
      catalog: {
        "@opentelemetry/api": "^1.9.0",
      },
    }) + "\n",
  );
}

async function writeRootDenoJson(targetPath: string): Promise<void> {
  await Deno.writeTextFile(
    join(targetPath, "deno.json"),
    JSON.stringify({
      workspace: ["./packages/database"],
    }) + "\n",
  );
}

async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    throw error;
  }
}
