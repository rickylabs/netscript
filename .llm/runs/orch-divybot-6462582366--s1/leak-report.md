# Resource report

Read-only leak reporter completed. Aspire/process probes ran; Docker containers, volumes and networks could not be inspected because the daemon is unavailable. No teardown mutation was attempted. Foreign and unknown-owner resources remain untouched. Raw process/resource identifiers are retained privately. Browser harness servers are managed and stopped by Playwright. Full runtime exited at preflight before creating an AppHost; runtime cleanup was also unable to inspect Docker. This report does not prove that the host has no foreign resources.

The reporter observed24 processes with unproven ownership. All were left untouched; the inability to inspect Docker remains explicit.
