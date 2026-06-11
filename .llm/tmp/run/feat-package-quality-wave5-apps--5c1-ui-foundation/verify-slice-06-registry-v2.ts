import { freshUiRegistryManifest } from "../../../../packages/fresh-ui/registry/manifest.ts";

const runDir =
  ".llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation";
const allowedTargets = ["@ui/", "@islands/", "@assets/", "@lib/", "~/"];
const items = freshUiRegistryManifest.items;
const themeSeed = items.find((item) => item.name === "theme-seed");
const allFiles = items.flatMap((item) =>
  item.files.map((file) => ({ item: item.name, file }))
);
const invalidTargets = allFiles.filter(({ file }) =>
  !allowedTargets.some((prefix) => file.target.startsWith(prefix))
);
const oldDependencyShape = items.filter((item) =>
  "dependencies" in item &&
  item.dependencies?.some((dependency) =>
    !dependency.startsWith("jsr:") && !dependency.startsWith("npm:")
  )
);
const registryDependencyErrors = items.filter((item) =>
  item.registryDependencies?.some((dependency) =>
    typeof dependency !== "string"
  )
);
const blockItems = items.filter((item) => item.kind === "block").map((item) =>
  item.name
);
const authorlessItems = items.filter((item) => !item.author).map((item) =>
  item.name
);
const result = {
  schemaVersion: freshUiRegistryManifest.schemaVersion,
  tokenSourceStrategy: freshUiRegistryManifest.tokenSourceStrategy,
  itemCount: items.length,
  blockItemCount: blockItems.length,
  invalidTargets,
  oldDependencyShape: oldDependencyShape.map((item) => item.name),
  registryDependencyErrors: registryDependencyErrors.map((item) => item.name),
  authorlessItems,
  themeSeedGeneratedFiles: {
    themeBridge: Boolean(
      themeSeed?.files.some((file) =>
        file.target === "@assets/theme-bridge.css"
      ),
    ),
    tokensJson: Boolean(
      themeSeed?.files.some((file) => file.target === "@assets/tokens.json"),
    ),
  },
  themeSeedCssVars: {
    theme: Object.keys(themeSeed?.cssVars?.theme ?? {}).length,
    light: Object.keys(themeSeed?.cssVars?.light ?? {}).length,
  },
};

await Deno.writeTextFile(
  `${runDir}/slice-06-registry-v2-integrity.json`,
  `${JSON.stringify(result, null, 2)}\n`,
);
console.log(JSON.stringify(result, null, 2));

if (
  result.schemaVersion !== 2 ||
  result.tokenSourceStrategy !== "style-dictionary-dtcg-source" ||
  result.invalidTargets.length ||
  result.oldDependencyShape.length ||
  result.registryDependencyErrors.length ||
  result.authorlessItems.length ||
  !result.themeSeedGeneratedFiles.themeBridge ||
  !result.themeSeedGeneratedFiles.tokensJson ||
  result.themeSeedCssVars.theme === 0 ||
  result.themeSeedCssVars.light === 0
) {
  Deno.exit(1);
}
