/**
 * `defineBenchRun` — a fluent builder for a bench run definition, mirroring the
 * ergonomics of `@netscript/cli-e2e`'s `defineCliE2eSuite`. The definition is
 * data-only (tasks, lanes, presets, caps, anchors, model, repeats); executing
 * it is the runner's job.
 *
 * @module
 */

import type { BenchTask } from '../../domain/task.ts';
import type { AnchorTable, WeightPreset } from '../../domain/scoring.ts';
import type { RunCaps } from '../runner/bench-runner.ts';

/** A fully-resolved bench run definition. */
export interface BenchRunDefinition {
  /** Pinned model id under test. */
  readonly model: string;
  /** Tasks to run. */
  readonly tasks: readonly BenchTask[];
  /** Active weight preset. */
  readonly preset: WeightPreset;
  /** Normalization anchor table. */
  readonly anchors: AnchorTable;
  /** Per-attempt caps. */
  readonly caps: RunCaps;
  /** Repeats per task (Slice 1 = 1; N-repeats deferred to a later slice). */
  readonly repeats: number;
}

/** Fluent builder for {@link BenchRunDefinition}. */
export class BenchRunBuilder {
  #model = 'claude-opus-4-8';
  #tasks: BenchTask[] = [];
  #preset: WeightPreset | undefined;
  #anchors: AnchorTable | undefined;
  #caps: RunCaps = { maxTurns: 80, maxWallSeconds: 900, suiteTimeoutMs: 60_000 };
  #repeats = 1;

  /** Pin the model under test. */
  withModel(model: string): this {
    this.#model = model;
    return this;
  }

  /** Add a task to the run. */
  withTask(task: BenchTask): this {
    this.#tasks.push(task);
    return this;
  }

  /** Add several tasks at once. */
  withTasks(tasks: readonly BenchTask[]): this {
    this.#tasks.push(...tasks);
    return this;
  }

  /** Select the active weight preset. */
  withPreset(preset: WeightPreset): this {
    this.#preset = preset;
    return this;
  }

  /** Set the normalization anchor table. */
  withAnchors(anchors: AnchorTable): this {
    this.#anchors = anchors;
    return this;
  }

  /** Override the per-attempt caps. */
  withCaps(caps: RunCaps): this {
    this.#caps = caps;
    return this;
  }

  /** Set repeats per task. */
  withRepeats(repeats: number): this {
    this.#repeats = repeats;
    return this;
  }

  /** Resolve the definition, validating required fields. */
  build(): BenchRunDefinition {
    if (this.#tasks.length === 0) {
      throw new Error('defineBenchRun: at least one task is required');
    }
    if (this.#preset === undefined) {
      throw new Error('defineBenchRun: a weight preset is required');
    }
    if (this.#anchors === undefined) {
      throw new Error('defineBenchRun: a normalization anchor table is required');
    }
    return {
      model: this.#model,
      tasks: [...this.#tasks],
      preset: this.#preset,
      anchors: this.#anchors,
      caps: this.#caps,
      repeats: this.#repeats,
    };
  }
}

/** Start a new bench run definition. */
export function defineBenchRun(): BenchRunBuilder {
  return new BenchRunBuilder();
}
