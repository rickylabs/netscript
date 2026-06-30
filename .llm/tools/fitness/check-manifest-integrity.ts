import { freshUiRegistryManifest } from "../../../packages/fresh-ui/registry.manifest.ts";

const registryRoot = "registry/";
const excludedRegistrySources = new Set([
  "registry/manifest.ts",
  "registry/schema.ts",
]);
const allowedTargetPrefixes = ["@ui/", "@islands/", "@assets/", "@lib/", "~/"];

interface IntegrityReport {
  gate: "manifest-integrity";
  status: "PASS" | "FAIL";
  itemCount: number;
  collectionCount: number;
  claimedFileCount: number;
  registryFileCount: number;
  excludedFileCount: number;
  missingFiles: string[];
  unclaimedFiles: string[];
  duplicateItems: string[];
  duplicateSources: string[];
  unknownCollectionItems: string[];
  unknownRegistryDependencies: string[];
  invalidTargets: string[];
  authorlessItems: string[];
}

const jsonOut = readArgValue("--json-out");
const report = await buildReport();

if (jsonOut) {
  await Deno.writeTextFile(jsonOut, `${JSON.stringify(report, null, 2)}\n`);
}

if (report.status === "PASS") {
  console.log(
    `manifest-integrity: PASS ${report.claimedFileCount}/${report.registryFileCount} registry files claimed (${report.excludedFileCount} excluded)`,
  );
} else {
  console.error("manifest-integrity: FAIL");
  console.error(JSON.stringify(report, null, 2));
  Deno.exit(1);
}

async function buildReport(): Promise<IntegrityReport> {
  const items = freshUiRegistryManifest.items;
  const itemNames = items.map((item) => item.name);
  const duplicateItems = findDuplicates(itemNames);
  const itemNameSet = new Set(itemNames);

  const claimedSources = items.flatMap((item) =>
    item.files.map((file) => file.source)
  );
  const claimedSourceSet = new Set(claimedSources);
  const duplicateSources = findDuplicates(claimedSources);

  const allRegistryFiles = await walkRegistryFiles();
  const registryFiles = allRegistryFiles
    .filter((source) => !isExcludedRegistrySource(source))
    .sort();
  const registryFileSet = new Set(registryFiles);
  const excludedFileCount = allRegistryFiles
    .filter((source) => isExcludedRegistrySource(source)).length;

  const missingFiles = claimedSources
    .filter((source) => !registryFileSet.has(source))
    .sort();
  const unclaimedFiles = registryFiles
    .filter((source) => !claimedSourceSet.has(source))
    .sort();

  const unknownCollectionItems = freshUiRegistryManifest.collections
    .flatMap((collection) =>
      collection.items
        .filter((itemName) => !itemNameSet.has(itemName))
        .map((itemName) => `${collection.name}:${itemName}`)
    )
    .sort();

  const unknownRegistryDependencies = items
    .flatMap((item) =>
      (item.registryDependencies ?? [])
        .filter((dependency) =>
          !dependency.startsWith("@") && !itemNameSet.has(dependency)
        )
        .map((dependency) => `${item.name}:${dependency}`)
    )
    .sort();

  const invalidTargets = items
    .flatMap((item) =>
      item.files
        .filter((file) =>
          !allowedTargetPrefixes.some((prefix) =>
            file.target.startsWith(prefix)
          )
        )
        .map((file) => `${item.name}:${file.target}`)
    )
    .sort();

  const authorlessItems = items
    .filter((item) => !item.author)
    .map((item) => item.name)
    .sort();

  const failures = [
    missingFiles,
    unclaimedFiles,
    duplicateItems,
    duplicateSources,
    unknownCollectionItems,
    unknownRegistryDependencies,
    invalidTargets,
    authorlessItems,
  ];

  return {
    gate: "manifest-integrity",
    status: failures.every((entries) => entries.length === 0) ? "PASS" : "FAIL",
    itemCount: items.length,
    collectionCount: freshUiRegistryManifest.collections.length,
    claimedFileCount: claimedSources.length,
    registryFileCount: registryFiles.length,
    excludedFileCount,
    missingFiles,
    unclaimedFiles,
    duplicateItems,
    duplicateSources,
    unknownCollectionItems,
    unknownRegistryDependencies,
    invalidTargets,
    authorlessItems,
  };
}

function readArgValue(name: string): string | undefined {
  const index = Deno.args.indexOf(name);
  if (index === -1) {
    return undefined;
  }

  return Deno.args[index + 1];
}

async function walkRegistryFiles(): Promise<string[]> {
  const registryUrl = new URL(
    "../../../packages/fresh-ui/registry/",
    import.meta.url,
  );
  const files: string[] = [];
  await walk(registryUrl, registryRoot, files);
  return files.sort();
}

async function walk(url: URL, prefix: string, files: string[]): Promise<void> {
  for await (const entry of Deno.readDir(url)) {
    const childPrefix = `${prefix}${entry.name}`;
    if (entry.isDirectory) {
      await walk(new URL(`${entry.name}/`, url), `${childPrefix}/`, files);
      continue;
    }

    if (entry.isFile) {
      files.push(childPrefix);
    }
  }
}

function isExcludedRegistrySource(source: string): boolean {
  return excludedRegistrySources.has(source) || /\.test\.[jt]sx?$/.test(source);
}

function findDuplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }

  return [...duplicates].sort();
}
