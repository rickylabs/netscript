/** One named command-path prefix rule. */
export interface CommandPolicyRule {
  /** Stable rule name rendered in decisions. */ readonly name: string;
  /** Command tokens matched from the beginning of a path. */ readonly prefix: readonly string[];
}

/** Immutable allowlist policy; deny rules take precedence and unmatched paths are denied. */
export interface CommandPolicy {
  /** Explicitly permitted command prefixes. */ readonly allow: readonly CommandPolicyRule[];
  /** Explicitly forbidden command prefixes. */ readonly deny: readonly CommandPolicyRule[];
}

/** Auditable result of evaluating one command path. */
export interface CommandPolicyDecision {
  /** Whether execution may proceed. */ readonly allowed: boolean;
  /** Stable matching rule or `default_deny`. */ readonly rule: string;
}

const rule = (name: string, ...prefix: string[]): CommandPolicyRule =>
  Object.freeze({ name, prefix: Object.freeze(prefix) });

/** Conservative default policy for NetScript CLI execution through MCP. */
export const DEFAULT_COMMAND_POLICY: CommandPolicy = Object.freeze({
  allow: Object.freeze([
    rule('allow_db_init', 'db', 'init'),
    rule('allow_db_generate', 'db', 'generate'),
    rule('allow_db_migrate', 'db', 'migrate'),
    rule('allow_db_seed', 'db', 'seed'),
    rule('allow_db_status', 'db', 'status'),
    rule('allow_db_introspect', 'db', 'introspect'),
    rule('allow_generate', 'generate'),
    rule('allow_contract', 'contract'),
    rule('allow_service_list', 'service', 'list'),
    rule('allow_service_status', 'service', 'status'),
    rule('allow_plugin_add', 'plugin', 'add'),
    rule('allow_plugin_list', 'plugin', 'list'),
    rule('allow_plugin_sync', 'plugin', 'sync'),
    rule('allow_plugin_doctor', 'plugin', 'doctor'),
    rule('allow_ui', 'ui'),
    rule('allow_ui_add', 'ui:add'),
    rule('allow_ui_init', 'ui:init'),
  ]),
  deny: Object.freeze([
    rule('deny_deploy', 'deploy'),
    rule('deny_init', 'init'),
    rule('deny_marketplace', 'marketplace'),
    rule('deny_db_reset', 'db', 'reset'),
    rule('deny_plugin_remove', 'plugin', 'remove'),
  ]),
});

function matches(path: readonly string[], prefix: readonly string[]): boolean {
  return prefix.length <= path.length && prefix.every((token, index) => path[index] === token);
}

/** Decide whether a normalized command path is allowed by policy. */
export function decideCommand(
  policy: CommandPolicy,
  path: readonly string[],
): CommandPolicyDecision {
  const deny = policy.deny.find((candidate) => matches(path, candidate.prefix));
  if (deny) return { allowed: false, rule: deny.name };
  const allow = policy.allow.find((candidate) => matches(path, candidate.prefix));
  return allow ? { allowed: true, rule: allow.name } : { allowed: false, rule: 'default_deny' };
}
