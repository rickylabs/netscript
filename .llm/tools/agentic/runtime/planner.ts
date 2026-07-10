// deno-fmt-ignore-file
import { type AdapterKind, type DeferredIssue, hasLegalRuntimeCommandMode, INSTALLABLE_FOUNDATION_COMPONENTS, type ReconcilePlan, type RouteIdentity, RUNTIME_SCHEMA_VERSION, type RuntimeAction, type RuntimeActionKind, type RuntimeCommand, type RuntimeDiagnostic, type SessionIdentity, STATE_DIRECTORY_IDS } from './contract.ts';
import { type DesiredRuntimeState, desiredStatesEqual, type ObservedRuntimeState } from './state.ts';
export interface ReconciliationInput { readonly command: RuntimeCommand; readonly desired: DesiredRuntimeState | null; readonly observed: ObservedRuntimeState; }
type PlanBuilder = { readonly actions: RuntimeAction[]; readonly diagnostics: RuntimeDiagnostic[] };
function diagnostic(code: RuntimeDiagnostic['code'], category: RuntimeDiagnostic['category'], message: string, ownerIssue?: DeferredIssue): RuntimeDiagnostic {
  return { code, category, retryable: false, message, ownerIssue };
}
function addAction(builder: PlanBuilder, command: RuntimeCommand, kind: RuntimeActionKind, adapter: AdapterKind, values: Omit<RuntimeAction, 'id' | 'kind' | 'adapter'>): void {
  builder.actions.push({
    id: `${command.commandId}:${String(builder.actions.length + 1).padStart(2, '0')}:${kind}`,
    kind,
    adapter,
    ...values,
  });
}
function addBlockedIntent(builder: PlanBuilder, command: RuntimeCommand, failure: RuntimeDiagnostic, resourceIds: readonly string[]): void {
  builder.diagnostics.push(failure);
  addAction(builder, command, 'blocked_intent', 'state', {
    effect: 'none',
    reversible: false,
    resourceIds,
    diagnostic: failure,
  });
}
function observedWorktreeSafe(observed: ObservedRuntimeState, worktree: string): boolean {
  const state = observed.worktrees.find((entry) => entry.path === worktree);
  return Boolean(
    state?.found && state.nativeExt4 && !state.dirty &&
      (state.upstream === null || state.upstream === 'NONE'),
  );
}
function routeDeferred(_route: RouteIdentity): DeferredIssue | null { return null; }
function routeMatchesSession(route: RouteIdentity, session: SessionIdentity): boolean { return route.agent === session.agent && route.worktree === session.worktree && route.sessionId === session.sessionId; }
function planRouteAction(builder: PlanBuilder, command: RuntimeCommand, kind: 'launch_session' | 'resume_session' | 'smoke_session' | 'switch_route' | 'restore_route', route: RouteIdentity, observed: ObservedRuntimeState, sessionId?: string): void {
  const deferred = routeDeferred(route);
  if (deferred) {
    addBlockedIntent(
      builder,
      command,
      diagnostic(
        'capability_deferred',
        'capability',
        `route capability is deferred to issue #${deferred}`,
        deferred,
      ),
      [`route:${route.agent}:${route.provider}`],
    );
    return;
  }
  if (!observedWorktreeSafe(observed, route.worktree)) {
    addBlockedIntent(
      builder,
      command,
      diagnostic('unsafe_worktree', 'safety', 'worktree is missing, non-native, dirty, or unsafe'),
      [`worktree:${route.worktree}`],
    );
    return;
  }
  addAction(builder, command, kind, route.agent, {
    effect: 'session',
    reversible: true,
    resourceIds: [`session:${route.agent}:${sessionId ?? 'new'}`],
    route,
    sessionId,
  });
}
function planLifecycleAction(builder: PlanBuilder, command: RuntimeCommand, kind: 'launch_session' | 'resume_session' | 'smoke_session', route: RouteIdentity, observed: ObservedRuntimeState, sessionId?: string): void {
  if (command.mode !== 'apply') {
    planRouteAction(builder, command, kind, route, observed, sessionId);
    return;
  }
  addBlockedIntent(
    builder,
    command,
    diagnostic(
      'capability_unsupported',
      'capability',
      'controller lifecycle apply is plan-only; use the ownership-enforced agent launcher and same-thread resume tools',
    ),
    [`session:${route.agent}:${sessionId ?? 'new'}`],
  );
}
export function planReconciliation(input: ReconciliationInput): ReconcilePlan {
  const { command, desired, observed } = input;
  const builder: PlanBuilder = { actions: [], diagnostics: [] };
  const runtimeShape: Readonly<{ kind: unknown; mode: unknown }> = command;
  if (!hasLegalRuntimeCommandMode(runtimeShape)) {
    addBlockedIntent(
      builder,
      command,
      diagnostic('invalid_command', 'input', 'command mode is not legal for this command'),
      [`command:${String(runtimeShape.kind)}`],
    );
    return finish(command, builder);
  }
  if (observed.schemaVersion !== RUNTIME_SCHEMA_VERSION) {
    addBlockedIntent(
      builder,
      command,
      diagnostic('schema_unsupported', 'state', 'observed runtime schema is unsupported'),
      [`state:${observed.stateId}`],
    );
    return finish(command, builder);
  }

  switch (command.kind) {
    case 'doctor':
    case 'status':
      break;
    case 'bootstrap':
      planBootstrap(builder, command, desired, observed);
      break;
    case 'configure':
      if (!desired) {
        addBlockedIntent(
          builder,
          command,
          diagnostic('invalid_state_file', 'input', 'configure requires desired runtime state'),
          [`desired-state-source:${command.desiredState.path}`],
        );
      } else if (!desiredStatesEqual(desired, observed.configuredDesiredState)) {
        addAction(builder, command, 'persist_desired_state', 'state', {
          effect: 'write',
          reversible: true,
          resourceIds: [`state:${desired.stateId}`],
          stateId: desired.stateId,
        });
      }
      break;
    case 'launch':
      planLifecycleAction(builder, command, 'launch_session', command.route, observed);
      break;
    case 'resume':
      if (!routeMatchesSession(command.route, command.session)) {
        addBlockedIntent(
          builder,
          command,
          diagnostic(
            'route_conflict',
            'policy',
            'resume route and session identity do not match',
          ),
          [`session:${command.session.sessionId}`],
        );
      } else {
        planLifecycleAction(
          builder,
          command,
          'resume_session',
          command.route,
          observed,
          command.session.sessionId,
        );
      }
      break;
    case 'smoke':
      planLifecycleAction(builder, command, 'smoke_session', command.route, observed);
      break;
    case 'fallback':
      if (!routeMatchesSession(command.currentRoute, command.session)) {
        addBlockedIntent(
          builder,
          command,
          diagnostic(
            'route_conflict',
            'policy',
            'current route and session identity do not match',
          ),
          [`session:${command.session.sessionId}`],
        );
      } else if (command.session.boundary === 'active') {
        addBlockedIntent(
          builder,
          command,
          diagnostic(
            'turn_boundary_required',
            'policy',
            'fallback requires an idle or new turn boundary',
          ),
          [`session:${command.session.sessionId}`],
        );
      } else {
        planRouteAction(
          builder,
          command,
          'switch_route',
          command.targetRoute,
          observed,
          command.session.sessionId,
        );
      }
      break;
    case 'restore': {
      if (!routeMatchesSession(command.currentRoute, command.session)) {
        addBlockedIntent(
          builder,
          command,
          diagnostic(
            'route_conflict',
            'policy',
            'current route and session identity do not match',
          ),
          [`session:${command.session.sessionId}`],
        );
        break;
      }
      if (command.session.boundary === 'active') {
        addBlockedIntent(
          builder,
          command,
          diagnostic(
            'turn_boundary_required',
            'policy',
            'restore requires an idle or new turn boundary',
          ),
          [`session:${command.session.sessionId}`],
        );
        break;
      }
      const route = desired?.agents[command.session.agent]?.route;
      if (!route) {
        addBlockedIntent(
          builder,
          command,
          diagnostic('missing_identity', 'input', 'configured desired route is missing'),
          [`route:${command.session.agent}`],
        );
      } else {
        planRouteAction(
          builder,
          command,
          'restore_route',
          route,
          observed,
          command.session.sessionId,
        );
      }
      break;
    }
    case 'repair-codex-remote':
      addAction(builder, command, 'repair_codex_remote', 'mobile-control', {
        effect: command.mode === 'apply' ? 'process' : 'none',
        reversible: false,
        resourceIds: [`worktree:${command.worktree}`],
      });
      break;
    case 'rollback': {
      const checkpoint = observed.checkpoints.find((entry) =>
        entry.checkpointId === command.checkpointId
      );
      if (!checkpoint) {
        addBlockedIntent(
          builder,
          command,
          diagnostic('invalid_checkpoint', 'input', 'checkpoint is not present in observed state'),
          [`checkpoint:${command.checkpointId}`],
        );
      } else if (checkpoint.status !== 'rolled_back') {
        addAction(builder, command, 'rollback_checkpoint', 'state', {
          effect: 'write',
          reversible: true,
          resourceIds: [`checkpoint:${command.checkpointId}`],
          checkpointId: command.checkpointId,
        });
      }
      break;
    }
  }
  return finish(command, builder);
}

