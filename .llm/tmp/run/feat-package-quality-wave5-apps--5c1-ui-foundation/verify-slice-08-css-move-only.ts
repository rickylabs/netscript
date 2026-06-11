const oldAggregateFiles = [
  "packages/fresh-ui/registry/theme/components/actions.css",
  "packages/fresh-ui/registry/theme/components/forms.css",
  "packages/fresh-ui/registry/theme/components/surfaces.css",
  "packages/fresh-ui/registry/theme/components/feedback.css",
];

const newPerItemFiles = [
  "packages/fresh-ui/registry/components/ui/button.css",
  "packages/fresh-ui/registry/components/ui/form-field.css",
  "packages/fresh-ui/registry/components/ui/form-control-styles.css",
  "packages/fresh-ui/registry/components/ui/textarea.css",
  "packages/fresh-ui/registry/components/ui/label.css",
  "packages/fresh-ui/registry/components/ui/choice-styles.css",
  "packages/fresh-ui/registry/components/ui/checkbox.css",
  "packages/fresh-ui/registry/components/ui/switch.css",
  "packages/fresh-ui/registry/components/ui/badge.css",
  "packages/fresh-ui/registry/components/ui/surface-styles.css",
  "packages/fresh-ui/registry/components/ui/card.css",
  "packages/fresh-ui/registry/components/ui/panel.css",
  "packages/fresh-ui/registry/components/ui/sheet.css",
  "packages/fresh-ui/registry/components/ui/separator.css",
  "packages/fresh-ui/registry/components/ui/toast.css",
  "packages/fresh-ui/registry/components/ui/spinner.css",
  "packages/fresh-ui/registry/components/ui/progress.css",
  "packages/fresh-ui/registry/components/ui/alert-styles.css",
  "packages/fresh-ui/registry/components/ui/alert.css",
  "packages/fresh-ui/registry/components/ui/inline-notice.css",
  "packages/fresh-ui/registry/components/ui/skeleton.css",
];

const baseRef = readArgValue("--base-ref") ?? "HEAD";
const jsonOut = readArgValue("--json-out");

const oldCss =
  (await Promise.all(oldAggregateFiles.map((file) => gitShow(baseRef, file))))
    .join("\n\n");
const newCss =
  (await Promise.all(newPerItemFiles.map((file) => Deno.readTextFile(file))))
    .join("\n\n");

const oldStatements = topLevelStatements(oldCss).map(normalizeStatement).sort();
const newStatements = topLevelStatements(newCss).map(normalizeStatement).sort();

const missingStatements = subtract(oldStatements, newStatements);
const extraStatements = subtract(newStatements, oldStatements);
const report = {
  slice: 8,
  gate: "css-move-only",
  status: missingStatements.length === 0 && extraStatements.length === 0
    ? "PASS"
    : "FAIL",
  baseRef,
  oldAggregateFiles,
  newPerItemFiles,
  oldStatementCount: oldStatements.length,
  newStatementCount: newStatements.length,
  missingStatementCount: missingStatements.length,
  extraStatementCount: extraStatements.length,
  missingStatements,
  extraStatements,
};

if (jsonOut) {
  await Deno.writeTextFile(jsonOut, `${JSON.stringify(report, null, 2)}\n`);
}

if (report.status === "PASS") {
  console.log(
    `css-move-only: PASS ${report.oldStatementCount}/${report.newStatementCount} top-level statements preserved from ${baseRef}`,
  );
} else {
  console.error("css-move-only: FAIL");
  console.error(JSON.stringify(report, null, 2));
  Deno.exit(1);
}

function readArgValue(name: string): string | undefined {
  const index = Deno.args.indexOf(name);
  return index === -1 ? undefined : Deno.args[index + 1];
}

async function gitShow(ref: string, path: string): Promise<string> {
  const command = new Deno.Command("git", {
    args: ["show", `${ref}:${path}`],
    stdout: "piped",
    stderr: "piped",
  });
  const output = await command.output();
  if (!output.success) {
    const stderr = new TextDecoder().decode(output.stderr).trim();
    throw new Error(`git show failed for ${ref}:${path}: ${stderr}`);
  }

  return new TextDecoder().decode(output.stdout);
}

function topLevelStatements(css: string): string[] {
  const withoutComments = css.replaceAll(/\/\*[\s\S]*?\*\//g, "");
  const statements: string[] = [];
  let start = -1;
  let depth = 0;

  for (let index = 0; index < withoutComments.length; index += 1) {
    const char = withoutComments[index];
    if (start === -1 && /\S/.test(char)) {
      start = index;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        statements.push(withoutComments.slice(start, index + 1));
        start = -1;
      }
    }
  }

  return statements;
}

function normalizeStatement(statement: string): string {
  return statement.replaceAll(/\s+/g, " ").trim();
}

function subtract(left: string[], right: string[]): string[] {
  const counts = new Map<string, number>();
  for (const value of right) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  const result: string[] = [];
  for (const value of left) {
    const count = counts.get(value) ?? 0;
    if (count > 0) {
      counts.set(value, count - 1);
      continue;
    }
    result.push(value);
  }

  return result;
}
