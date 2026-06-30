import { assertEquals } from "jsr:@std/assert@^1";
import { join } from "@std/path";
import { findOfficialPluginSourceRoot } from "./official-plugin-source.ts";

Deno.test("findOfficialPluginSourceRoot follows copied workspace source marker", async () => {
  const sourceRoot = await Deno.makeTempDir();
  const copiedRoot = await Deno.makeTempDir();

  await Deno.mkdir(join(sourceRoot, "packages", "cli", "bin"), { recursive: true });
  await Deno.writeTextFile(
    join(sourceRoot, "packages", "cli", "bin", "netscript.ts"),
    "export {};\n",
  );
  await Deno.mkdir(join(sourceRoot, "plugins", "workers"), { recursive: true });
  await Deno.writeTextFile(
    join(sourceRoot, "plugins", "workers", "scaffold.plugin.json"),
    JSON.stringify({
      provider: {
        kind: "worker",
      },
      officialSource: {
        canonicalName: "workers",
        serviceEntrypoint: "jsr:@netscript/plugin-workers/services",
        serviceConfigKey: "workers-api",
        servicePort: 8091,
        backgroundPort: 8091,
      },
    }) + "\n",
  );

  await Deno.mkdir(join(copiedRoot, "packages", "cli", "src"), { recursive: true });
  await Deno.writeTextFile(join(copiedRoot, ".netscript-source-root"), sourceRoot + "\n");

  assertEquals(
    await findOfficialPluginSourceRoot(join(copiedRoot, "packages", "cli", "src")),
    sourceRoot,
  );
});
