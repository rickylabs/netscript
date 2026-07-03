/**
 * Fake AgentDriver: replays a scripted list of turns deterministically. Used by
 * unit tests to exercise the runner's turn accounting without any live agent.
 *
 * The fake does not touch the sandbox; the paired fake TestRunner in tests
 * decides the suite outcome per turn, so together they simulate an agent making
 * progress toward green.
 *
 * @module
 */

import type { AgentRunRequest, AgentTurn, StopReason, TokenUsage } from '../../domain/agent.ts';
import type { AgentDriver } from '../../ports/agent-driver.ts';

/** A scripted turn spec (usage + optional stop reason/text). */
export interface ScriptedTurn {
  readonly usage: TokenUsage;
  readonly stopReason?: StopReason;
  readonly text?: string;
}

/** Deterministic driver that yields a fixed script of turns. */
export class FakeAgentDriver implements AgentDriver {
  readonly #script: readonly ScriptedTurn[];

  constructor(script: readonly ScriptedTurn[]) {
    this.#script = script;
  }

  async *run(_request: AgentRunRequest): AsyncIterable<AgentTurn> {
    let index = 0;
    for (const spec of this.#script) {
      const turn: AgentTurn = {
        index,
        usage: spec.usage,
        stopReason: spec.stopReason ?? 'tool_use',
        text: spec.text,
      };
      yield turn;
      index += 1;
    }
  }
}
