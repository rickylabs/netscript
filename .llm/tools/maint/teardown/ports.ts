export interface CommandResult {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

export interface CommandPort {
  run(command: readonly string[], timeoutMs: number): Promise<CommandResult>;
}

export interface FilePort {
  realPath(path: string): Promise<string>;
  readText(path: string): Promise<string>;
  listNames?(path: string): Promise<readonly string[]>;
  readLink?(path: string): Promise<string>;
}

export const systemFiles: FilePort = {
  realPath: (path) => Deno.realPath(path),
  readText: (path) => Deno.readTextFile(path),
  async listNames(path) {
    const names: string[] = [];
    for await (const entry of Deno.readDir(path)) names.push(entry.name);
    return names;
  },
  readLink: (path) => Deno.readLink(path),
};

export const systemCommands: CommandPort = {
  async run(command, timeoutMs) {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), timeoutMs);
    try {
      const output = await new Deno.Command(command[0], {
        args: command.slice(1),
        stdout: 'piped',
        stderr: 'piped',
        signal: abort.signal,
      }).output();
      return {
        code: output.code,
        stdout: new TextDecoder().decode(output.stdout),
        stderr: new TextDecoder().decode(output.stderr),
      };
    } finally {
      clearTimeout(timer);
    }
  },
};