function planBootstrap(builder: PlanBuilder, command: RuntimeCommand & { readonly kind: 'bootstrap' }, desired: DesiredRuntimeState | null, observed: ObservedRuntimeState): void {
  if (!desired) {
    addBlockedIntent(
      builder,
      command,
      diagnostic('invalid_state_file', 'input', 'bootstrap requires desired runtime state'),
      ['state:desired'],
    );
    return;
  }
  if (desired.foundation.nativeExt4 && !observed.nativeExt4) {
    addBlockedIntent(
      builder,
      command,
      diagnostic('non_native_worktree', 'policy', 'bootstrap requires native ext4 execution'),
      [`state:${observed.stateId}`],
    );
    return;
  }
  for (const component of INSTALLABLE_FOUNDATION_COMPONENTS) {
    const targetVersion = command.desiredVersions?.[component] ??
      desired.foundation.versions[component];
    if (!targetVersion) continue;
    const actual = observed.components.find((entry) => entry.component === component);
    if (actual?.status === 'ready' && actual.version === targetVersion) continue;
    addAction(builder, command, 'install_component', 'foundation', {
      effect: 'write',
      reversible: true,
      resourceIds: [`component:${component}`],
      component,
      targetVersion,
    });
  }
  for (const stateDirectory of STATE_DIRECTORY_IDS) {
    if (!desired.foundation.stateDirectories.includes(stateDirectory)) continue;
    if (observed.stateDirectories.includes(stateDirectory)) continue;
    addAction(builder, command, 'create_state_directory', 'foundation', {
      effect: 'write',
      reversible: true,
      resourceIds: [`state-directory:${stateDirectory}`],
      stateDirectory,
    });
  }
}

function finish(command: RuntimeCommand, builder: PlanBuilder): ReconcilePlan {
  const blocked = builder.actions.some((action) => action.kind === 'blocked_intent');
  return {
    schemaVersion: RUNTIME_SCHEMA_VERSION,
    commandId: command.commandId,
    command: command.kind,
    status: blocked ? 'blocked' : builder.actions.length > 0 ? 'planned' : 'no_change',
    changed: false,
    actions: builder.actions,
    diagnostics: builder.diagnostics,
  };
}
