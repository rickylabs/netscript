import { assertEquals, assertRejects } from "jsr:@std/assert@^1";
import { copyFilePortable } from "./deno-file-system.ts";

Deno.test("copyFilePortable falls back to read/write when native copy is denied", async () => {
  const bytes = new TextEncoder().encode("copied through fallback");
  const writes: Array<{ path: string; data: Uint8Array }> = [];

  await copyFilePortable("/source.ts", "/dest.ts", {
    copyFile: () => {
      throw new Deno.errors.PermissionDenied("copy denied");
    },
    readFile: (path) => {
      assertEquals(path, "/source.ts");
      return Promise.resolve(bytes);
    },
    writeFile: (path, data) => {
      writes.push({ path, data });
      return Promise.resolve();
    },
  });

  assertEquals(writes, [{ path: "/dest.ts", data: bytes }]);
});

Deno.test("copyFilePortable rethrows non-permission copy failures", async () => {
  await assertRejects(
    () =>
      copyFilePortable("/source.ts", "/dest.ts", {
        copyFile: () => {
          throw new Deno.errors.NotFound("missing source");
        },
        readFile: () => Promise.resolve(new Uint8Array()),
        writeFile: () => Promise.resolve(),
      }),
    Deno.errors.NotFound,
  );
});
