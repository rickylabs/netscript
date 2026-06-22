const siteRoot = new URL("../", import.meta.url);
const ignoredDirectories = new Set([
  "_site",
  "_diagrams",
  "_components",
  "_includes",
  "_data",
]);
const sourceExtensions = new Set([".md", ".vto"]);
const diagramSourcePattern =
  /comp\.diagram\s*\(\s*\{[\s\S]*?src:\s*["']([^"']+)["']/g;

type DiagramReference = {
  sourcePath: string;
  assetPath: string;
};

function fileExtension(path: string): string {
  const index = path.lastIndexOf(".");
  return index === -1 ? "" : path.slice(index);
}

function relativeSitePath(fileUrl: URL): string {
  return decodeURIComponent(fileUrl.pathname.slice(siteRoot.pathname.length));
}

async function* walkSourceFiles(dir: URL): AsyncGenerator<URL> {
  for await (const entry of Deno.readDir(dir)) {
    if (ignoredDirectories.has(entry.name)) continue;
    const child = new URL(entry.name, dir);
    if (entry.isDirectory) {
      yield* walkSourceFiles(new URL(`${entry.name}/`, dir));
      continue;
    }
    if (entry.isFile && sourceExtensions.has(fileExtension(entry.name))) {
      yield child;
    }
  }
}

async function findDiagramReferences(): Promise<DiagramReference[]> {
  const references: DiagramReference[] = [];
  for await (const file of walkSourceFiles(siteRoot)) {
    const text = await Deno.readTextFile(file);
    for (const match of text.matchAll(diagramSourcePattern)) {
      references.push({
        sourcePath: relativeSitePath(file),
        assetPath: match[1],
      });
    }
  }
  return references;
}

function diagramAssetUrl(assetPath: string): URL | undefined {
  if (
    !assetPath.startsWith("/assets/diagrams/") || !assetPath.endsWith(".svg")
  ) {
    return undefined;
  }
  return new URL(assetPath.replace(/^\//, ""), siteRoot);
}

async function exists(file: URL): Promise<boolean> {
  try {
    const stat = await Deno.stat(file);
    return stat.isFile;
  } catch {
    return false;
  }
}

/** Fail the docs build when a comp.diagram reference points at a missing SVG. */
export async function assertDiagramAssetsExist(): Promise<void> {
  const references = await findDiagramReferences();
  const failures: string[] = [];
  for (const reference of references) {
    const asset = diagramAssetUrl(reference.assetPath);
    if (asset === undefined) {
      failures.push(
        `${reference.sourcePath}: diagram src must point at /assets/diagrams/*.svg (${reference.assetPath})`,
      );
      continue;
    }
    if (!(await exists(asset))) {
      failures.push(
        `${reference.sourcePath}: missing diagram asset ${reference.assetPath}`,
      );
    }
  }

  if (failures.length > 0) {
    throw new Error(
      [
        "[diagram] missing or invalid diagram asset reference",
        ...failures.map((failure) => `  - ${failure}`),
      ].join("\n"),
    );
  }

  console.log(
    `[diagram] verified ${references.length} diagram asset reference(s).`,
  );
}
