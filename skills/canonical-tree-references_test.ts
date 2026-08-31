import { assertEquals } from "@std/assert";

interface SkillManifest {
  readonly files: readonly string[];
}

Deno.test("shipped skill bodies reference only the canonical agent skill tree", async () => {
  const skillsRoot = new URL("./", import.meta.url);
  const manifest = JSON.parse(
    await Deno.readTextFile(new URL("manifest.json", skillsRoot)),
  ) as SkillManifest;
  const mirrorReferences: string[] = [];

  for (const path of manifest.files.filter((path) => path.endsWith("/SKILL.md"))) {
    const body = await Deno.readTextFile(new URL(path, skillsRoot));
    if (body.includes(".claude/skills/")) mirrorReferences.push(path);
  }

  assertEquals(
    mirrorReferences,
    [],
    "shipped skill bodies must not reference the derived .claude/skills/ mirror",
  );
});
