#!/usr/bin/env -S deno run --allow-run=deno,git
/**
 * Fitness gate for @netscript/fresh-ui generated token artifacts.
 *
 * CI command:
 * deno run --allow-run=deno,git .llm/tools/fitness/check-token-drift.ts
 */

const GENERATED_TOKEN_ARTIFACTS = [
  "packages/fresh-ui/registry/theme/tokens.css",
  "packages/fresh-ui/registry/theme/theme-bridge.css",
  "packages/fresh-ui/registry/theme/tokens.json",
];

const build = await run("deno", [
  "task",
  "--cwd",
  "packages/fresh-ui",
  "tokens:build",
]);

if (!build.success) {
  printCommandFailure("tokens:build", build);
  Deno.exit(1);
}

const untracked = [];
for (const path of GENERATED_TOKEN_ARTIFACTS) {
  const tracked = await run("git", ["ls-files", "--error-unmatch", path]);
  if (!tracked.success) untracked.push(path);
}

if (untracked.length) {
  console.error("tokens-drift: FAIL untracked generated artifacts");
  for (const path of untracked) console.error(`  ${path}`);
  Deno.exit(1);
}

const diff = await run("git", [
  "diff",
  "--exit-code",
  "--",
  ...GENERATED_TOKEN_ARTIFACTS,
]);

if (!diff.success) {
  console.error("tokens-drift: FAIL generated artifacts changed after rebuild");
  const status = await run("git", [
    "status",
    "--short",
    "--",
    ...GENERATED_TOKEN_ARTIFACTS,
  ]);
  console.error(text(status.stdout).trimEnd());
  Deno.exit(1);
}

console.log(
  `tokens-drift: PASS ${GENERATED_TOKEN_ARTIFACTS.length} generated artifacts stable`,
);

async function run(command: string, args: string[]) {
  return await new Deno.Command(command, {
    args,
    stdout: "piped",
    stderr: "piped",
  }).output();
}

function printCommandFailure(label: string, output: Deno.CommandOutput) {
  console.error(`tokens-drift: FAIL ${label}`);
  const stdout = text(output.stdout).trimEnd();
  const stderr = text(output.stderr).trimEnd();
  if (stdout) console.error(stdout);
  if (stderr) console.error(stderr);
}

function text(bytes: Uint8Array) {
  return new TextDecoder().decode(bytes);
}
