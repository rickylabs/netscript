import { resolveRegistryItems, type UiRegistryManifest } from "./registry.ts";

const manifest: UiRegistryManifest = {
  items: [
    {
      name: "ns-one",
      kind: "theme",
      files: [
        { source: "registry/theme/styles.css", target: "@assets/styles.css" },
        { source: "registry/theme/tokens.css", target: "@assets/tokens.css" },
      ],
    },
    {
      name: "midnight",
      kind: "theme",
      files: [
        { source: "registry/themes/midnight/styles.css", target: "@assets/styles.css" },
        { source: "registry/themes/midnight/tokens.css", target: "@assets/tokens.css" },
      ],
    },
    {
      name: "button",
      kind: "component",
      files: [{ source: "registry/components/ui/button.tsx", target: "@ui/button.tsx" }],
      registryDependencies: ["ns-one"],
    },
  ],
  collections: [{ name: "starter", items: ["button"] }],
};

function names(items: readonly { name: string }[]): string {
  return items.map((item) => item.name).join(",");
}

Deno.test("resolveRegistryItems installs the official theme by default", () => {
  const items = resolveRegistryItems(manifest, ["button"]);
  if (names(items) !== "ns-one,button") {
    throw new Error(`Expected default theme before button, got: ${names(items)}`);
  }
});

Deno.test("resolveRegistryItems substitutes a theme override for theme dependencies", () => {
  const items = resolveRegistryItems(manifest, ["button"], "midnight");
  if (names(items) !== "midnight,button") {
    throw new Error(`Expected the override theme to replace ns-one, got: ${names(items)}`);
  }
});

Deno.test("resolveRegistryItems applies theme overrides through collections", () => {
  const items = resolveRegistryItems(manifest, ["starter"], "midnight");
  if (names(items) !== "midnight,button") {
    throw new Error(`Expected the override theme through the collection, got: ${names(items)}`);
  }
});

Deno.test("resolveRegistryItems rejects a theme override that is not a theme item", () => {
  let message = "";
  try {
    resolveRegistryItems(manifest, ["button"], "button");
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }
  if (!message.includes("is not a theme")) {
    throw new Error(`Expected a not-a-theme error, got: ${message || "no error"}`);
  }
});

Deno.test("resolveRegistryItems rejects an unknown theme override", () => {
  let message = "";
  try {
    resolveRegistryItems(manifest, ["button"], "solarized");
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }
  if (!message.includes("Unknown Fresh UI theme")) {
    throw new Error(`Expected an unknown-theme error, got: ${message || "no error"}`);
  }
});
