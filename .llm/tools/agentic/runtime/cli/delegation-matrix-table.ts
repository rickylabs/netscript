import {
  COORDINATOR_MATRIX,
  COORDINATOR_TIERS,
  type CoordinatorTier,
  DELEGATION_MATRIX,
  DELEGATION_ROLES,
  type DelegationRole,
  type EvaluationPolicy,
  LOGICAL_MODEL_IDS,
  LOGICAL_MODEL_LABELS,
  type LogicalModelId,
  MODEL_TRANSPORT_PRIORITY,
  type ModelRoute,
  type ModelTransport,
  WORKLOAD_TIER_DESCRIPTIONS,
  WORKLOAD_TIERS,
  type WorkloadTier,
} from '../delegation-matrix.ts';
import { normalizeTaskArguments } from '../../lib/task-arguments.ts';

export interface MatrixOptions {
  tier?: WorkloadTier;
  role?: DelegationRole;
  fallback?: LogicalModelId;
  json: boolean;
  help: boolean;
}

export interface FallbackMatch {
  scope: 'workload' | 'coordinator';
  tier: WorkloadTier | CoordinatorTier;
  role: DelegationRole | 'coordinator';
  primary: ModelRoute;
  fallbacks: readonly ModelRoute[];
}

interface TransportPresentation {
  priority: string;
  subscription: string;
  modelRouting: string;
  cli: string;
  rule: string;
}

const ROLE_LABELS: Readonly<Record<DelegationRole, string>> = {
  implementation: 'Implementation',
  ui_ux: 'UI/UX implementation',
  plan: 'Plan',
  plan_evaluation: 'PLAN-EVAL',
  implementation_evaluation: 'IMPL-EVAL',
  vision_evaluation: 'Vision evaluation',
  documentation: 'Documentation',
  deep_research: 'Deep research',
} as const;

const ROLE_ALIASES: Readonly<Record<string, DelegationRole>> = {
  implementation: 'implementation',
  implementer: 'implementation',
  impl: 'implementation',
  ui: 'ui_ux',
  ux: 'ui_ux',
  ui_ux: 'ui_ux',
  plan: 'plan',
  plan_eval: 'plan_evaluation',
  plan_evaluation: 'plan_evaluation',
  impl_eval: 'implementation_evaluation',
  implementation_eval: 'implementation_evaluation',
  implementation_evaluation: 'implementation_evaluation',
  vision: 'vision_evaluation',
  vision_eval: 'vision_evaluation',
  vision_evaluation: 'vision_evaluation',
  docs: 'documentation',
  documentation: 'documentation',
  deep_research: 'deep_research',
  research: 'deep_research',
} as const;

const TIER_ALIASES: Readonly<Record<string, WorkloadTier>> = {
  simple: 'simple',
  straightforward: 'straightforward',
  standard: 'straightforward',
  feature: 'feature',
  workhorse: 'feature',
  complex: 'complex',
  architecture: 'architecture',
} as const;

const TRANSPORT_PRESENTATION: Readonly<Record<ModelTransport, TransportPresentation>> = {
  claude: {
    priority: '1',
    subscription: 'Claude subscription',
    modelRouting: 'Claude models',
    cli: 'Claude Code CLI',
    rule: 'Native default for supported Claude models.',
  },
  codex: {
    priority: '1',
    subscription: 'Codex subscription',
    modelRouting: 'OpenAI / Codex models',
    cli: 'Codex CLI',
    rule: 'Native default for supported OpenAI models.',
  },
  agy: {
    priority: '1',
    subscription: 'Google subscription',
    modelRouting: 'Google / Gemini models',
    cli: 'Agy CLI',
    rule: 'Native default for supported Google models.',
  },
  github_copilot: {
    priority: '2',
    subscription: 'GitHub Copilot Pro+',
    modelRouting: 'Catalog-attested Copilot models',
    cli: 'OpenCode CLI',
    rule: 'After family-native subscriptions; before Go, Ollama, and OpenRouter.',
  },
  opencode_go: {
    priority: '3',
    subscription: 'OpenCode Go subscription',
    modelRouting: 'Models included in OpenCode Go',
    cli: 'OpenCode CLI',
    rule: 'Subscription-backed fallback before metered routes.',
  },
  ollama: {
    priority: '4',
    subscription: 'Ollama subscription',
    modelRouting: 'Models available through Ollama',
    cli: 'OpenCode CLI',
    rule: 'Fallback when native, Copilot, and Go routes are unavailable or exhausted.',
  },
  openrouter: {
    priority: '5',
    subscription: 'OpenRouter',
    modelRouting: 'Required models unavailable above',
    cli: 'OpenCode CLI',
    rule: 'Final fallback only.',
  },
} as const;

