/** Captures a Kimi K2.6 vision evaluation through the canonical OpenCode lane. */

import { OPENCODE_MODEL_IDS } from '../config/models.ts';
import { OPENCODE_TOOL } from '../config/versions.ts';
import { runOpenCode } from './opencode-run.ts';

interface EvalOptions {
  readonly prompt: string;
  readonly files: readonly string[];
  readonly variant: string;
}

function requiredValue(args: readonly string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (!value?.trim()) throw new Error(`${flag} requires a value`);
  return value;
}

function parse(args: readonly string[]): EvalOptions {
  let prompt: string | undefined;
  let variant: string = OPENCODE_TOOL.defaultVariant;
  const files: string[] = [];
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === '--prompt') prompt = requiredValue(args, index++, argument);
    else if (argument === '-f' || argument === '--file') {
      files.push(requiredValue(args, index++, argument));
    } else if (argument === '--variant') variant = requiredValue(args, index++, argument);
    else if (!argument.startsWith('-') && !prompt) prompt = argument;
    else throw new Error(`Unknown or duplicate argument: ${argument}`);
  }
  if (!prompt?.trim() || files.length === 0) {
    throw new Error(
      'Usage: opencode-eval <prompt>|--prompt <text> -f <wsl-image> [-f <wsl-image> ...] ' +
        '[--variant <effort>]',
    );
  }
  return { prompt, files, variant };
}

if (import.meta.main) {
  try {
    const options = parse(Deno.args);
    const result = await runOpenCode({
      message: options.prompt,
      model: OPENCODE_MODEL_IDS.visionEval,
      variant: options.variant,
      files: options.files,
    }, true);
    if (result.stdout !== undefined) {
      await Deno.stdout.write(new TextEncoder().encode(result.stdout));
    }
    Deno.exit(result.code);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exit(2);
  }
}
