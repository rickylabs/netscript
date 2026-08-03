import { Command } from "@cliffy/command";
import { FilesystemDiagnosticEvidence, recordDrift } from "@netscript/mcp";
import { RemoteError } from "../../../../kernel/domain/errors/cli-exit-error.ts";
import type { CliffyCommand } from "../../../../kernel/presentation/command-types.ts";

interface Options {
  readonly resource: string;
  readonly summary: string;
  readonly details?: string;
}

/** Create the project-local evidence-gated drift recorder. */
export function createRecordDriftCommand(
  projectRoot: () => string,
): CliffyCommand {
  return new Command()
    .name("record")
    .description("Record drift after a fresh successful diagnostic pass")
    .option(
      "--resource <name:string>",
      "Resource diagnosed by plugin doctor or MCP telemetry",
      { required: true },
    )
    .option("--summary <text:string>", "Short drift or defect summary", {
      required: true,
    })
    .option(
      "--details <text:string>",
      "Additional evidence or reproduction detail",
    )
    .action(async (options: Options) => {
      const result = await recordDrift(
        options,
        new FilesystemDiagnosticEvidence(projectRoot()),
      );
      if (!result.ok) throw new RemoteError(1, result.error.message);
    });
}
