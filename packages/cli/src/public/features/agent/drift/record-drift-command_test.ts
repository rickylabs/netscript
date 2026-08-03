import { assertEquals, assertRejects, assertStringIncludes } from "@std/assert";
import { join } from "@std/path";
import {
  DIAGNOSTIC_RECEIPT_TTL_MS,
  FilesystemDiagnosticEvidence,
} from "@netscript/mcp";
import { RemoteError } from "../../../../kernel/domain/errors/cli-exit-error.ts";
import { createRecordDriftCommand } from "./record-drift-command.ts";

Deno.test("agent drift record enforces the same receipt gate and appends locally", async () => {
  const root = await Deno.makeTempDir();
  try {
    const command = createRecordDriftCommand(() => root);
    const error = await assertRejects(
      () => command.parse(["--resource", "api", "--summary", "hang"]),
      RemoteError,
    );
    assertStringIncludes(
      error.message,
      "netscript plugin doctor --resource api",
    );
    const evidence = new FilesystemDiagnosticEvidence(root);
    for (
      const receipt of [
        {
          resource: "api",
          command: "mcp doctor",
          timestamp: new Date(Date.now() - DIAGNOSTIC_RECEIPT_TTL_MS - 1)
            .toISOString(),
          exitStatus: 0,
        },
        {
          resource: "api",
          command: "mcp doctor",
          timestamp: new Date().toISOString(),
          exitStatus: 1,
        },
      ]
    ) {
      await evidence.write(receipt);
      await assertRejects(
        () =>
          createRecordDriftCommand(() => root).parse([
            "--resource",
            "api",
            "--summary",
            "hang",
          ]),
        RemoteError,
      );
    }
    await evidence.write({
      resource: "api",
      command: "mcp doctor",
      timestamp: new Date().toISOString(),
      exitStatus: 0,
    });
    await command.parse(["--resource", "api", "--summary", "hang"]);
    const lines =
      (await Deno.readTextFile(join(root, ".netscript/agent/drift.jsonl")))
        .trim().split("\n");
    assertEquals(lines.length, 1);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