const MAIN_HEADERS = [
  'Tier / complexity',
  'Implementer (default)',
  'Implementer (fallback)',
  'UI/UX (default)',
  'UI/UX (fallback)',
  'Plan (default)',
  'Plan (fallback)',
  'Plan eval (default)',
  'Plan eval (fallback)',
  'Impl eval (default)',
  'Impl eval (fallback)',
  'Vision eval (default)',
  'Vision eval (fallback)',
  'Doc writing (default)',
  'Doc writing (fallback)',
  'Deep research (default)',
  'Deep research (fallback)',
] as const;

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function parseTier(raw: string): WorkloadTier {
  const tier = TIER_ALIASES[normalize(raw)];
  if (!tier) {
    throw new Error(`Unknown tier ${raw}; expected ${WORKLOAD_TIERS.join(', ')}`);
  }
  return tier;
}

function parseRole(raw: string): DelegationRole {
  const role = ROLE_ALIASES[normalize(raw)];
  if (!role) {
    throw new Error(`Unknown role ${raw}; expected ${DELEGATION_ROLES.join(', ')}`);
  }
  return role;
}

function parseModel(raw: string): LogicalModelId {
  const needle = normalize(raw);
  const model = LOGICAL_MODEL_IDS.find((id) =>
    normalize(id) === needle || normalize(LOGICAL_MODEL_LABELS[id]) === needle
  );
  if (!model) {
    throw new Error(`Unknown logical model ${raw}; expected ${LOGICAL_MODEL_IDS.join(', ')}`);
  }
  return model;
}

