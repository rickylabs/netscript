import { assertEquals } from "@std/assert";
import { MemoryFileSystemAdapter } from "../scaffold/memory-fs.ts";
import { DatabaseWorkspaceMutator } from "./workspace-mutator.ts";

Deno.test("database removal repairs primary and tool references", async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(
    "/project/appsettings.json",
    JSON.stringify({
      NetScript: {
        PrimaryDatabase: "primary",
        Databases: {
          primary: { Engine: "Postgres", DatabaseName: "main" },
          reports: { Engine: "Postgres", DatabaseName: "reports" },
        },
        Tools: { "prisma-studio": { Database: "primary" } },
      },
    }),
  );
  const mutator = new DatabaseWorkspaceMutator(fs, {} as never, {} as never);
  await mutator.removeDatabaseFromAppsettings("/project", "primary");
  const settings = JSON.parse(await fs.readFile("/project/appsettings.json"));
  assertEquals(settings.NetScript.PrimaryDatabase, "reports");
  assertEquals(settings.NetScript.Tools["prisma-studio"].Database, "reports");
  assertEquals(settings.NetScript.Databases.primary, undefined);
});
