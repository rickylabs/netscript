import { assertEquals } from "@std/assert";
import { normalizePluginItemArgs } from "./run-public-cli.ts";

Deno.test("normalizes plugin custom add syntax without changing other verbs", () => {
  assertEquals(
    normalizePluginItemArgs([
      "plugin",
      "billing",
      "add",
      "invoice",
      "--name",
      "first",
    ]),
    ["plugin", "item-add", "billing", "invoice", "--name", "first"],
  );
  assertEquals(normalizePluginItemArgs(["plugin", "update", "billing"]), [
    "plugin",
    "update",
    "billing",
  ]);
});