export function parseMatrixArgs(args: readonly string[]): MatrixOptions {
  const normalizedArgs = normalizeTaskArguments(args);
  const options: MatrixOptions = { json: false, help: false };
  for (let index = 0; index < normalizedArgs.length; index++) {
    const arg = normalizedArgs[index];
    switch (arg) {
      case '--tier':
        options.tier = parseTier(requireValue(normalizedArgs, ++index, arg));
        break;
      case '--role':
        options.role = parseRole(requireValue(normalizedArgs, ++index, arg));
        break;
      case '--plan-evaluator':
        options.role = 'plan_evaluation';
        break;
      case '--impl-evaluator':
        options.role = 'implementation_evaluation';
        break;
      case '--fallback':
      case '--fallback-of':
        options.fallback = parseModel(requireValue(normalizedArgs, ++index, arg));
        break;
      case '--json':
        options.json = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

function requireValue(args: readonly string[], index: number, flag: string): string {
  const value = args[index];
  if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value`);
  return value;
}

function displayRoute(route: ModelRoute | undefined): string {
  if (!route) return '—';
  const effort = route.effort === 'provider_default' ? 'provider default' : route.effort;
  return `${LOGICAL_MODEL_LABELS[route.model]} ${effort}`;
}

function fallbackRoutes(routes: readonly ModelRoute[]): string {
  return routes.length > 1 ? routes.slice(1).map(displayRoute).join(' → ') : '—';
}

function workloadRow(tier: WorkloadTier): string[] {
  const cell = DELEGATION_MATRIX[tier];
  return [
    `${tier}<br>${WORKLOAD_TIER_DESCRIPTIONS[tier]}`,
    displayRoute(cell.implementation[0]),
    fallbackRoutes(cell.implementation),
    displayRoute(cell.ui_ux[0]),
    fallbackRoutes(cell.ui_ux),
    displayRoute(cell.plan[0]),
    fallbackRoutes(cell.plan),
    displayRoute(cell.plan_evaluation[0]),
    fallbackRoutes(cell.plan_evaluation),
    displayRoute(cell.implementation_evaluation[0]),
    fallbackRoutes(cell.implementation_evaluation),
    displayRoute(cell.vision_evaluation[0]),
    fallbackRoutes(cell.vision_evaluation),
    displayRoute(cell.documentation[0]),
    fallbackRoutes(cell.documentation),
    displayRoute(cell.deep_research[0]),
    fallbackRoutes(cell.deep_research),
  ];
}

function policyForRole(tier: WorkloadTier, role: DelegationRole): EvaluationPolicy | undefined {
  const cell = DELEGATION_MATRIX[tier];
  if (role === 'plan_evaluation') return cell.planPolicy;
  if (role === 'implementation_evaluation' || role === 'vision_evaluation') {
    return cell.implementationPolicy;
  }
  if (role === 'documentation') return cell.documentationPolicy;
  return undefined;
}

function displayPolicy(policy: EvaluationPolicy | undefined): string {
  if (!policy) return '—';
  const parts: string[] = [];
  if (policy.maxRounds === 'none' || policy.maxRounds === 0) parts.push('no roundtrip');
  else if (policy.maxRounds === 'unspecified_by_owner') parts.push('maximum unspecified by owner');
  else parts.push(`max ${policy.maxRounds} roundtrips`);
  if (policy.repairInFlightAt === 'immediate') parts.push('repair fixable failure in flight');
  else if (policy.repairInFlightAt !== undefined) {
    parts.push(`repair fixable failure in flight at round ${policy.repairInFlightAt}`);
  }
  if (policy.notifyOwnerAfter !== undefined) {
    parts.push(`notify owner after ${policy.notifyOwnerAfter}`);
  }
  if (policy.escalateToOwnerAt !== undefined) {
    parts.push(`escalate to owner at ${policy.escalateToOwnerAt}`);
  }
  if (policy.reSteerSameSession) parts.push('re-steer same evaluator session');
  return parts.join('; ');
}

function policyRows(tiers: readonly WorkloadTier[]): string[][] {
  return tiers.map((tier) => [
    tier,
    displayPolicy(DELEGATION_MATRIX[tier].planPolicy),
    displayPolicy(DELEGATION_MATRIX[tier].implementationPolicy),
    displayPolicy(DELEGATION_MATRIX[tier].documentationPolicy),
  ]);
}

function markdownTable(headers: readonly string[], rows: readonly (readonly string[])[]): string {
  const escapedRows = rows.map((row) => row.map(escapeCell));
  const escapedHeaders = headers.map(escapeCell);
  const widths = escapedHeaders.map((header, column) =>
    Math.max(header.length, ...escapedRows.map((row) => row[column]?.length ?? 0), 3)
  );
  const line = (cells: readonly string[]) =>
    `| ${cells.map((cell, index) => cell.padEnd(widths[index])).join(' | ')} |`;
  return [
    line(escapedHeaders),
    line(widths.map((width) => '-'.repeat(width))),
    ...escapedRows.map(line),
  ].join('\n');
}

function escapeCell(value: string): string {
  return value.replaceAll('|', '\\|').replaceAll('\n', '<br>');
}

function renderPolicies(tiers: readonly WorkloadTier[]): string {
  return [
    '## Evaluation policies',
    '',
    markdownTable(
      ['Tier', 'PLAN-EVAL loop', 'IMPL-EVAL loop', 'Documentation loop'],
      policyRows(tiers),
    ),
  ].join('\n');
}

function renderCoordinatorMatrix(): string {
  return [
    '## Coordinator / orchestrator matrix',
    '',
    markdownTable(
      ['Scope', 'Default', 'Fallback chain'],
      COORDINATOR_TIERS.map((tier) => [
        tier,
        displayRoute(COORDINATOR_MATRIX[tier][0]),
        fallbackRoutes(COORDINATOR_MATRIX[tier]),
      ]),
    ),
  ].join('\n');
}

function renderTransportMatrix(): string {
  return [
    '## CLI / provider precedence',
    '',
    markdownTable(
      ['Priority', 'Subscription / provider', 'Model routing', 'CLI', 'Use / fallback rule'],
      MODEL_TRANSPORT_PRIORITY.map((transport) => {
        const entry = TRANSPORT_PRESENTATION[transport];
        return [entry.priority, entry.subscription, entry.modelRouting, entry.cli, entry.rule];
      }),
    ),
  ].join('\n');
}

export function renderFullMatrix(tiers: readonly WorkloadTier[] = WORKLOAD_TIERS): string {
  return [
    '# Harness Agents — Model Matrix',
    '',
    'Routes are read directly from the typed delegation matrix. `—` means not applicable.',
    '',
    markdownTable(MAIN_HEADERS, tiers.map(workloadRow)),
    '',
    renderPolicies(tiers),
    '',
    renderCoordinatorMatrix(),
    '',
    renderTransportMatrix(),
    '',
    '## Hard routing rules',
    '',
    '- Generator and evaluator must use different vendor families and separate sessions.',
    '- `ui_ux` is owner-selected pure UI/UX specialization; incidental UI work stays on `implementation`.',
    '- `complex` and `architecture` require explicit owner or milestone-coordinator authority.',
    '- Owner matrix overrides require an exact `.llm/runs/**/worklog.md` entry and never waive evaluator independence.',
    '- Deep research uses Gemini 3.8 Flash by tier, with Luna max as its only model fallback; Claude, OpenCode Go, Ollama, and OpenRouter are forbidden for that role.',
  ].join('\n');
}

function renderTierQuery(tier: WorkloadTier): string {
  return [
    `# ${tier} workload route`,
    '',
    markdownTable(MAIN_HEADERS, [workloadRow(tier)]),
  ].join('\n');
}

function renderRoleQuery(tiers: readonly WorkloadTier[], role: DelegationRole): string {
  return [
    `# ${ROLE_LABELS[role]} routes`,
    '',
    markdownTable(
      ['Tier', 'Default', 'Fallback chain', 'Loop policy'],
      tiers.map((tier) => {
        const routes = DELEGATION_MATRIX[tier][role];
        return [
          tier,
          displayRoute(routes[0]),
          fallbackRoutes(routes),
          displayPolicy(policyForRole(tier, role)),
        ];
      }),
    ),
  ].join('\n');
}

export function fallbackMatches(
  model: LogicalModelId,
  filters: Pick<MatrixOptions, 'tier' | 'role'> = {},
): FallbackMatch[] {
  const matches: FallbackMatch[] = [];
  const tiers = filters.tier ? [filters.tier] : WORKLOAD_TIERS;
  const roles = filters.role ? [filters.role] : DELEGATION_ROLES;
  for (const tier of tiers) {
    for (const role of roles) {
      const routes = DELEGATION_MATRIX[tier][role];
      if (routes[0]?.model === model && routes.length > 1) {
        matches.push({
          scope: 'workload',
          tier,
          role,
          primary: routes[0],
          fallbacks: routes.slice(1),
        });
      }
    }
  }
  if (!filters.tier && !filters.role) {
    for (const tier of COORDINATOR_TIERS) {
      const routes = COORDINATOR_MATRIX[tier];
      if (routes[0]?.model === model && routes.length > 1) {
        matches.push({
          scope: 'coordinator',
          tier,
          role: 'coordinator',
          primary: routes[0],
          fallbacks: routes.slice(1),
        });
      }
    }
  }
  return matches;
}

function renderFallbackQuery(model: LogicalModelId, options: MatrixOptions): string {
  const matches = fallbackMatches(model, options);
  const heading = `# Declared fallbacks for ${LOGICAL_MODEL_LABELS[model]}`;
  if (!matches.length) {
    return `${heading}\n\nNo selected context declares this model as its primary with a fallback.`;
  }
  return [
    heading,
    '',
    'Fallbacks are context-sensitive; every matching primary context is listed.',
    '',
    markdownTable(
      ['Scope', 'Tier', 'Role', 'Primary', 'Fallback chain'],
      matches.map((match) => [
        match.scope,
        match.tier,
        match.role === 'coordinator' ? 'Coordinator' : ROLE_LABELS[match.role],
        displayRoute(match.primary),
        match.fallbacks.map(displayRoute).join(' → '),
      ]),
    ),
  ].join('\n');
}

function jsonOutput(options: MatrixOptions): unknown {
  if (options.fallback) {
    return {
      schemaVersion: 1,
      mode: 'fallback',
      model: options.fallback,
      matches: fallbackMatches(options.fallback, options),
    };
  }
  const tiers = options.tier ? [options.tier] : WORKLOAD_TIERS;
  if (options.role) {
    return {
      schemaVersion: 1,
      mode: 'role',
      role: options.role,
      tiers: tiers.map((tier) => ({
        tier,
        description: WORKLOAD_TIER_DESCRIPTIONS[tier],
        routes: DELEGATION_MATRIX[tier][options.role!],
        policy: policyForRole(tier, options.role!),
      })),
    };
  }
  return {
    schemaVersion: 1,
    mode: options.tier ? 'tier' : 'full',
    tiers: tiers.map((tier) => ({
      tier,
      description: WORKLOAD_TIER_DESCRIPTIONS[tier],
      ...DELEGATION_MATRIX[tier],
    })),
    ...(!options.tier
      ? {
        coordinators: COORDINATOR_MATRIX,
        transportPriority: MODEL_TRANSPORT_PRIORITY,
      }
      : {}),
  };
}

export function renderMatrixQuery(options: MatrixOptions): string {
  if (options.help) return helpText();
  if (options.json) return JSON.stringify(jsonOutput(options), null, 2);
  if (options.fallback) return renderFallbackQuery(options.fallback, options);
  const tiers = options.tier ? [options.tier] : WORKLOAD_TIERS;
  if (options.role) return renderRoleQuery(tiers, options.role);
  if (options.tier) return renderTierQuery(options.tier);
  return renderFullMatrix();
}

function helpText(): string {
  return [
    'Usage: deno task agentic:matrix -- [options]',
    '',
    '  (no flags)                 Render the full workload, policy, coordinator, and CLI matrices',
    '  --tier <tier>              Render one workload row (standard aliases straightforward)',
    '  --role <role>                 Render one role across all tiers or the selected tier',
    '  --plan-evaluator              Shortcut for --role plan-eval',
    '  --impl-evaluator              Shortcut for --role impl-eval',
    '  --fallback-of <logical-model> List every declared fallback where the model is primary',
    '  --fallback <logical-model>    Alias for --fallback-of',
    '  --json                        Emit the selected view as structured JSON',
    '  --help                        Show this help',
    '',
    'Role aliases: impl, ui-ux, plan, plan-eval, impl-eval, vision-eval, docs, deep-research.',
  ].join('\n');
}

if (import.meta.main) {
  try {
    console.log(renderMatrixQuery(parseMatrixArgs(Deno.args)));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exit(2);
  }
}
