import type {
  CommandCatalogPort,
  CommandDescriptor,
  DoctorCheck,
  ProjectDoctorPort,
} from "@netscript/mcp";
import type { PluginDoctorReport } from "../../plugins/doctor/doctor-plugin-use-case.ts";

interface EnumerableCommand {
  getName(): string;
  getDescription(): string;
  getCommands(): readonly EnumerableCommand[];
}

/** Live command catalog backed by the public CLI registry. */
export class PublicCliCommandCatalog implements CommandCatalogPort {
  constructor(private readonly root: EnumerableCommand) {}

  listCommands(): Promise<readonly CommandDescriptor[]> {
    return Promise.resolve(walkCommands(this.root));
  }
}

function walkCommands(root: EnumerableCommand): readonly CommandDescriptor[] {
  const descriptors: CommandDescriptor[] = [];
  const describe = (
    command: EnumerableCommand,
    parents: readonly string[],
  ): void => {
    const path = [...parents, command.getName()].join(" ");
    descriptors.push({
      path,
      description: command.getDescription().slice(0, 512),
      usage: `netscript ${path}`.slice(0, 512),
    });
  };
  const topLevel = root.getCommands();
  for (const command of topLevel) describe(command, []);
  const visitChildren = (
    command: EnumerableCommand,
    parents: readonly string[],
  ): void => {
    const lineage = [...parents, command.getName()];
    for (const child of command.getCommands()) {
      describe(child, lineage);
      visitChildren(child, lineage);
    }
  };
  for (const command of topLevel) visitChildren(command, []);
  return descriptors;
}

/** Typed CLI plugin-doctor function accepted by the MCP adapter. */
export type PluginDoctorOperation = (
  input: { readonly projectRoot: string },
) => Promise<readonly PluginDoctorReport[]>;

/** Maps the CLI's typed plugin reports into MCP doctor checks. */
export class CliProjectDoctor implements ProjectDoctorPort {
  constructor(private readonly doctor: PluginDoctorOperation) {}

  async diagnose(projectRoot: string): Promise<readonly DoctorCheck[]> {
    const reports = await this.doctor({ projectRoot });
    if (reports.length === 0) {
      return [{
        name: "plugin_configuration",
        status: "pass",
        summary: "No plugins configured.",
      }];
    }
    return reports.flatMap((report) =>
      report.checks.map((check) => ({
        name: `${report.pluginName}:${check.id}`,
        status: check.status === "healthy"
          ? "pass" as const
          : check.status === "warning"
          ? "warn" as const
          : "fail" as const,
        summary: check.message ?? check.title,
        ...(check.status === "healthy" ? {} : {
          fix: `Resolve ${check.title.toLowerCase()} for ${report.pluginName}.`,
        }),
      }))
    );
  }
}
