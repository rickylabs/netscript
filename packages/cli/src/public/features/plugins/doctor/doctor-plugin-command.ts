import type { CliffyCommand } from "../../../../kernel/presentation/command-types.ts";
/**
 * @module
 *
 * Public `netscript plugin doctor` command.
 *
 * F-9 permissions: host-side diagnostics read project configuration and
 * generated plugin metadata. The public CLI binary requires `--allow-read`.
 */

import { Command } from "@cliffy/command";

import { outputText } from "../../../../kernel/presentation/output/default-output.ts";
import { RemoteError } from "../../../../kernel/domain/errors/cli-exit-error.ts";
import {
  type ProjectRootResolver,
  requireProjectRoot,
} from "../../../presentation/support.ts";
import type {
  PluginDoctorInput,
  PluginDoctorReport,
} from "./doctor-plugin-use-case.ts";
import { FilesystemDiagnosticEvidence } from "@netscript/mcp";
import type { DiagnosticEvidencePort } from "@netscript/mcp";

/** Dependencies for the public plugin doctor command. */
export interface DoctorPluginCommandDependencies {
  /** Resolve the project root from flags or environment. */
  readonly resolveProjectRoot: ProjectRootResolver;
  /** Run host-side plugin diagnostics. */
  readonly doctor: (
    input: PluginDoctorInput,
  ) => Promise<readonly PluginDoctorReport[]>;
  /** Print completion lines. */
  readonly print?: (message: string) => void;
  /** Override project-local evidence persistence in contract tests. */
  readonly diagnosticEvidence?: (projectRoot: string) => DiagnosticEvidencePort;
}

/** Options accepted by the public plugin doctor command. */
export interface DoctorPluginCommandInput {
  /** Optional project root. */
  readonly projectRoot?: string;
  /** Resource whose diagnosis should authorize a drift entry. */
  readonly resource?: string;
}

/** Create the public `plugin doctor` command. */
export function createDoctorPluginCommand(
  dependencies: DoctorPluginCommandDependencies,
): CliffyCommand {
  const print = dependencies.print ?? outputText;
  return new Command()
    .name("doctor")
    .description("Check local-workdir and package-backed NetScript plugin health")
    .option("--project-root <path:string>", "Project root directory")
    .option(
      "--resource <name:string>",
      "Resource name for the diagnostic evidence receipt",
      { default: "project" },
    )
    .action(async (options: DoctorPluginCommandInput): Promise<void> => {
      const projectRoot = await requireProjectRoot(
        dependencies.resolveProjectRoot,
        options.projectRoot,
      );
      const reports = await dependencies.doctor({ projectRoot });
      renderDoctorReports(reports, print);
      const errored = reports.filter((report) => report.status === "error");
      const resource = options.resource ?? "project";
      try {
        await (dependencies.diagnosticEvidence?.(projectRoot) ??
          new FilesystemDiagnosticEvidence(projectRoot)).write({
            resource,
            command: "netscript plugin doctor",
            timestamp: new Date().toISOString(),
            exitStatus: errored.length > 0 ? 1 : 0,
          });
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        print(
          `Warning: diagnostic evidence was not recorded for resource "${resource}"; ` +
            `agent drift record will refuse until a successful diagnostic writes a receipt. ${reason}`,
        );
      }
      if (errored.length > 0) {
        const names = errored.map((report) => report.pluginName).join(", ");
        const summary =
          `Plugin doctor failed: ${names}. Follow the remediation commands above.`;
        print(summary);
        throw new RemoteError(1, summary, { context: { plugins: names } });
      }
    });
}

function renderDoctorReports(
  reports: readonly PluginDoctorReport[],
  print: (message: string) => void,
): void {
  if (reports.length === 0) {
    print("No plugins configured.");
    return;
  }

  print("Plugin\tStatus\tCheck\tMessage");
  for (const report of reports) {
    for (const check of report.checks) {
      print(
        `${report.pluginName}\t${check.status}\t${check.title}\t${
          check.message ?? "-"
        }`,
      );
    }
  }
}
