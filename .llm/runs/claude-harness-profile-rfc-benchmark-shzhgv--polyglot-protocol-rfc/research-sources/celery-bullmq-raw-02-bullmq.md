# BullMQ sandboxed processors — parent↔child IPC protocol — raw extract

Group: `celery-bullmq` (RFC-5 source aggregation). Faithful extract, no analysis.
All source files fetched from `taskforcesh/bullmq` @ `master`, 2026-08-20.

## Sources

| # | URL | Fetch date |
|---|-----|-----------|
| B1 | https://raw.githubusercontent.com/taskforcesh/bullmq/master/src/enums/parent-command.ts | 2026-08-20 |
| B2 | https://raw.githubusercontent.com/taskforcesh/bullmq/master/src/enums/child-command.ts | 2026-08-20 |
| B3 | https://raw.githubusercontent.com/taskforcesh/bullmq/master/src/interfaces/child-message.ts | 2026-08-20 |
| B4 | https://raw.githubusercontent.com/taskforcesh/bullmq/master/src/classes/child-processor.ts | 2026-08-20 |
| B5 | https://raw.githubusercontent.com/taskforcesh/bullmq/master/src/classes/main-base.ts | 2026-08-20 |
| B6 | https://raw.githubusercontent.com/taskforcesh/bullmq/master/src/classes/main.ts + main-worker.ts | 2026-08-20 |
| B7 | https://raw.githubusercontent.com/taskforcesh/bullmq/master/src/classes/sandbox.ts | 2026-08-20 |
| B8 | https://raw.githubusercontent.com/taskforcesh/bullmq/master/src/classes/child-pool.ts | 2026-08-20 |
| B9 | https://raw.githubusercontent.com/taskforcesh/bullmq/master/src/classes/child.ts | 2026-08-20 |
| B10 | https://raw.githubusercontent.com/taskforcesh/bullmq/master/src/utils/index.ts (`errorToJSON`, `asyncSend`, `childSend`) | 2026-08-20 |
| B11 | https://raw.githubusercontent.com/taskforcesh/bullmq/master/src/interfaces/sandboxed-options.ts | 2026-08-20 |
| B12 | https://raw.githubusercontent.com/taskforcesh/bullmq/master/src/interfaces/sandboxed-job.ts | 2026-08-20 |
| B13 | https://raw.githubusercontent.com/taskforcesh/bullmq/master/src/interfaces/job-json.ts + src/types/job-json-sandbox.ts | 2026-08-20 |
| B14 | https://raw.githubusercontent.com/taskforcesh/bullmq/master/docs/gitbook/guide/workers/sandboxed-processors.md (= https://docs.bullmq.io/guide/workers/sandboxed-processors) | 2026-08-20 |

---

## 1. Message type codes (the wire vocabulary)

### B1 — `src/enums/parent-command.ts` — child → parent (verbatim)

```typescript
export enum ParentCommand {
  Completed,
  Error,
  Failed,
  InitFailed,
  InitCompleted,
  Log,
  MoveToDelayed,
  MoveToWait,
  Progress,
  Update,
  GetChildrenValues,
  GetIgnoredChildrenFailures,
  GetDependenciesCount,
  MoveToWaitingChildren,
  GetDependencies,
}
```

Numeric ordinals (TypeScript default numeric enum, declaration order): `Completed=0, Error=1, Failed=2, InitFailed=3, InitCompleted=4, Log=5, MoveToDelayed=6, MoveToWait=7, Progress=8, Update=9, GetChildrenValues=10, GetIgnoredChildrenFailures=11, GetDependenciesCount=12, MoveToWaitingChildren=13, GetDependencies=14`. The wire carries the **integer**, not the name.

### B2 — `src/enums/child-command.ts` — parent → child (verbatim)

```typescript
export enum ChildCommand {
  Init,
  Start,
  Stop,
  GetChildrenValuesResponse,
  GetIgnoredChildrenFailuresResponse,
  GetDependenciesCountResponse,
  MoveToWaitingChildrenResponse,
  Cancel,
  GetDependenciesResponse,
}
```

Ordinals: `Init=0, Start=1, Stop=2, GetChildrenValuesResponse=3, GetIgnoredChildrenFailuresResponse=4, GetDependenciesCountResponse=5, MoveToWaitingChildrenResponse=6, Cancel=7, GetDependenciesResponse=8`.

### B3 — `src/interfaces/child-message.ts` — the child→parent envelope (verbatim)

```typescript
import { ParentCommand } from '../enums/parent-command';

export interface ChildMessage {
  cmd: ParentCommand;
  requestId?: string;
  value?: any;
  err?: Record<string, any>;
}
```

There is no analogous declared interface for parent→child; the shapes sent are (from B7/B9):
`{ cmd: ChildCommand.Init, value: processFile }`,
`{ cmd: ChildCommand.Start, job: JobJsonSandbox, token?: string }`,
`{ cmd: ChildCommand.Cancel, value: signal.reason }`,
`{ requestId, cmd: ChildCommand.<X>Response, value }`.

---

## 2. Concrete wire shapes emitted by the child (B4 `child-processor.ts`)

| Emitted message | Site |
|---|---|
| `{ cmd: ParentCommand.InitFailed, err: errorToJSON(err) }` | `init()` catch |
| `{ cmd: ParentCommand.InitCompleted }` | end of `init()` |
| `{ cmd: ParentCommand.Error, err: errorToJSON(new Error('cannot start a not idling child process')) }` | `start()` when status ≠ Idle |
| `{ cmd: ParentCommand.Completed, value: typeof result === 'undefined' ? null : result }` | processor resolved |
| `{ cmd: ParentCommand.Failed, value: errorToJSON(!(<Error>err).message ? new Error(<any>err) : err) }` | processor rejected |
| `{ cmd: ParentCommand.Failed, value: errorToJSON(err) }` | `uncaughtException` handler (B5) |
| `{ cmd: ParentCommand.Progress, value: progress }` | `job.updateProgress(progress)` |
| `{ cmd: ParentCommand.Log, value: row }` | `job.log(row)` |
| `{ cmd: ParentCommand.MoveToDelayed, value: { timestamp, token } }` | `job.moveToDelayed()` |
| `{ cmd: ParentCommand.MoveToWait, value: { token } }` | `job.moveToWait()` |
| `{ requestId, cmd: ParentCommand.MoveToWaitingChildren, value: { token, opts } }` | request/response |
| `{ cmd: ParentCommand.Update, value: data }` | `job.updateData(data)` (fire-and-forget) |
| `{ requestId, cmd: ParentCommand.GetChildrenValues }` | request/response |
| `{ requestId, cmd: ParentCommand.GetIgnoredChildrenFailures }` | request/response |
| `{ requestId, cmd: ParentCommand.GetDependenciesCount, value: opts }` | request/response |
| `{ requestId, cmd: ParentCommand.GetDependencies, value: opts }` | request/response |

Note the asymmetry preserved in the source: **`InitFailed` and `Error` put the serialized error under `err`; `Failed` puts it under `value`.**

### Child status machine (verbatim)

```typescript
enum ChildStatus {
  Idle,
  Started,
  Terminating,
  Errored,
}

const RESPONSE_TIMEOUT = process.env.NODE_ENV === 'test' ? 500 : 5_000;
```

Class doc comment (verbatim):

> "ChildProcessor
>
> This class acts as the interface between a child process and it parent process so that jobs can be processed in different processes."

```typescript
export class ChildProcessor {
  public status?: ChildStatus;
  public processor: any;
  public currentJobPromise: Promise<unknown> | undefined;
  private abortController?: AbortController;

  constructor(
    private send: (msg: any) => Promise<void>,
    private receiver: Receiver,
  ) {}
```

### `init(processorFile)` (verbatim)

```typescript
public async init(processorFile: string): Promise<void> {
  let processor;
  try {
    const { default: processorFn } = await import(processorFile);
    processor = processorFn;

    if (processor.default) {
      // support es2015 module.
      processor = processor.default;
    }

    if (typeof processor !== 'function') {
      throw new Error('No function is exported in processor file');
    }
  } catch (err) {
    this.status = ChildStatus.Errored;
    try {
      await this.send({
        cmd: ParentCommand.InitFailed,
        err: errorToJSON(err),
      });
    } finally {
      // A child that failed to initialize cannot recover, and because the open
      // IPC channel keeps its event loop alive it would never exit on its own.
      // Exit explicitly (after attempting to send InitFailed) so the parent
      // can never reuse a half-initialized "zombie" child. This is a
      // belt-and-braces measure: ChildPool also kills the child, but exiting
      // here guarantees termination even if the parent-side kill were to fail.
      // In a worker thread this stops only the current worker, not the process.
      process.exit(process.exitCode ?? 1);
    }
  }

  const origProcessor = processor;
  processor = function (
    job: SandboxedJob,
    token?: string,
    signal?: AbortSignal,
  ) {
    try {
      return Promise.resolve(origProcessor(job, token, signal));
    } catch (err) {
      return Promise.reject(err);
    }
  };

  this.processor = processor;
  this.status = ChildStatus.Idle;
  await this.send({
    cmd: ParentCommand.InitCompleted,
  });
}
```

### `start(jobJson, token)` (verbatim)

```typescript
public async start(jobJson: JobJsonSandbox, token?: string): Promise<void> {
  if (this.status !== ChildStatus.Idle) {
    return this.send({
      cmd: ParentCommand.Error,
      err: errorToJSON(new Error('cannot start a not idling child process')),
    });
  }
  this.status = ChildStatus.Started;
  this.abortController = new AbortController();
  this.currentJobPromise = (async () => {
    try {
      const job = this.wrapJob(jobJson, this.send);
      const result = await this.processor(
        job,
        token,
        this.abortController.signal,
      );
      await this.send({
        cmd: ParentCommand.Completed,
        value: typeof result === 'undefined' ? null : result,
      });
    } catch (err) {
      await this.send({
        cmd: ParentCommand.Failed,
        value: errorToJSON(!(<Error>err).message ? new Error(<any>err) : err),
      });
    } finally {
      this.status = ChildStatus.Idle;
      this.currentJobPromise = undefined;
      this.abortController = undefined;
    }
  })();
}
```

### Cancellation / graceful exit (verbatim)

```typescript
/**
 * Cancels the currently running job by aborting its signal.
 * @param reason - Optional reason for the cancellation
 */
public cancel(reason?: string): void {
  if (this.abortController) {
    this.abortController.abort(reason);
  }
}

public async stop(): Promise<void> {}

async waitForCurrentJobAndExit(): Promise<void> {
  this.status = ChildStatus.Terminating;
  try {
    await this.currentJobPromise;
  } finally {
    process.exit(process.exitCode || 0);
  }
}
```

### `wrapJob` doc comment (verbatim)

> "Enhance the given job argument with some functions that can be called from the sandboxed job processor.
>
> Note, the `job` argument is a JSON deserialized message from the main node process to this forked child process, the functions on the original job object are not in tact. The wrapped job adds back some of those original functions."

Rehydration performed by `wrapJob` (verbatim excerpt):

```typescript
const wrappedJob = {
  ...job,
  queueQualifiedName: job.queueQualifiedName,
  data: JSON.parse(job.data || '{}'),
  opts: job.opts,
  returnValue: JSON.parse(job.returnvalue || '{}'),
  ...
```

`updateProgress` keeps a local copy so it can be read back synchronously (verbatim):

```typescript
async updateProgress(progress: JobProgress) {
  // Locally store reference to new progress value
  // so that we can return it from this process synchronously.
  this.progress = progress;
  // Send message to update job progress.
  await send({
    cmd: ParentCommand.Progress,
    value: progress,
  });
},
```

Request-id generation, used for every request/response call (verbatim, repeated per method):

```typescript
const requestId = Math.random().toString(36).substring(2, 15);
await send({ requestId, cmd: ParentCommand.GetChildrenValues });
return waitResponse(
  requestId,
  this.receiver,
  RESPONSE_TIMEOUT,
  'getChildrenValues',
) as Promise<{ [jobKey: string]: CT }>;
```

`getIgnoredChildrenFailures` doc comment (verbatim):

> "Proxy `getIgnoredChildrenFailures` function.
>
> This method sends a request to retrieve the failures of ignored children and waits for a response from the parent process.
>
> @returns - A promise that resolves with the ignored children failures. The exact structure of the returned data depends on the parent process implementation."

### `waitResponse` — correlation + timeout (verbatim)

```typescript
const waitResponse = async (
  requestId: string,
  receiver: Receiver,
  timeout: number,
  cmd: string,
) => {
  return new Promise((resolve, reject) => {
    const listener = (msg: { requestId: string; value: any }) => {
      if (msg.requestId === requestId) {
        resolve(msg.value);
        receiver.off('message', listener);
      }
    };
    receiver.on('message', listener);

    setTimeout(() => {
      receiver.off('message', listener);

      reject(new Error(`TimeoutError: ${cmd} timed out in (${timeout}ms)`));
    }, timeout);
  });
};
```

---

## 3. Child-side dispatch loop and transport binding

### B5 — `src/classes/main-base.ts` (verbatim, full)

```typescript
/**
 * Wrapper for sandboxing.
 *
 */
import { ChildProcessor } from './child-processor';
import { ParentCommand, ChildCommand } from '../enums';
import { errorToJSON, toString } from '../utils';
import { Receiver } from '../interfaces';

export default (send: (msg: any) => Promise<void>, receiver: Receiver) => {
  const childProcessor = new ChildProcessor(send, receiver);

  receiver?.on('message', async msg => {
    try {
      switch (msg.cmd as ChildCommand) {
        case ChildCommand.Init:
          await childProcessor.init(msg.value);
          break;
        case ChildCommand.Start:
          await childProcessor.start(msg.job, msg?.token);
          break;
        case ChildCommand.Stop:
          break;
        case ChildCommand.Cancel:
          childProcessor.cancel(msg.value);
          break;
      }
    } catch (err) {
      console.error('Error handling child message');
    }
  });

  process.on('SIGTERM', () => childProcessor.waitForCurrentJobAndExit());
  process.on('SIGINT', () => childProcessor.waitForCurrentJobAndExit());

  process.on('uncaughtException', async (err: any) => {
    if (typeof err !== 'object') {
      err = new Error(toString(err));
    }

    await send({
      cmd: ParentCommand.Failed,
      value: errorToJSON(err),
    });

    // An uncaughException leaves this process in a potentially undetermined state so
    // we must exit
    process.exit();
  });
};
```

Note: the `*Response` ChildCommands are **not** handled in this switch — they are consumed by the per-request `waitResponse` listeners registered on the same `receiver`.

### B6 — two transport bindings of the same protocol (verbatim, full)

`src/classes/main.ts`:

```typescript
/**
 * Child process wrapper for sandboxing.
 *
 */
import { childSend } from '../utils';
import mainBase from './main-base';

mainBase((msg: any) => childSend(process, msg), process);
```

`src/classes/main-worker.ts`:

```typescript
/**
 * Worker Thread wrapper for sandboxing
 *
 */
import { parentPort } from 'worker_threads';
import mainBase from './main-base';

mainBase(async (msg: any) => parentPort.postMessage(msg), parentPort);
```

### B10 — transport send abstraction (verbatim)

```typescript
interface procSendLike {
  send?(message: any, callback?: (error: Error | null) => void): boolean;
  postMessage?(message: any): void;
}

export const asyncSend = <T extends procSendLike>(
  proc: T,
  msg: any,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof proc.send === 'function') {
      proc.send(msg, (err: Error | null) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    } else if (typeof proc.postMessage === 'function') {
      resolve(proc.postMessage(msg));
    } else {
      resolve();
    }
  });
};

export const childSend = (
  proc: NodeJS.Process,
  msg: ChildMessage,
): Promise<void> => asyncSend<NodeJS.Process>(proc, msg);
```

---

## 4. Error serialization across the boundary (B10, verbatim)

```typescript
const getCircularReplacer = (rootReference: any) => {
  const references = new WeakSet();
  references.add(rootReference);
  return (_: string, value: any) => {
    if (typeof value === 'object' && value !== null) {
      if (references.has(value)) {
        return '[Circular]';
      }
      references.add(value);
    }
    return value;
  };
};

export const errorToJSON = (value: any): Record<string, any> => {
  const error: Record<string, any> = {};

  Object.getOwnPropertyNames(value).forEach(function (propName: string) {
    error[propName] = value[propName];
  });

  return JSON.parse(JSON.stringify(error, getCircularReplacer(value)));
};
```

Non-Error throwables are normalized before serialization: `toString(value)` handles `null`/`undefined` → `''`, strings pass through, arrays map recursively, symbols use `.toString()`, and `-0` stringifies as `'-0'`.

Parent-side rehydration — `sandbox.ts` (verbatim):

```typescript
case ParentCommand.Failed:
case ParentCommand.Error: {
  const err = new Error();
  // ParentCommand.Failed carries the error under `value`,
  // while ParentCommand.Error carries it under `err`. Read
  // from either key so the failure reason is never lost.
  Object.assign(err, msg.value ?? msg.err);
  reject(err);
  break;
}
```

Init-failure rehydration — `child.ts` (verbatim): only `stack` and `message` survive.

```typescript
} else if (msg.cmd === ParentCommand.InitFailed) {
  const err = new Error();
  err.stack = msg.err.stack;
  err.message = msg.err.message;
  reject(err);
}
```

---

## 5. Parent-side dispatcher (B7 `sandbox.ts`)

Handler signature and lifecycle (verbatim excerpts):

```typescript
const sandbox = <T, R, N extends string>(
  processFile: any,
  childPool: ChildPool,
) => {
  return async function process(
    job: Job<T, R, N>,
    token?: string,
    signal?: AbortSignal,
  ): Promise<R> {
```

Exit is an out-of-band failure path (verbatim):

```typescript
exitHandler = (exitCode: any, signal: any) => {
  reject(
    new Error(
      'Unexpected exit code: ' + exitCode + ' signal: ' + signal,
    ),
  );
};

child = await childPool.retain(processFile);
child.on('exit', exitHandler);
```

Full parent message switch (verbatim, condensed to the dispatch lines):

```typescript
switch (msg.cmd) {
  case ParentCommand.Completed:            resolve(msg.value); break;
  case ParentCommand.Failed:
  case ParentCommand.Error: { /* see §4 */ }
  case ParentCommand.Progress:             await job.updateProgress(msg.value); break;
  case ParentCommand.Log:                  await job.log(msg.value); break;
  case ParentCommand.MoveToDelayed:        await job.moveToDelayed(msg.value?.timestamp, msg.value?.token); break;
  case ParentCommand.MoveToWait:           await job.moveToWait(msg.value?.token); break;
  case ParentCommand.MoveToWaitingChildren: {
      const value = await job.moveToWaitingChildren(msg.value?.token, msg.value?.opts);
      child.send({ requestId: msg.requestId, cmd: ChildCommand.MoveToWaitingChildrenResponse, value });
    } break;
  case ParentCommand.Update:               await job.updateData(msg.value); break;
  case ParentCommand.GetChildrenValues: {
      const value = await job.getChildrenValues();
      child.send({ requestId: msg.requestId, cmd: ChildCommand.GetChildrenValuesResponse, value });
    } break;
  case ParentCommand.GetIgnoredChildrenFailures: {
      const value = await job.getIgnoredChildrenFailures();
      child.send({ requestId: msg.requestId, cmd: ChildCommand.GetIgnoredChildrenFailuresResponse, value });
    } break;
  case ParentCommand.GetDependenciesCount: {
      const value = await job.getDependenciesCount(msg.value);
      child.send({ requestId: msg.requestId, cmd: ChildCommand.GetDependenciesCountResponse, value });
    } break;
  case ParentCommand.GetDependencies: {
      const value = await job.getDependencies(msg.value);
      child.send({ requestId: msg.requestId, cmd: ChildCommand.GetDependenciesResponse, value });
    } break;
}
```
The whole switch is wrapped in `try { ... } catch (err) { reject(err); }`.

Job start and cancellation wiring (verbatim):

```typescript
child.on('message', msgHandler);

child.send({
  cmd: ChildCommand.Start,
  job: job.asJSONSandbox(),
  token,
});

if (signal) {
  abortHandler = () => {
    try {
      child.send({
        cmd: ChildCommand.Cancel,
        value: signal.reason,
      });
    } catch {
      // Child process may have already exited
    }
  };

  if (signal.aborted) {
    abortHandler();
  } else {
    signal.addEventListener('abort', abortHandler, { once: true });
  }
}
```

Cleanup / release — the `finally` block removes the abort listener, detaches `msgHandler`/`exitHandler`, and **only returns the child to the pool if it is still alive**:

```typescript
if (child) {
  child.off('message', msgHandler);
  child.off('exit', exitHandler);
  if (child.exitCode === null && child.signalCode === null) {
    childPool.release(child);
  }
}
```

Accompanying comment (verbatim): "Note: There is a potential race where the signal is aborted between `await done` and this cleanup. This is safe because: 1. abortHandler has a try-catch for child process already exited 2. The listener is added with `once: true`, so it fires at most once 3. removeEventListener here is defensive cleanup only"

---

## 6. Child reuse / pooling (B8 `child-pool.ts`, verbatim)

```typescript
const CHILD_KILL_TIMEOUT = 30_000;

interface ChildPoolOpts extends SandboxedOptions {
  mainFile?: string;
}

const supportCJS = () => {
  return (
    typeof require === 'function' &&
    typeof module === 'object' &&
    typeof module.exports === 'object'
  );
};

export class ChildPool {
  retained: { [key: number]: Child } = {};
  free: { [key: string]: Child[] } = {};
  private opts: ChildPoolOpts;

  constructor({
    mainFile = supportCJS()
      ? path.join(process.cwd(), 'dist/cjs/classes/main.js')
      : path.join(process.cwd(), 'dist/esm/classes/main.js'),
    useWorkerThreads,
    workerForkOptions,
    workerThreadsOptions,
  }: ChildPoolOpts) { ... }
```

`retain` — free-list pop, else fork + `init()` (verbatim):

```typescript
async retain(processFile: string): Promise<Child> {
  let child = this.getFree(processFile).pop();

  if (child) {
    this.retained[child.pid] = child;
    return child;
  }

  child = new Child(this.opts.mainFile, processFile, {
    useWorkerThreads: this.opts.useWorkerThreads,
    workerForkOptions: this.opts.workerForkOptions,
    workerThreadsOptions: this.opts.workerThreadsOptions,
  });

  child.on('exit', this.remove.bind(this, child));

  try {
    await child.init();

    // Check status here as well, in case the child exited before we could
    // retain it.
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error('Child exited before it could be retained');
    }

    this.retained[child.pid] = child;

    return child;
  } catch (err) {
    console.error(err);
    // A child that failed to initialize (or exited during init) must never
    // be released back into the free pool, otherwise it becomes a "zombie"
    // that is reused for every subsequent job and fails them instantly.
    // Kill and remove it so a fresh child is forked on the next retain.
    // The child also exits itself after a failed init (see ChildProcessor),
    // so this is normally a no-op; log any kill failure instead of silently
    // swallowing it so a lingering child would not go unnoticed.
    if (child.childProcess || child.worker) {
      try {
        this.kill(child, 'SIGKILL').catch(killErr => {
          console.error('Failed to kill child after init error:', killErr);
        });
      } catch (killErr) {
        console.error('Failed to kill child after init error:', killErr);
      }
    }
    throw err;
  }
}
```

Release / remove / kill / clean (verbatim behavior). Note the free-list is **keyed by `processFile`**, so children are only reused for the same processor file; `retained` is keyed by `child.pid`.

```typescript
release(child: Child): void {
  delete this.retained[child.pid];
  this.getFree(child.processFile).push(child);
}

async kill(child: Child, signal: 'SIGTERM' | 'SIGKILL' = 'SIGKILL'): Promise<void> {
  this.remove(child);
  return child.kill(signal, CHILD_KILL_TIMEOUT);
}

async clean(): Promise<void> {
  const children = Object.values(this.retained).concat(this.getAllFree());
  this.retained = {};
  this.free = {};
  await Promise.all(children.map(c => this.kill(c, 'SIGTERM')));
}
```

`remove(child)` deletes `retained[child.pid]` and splices the child out of `getFree(child.processFile)` if present. `getFree(id)` lazily creates `this.free[id] = this.free[id] || []`; `getAllFree()` concatenates all per-file free lists.

---

## 7. Child process / worker-thread abstraction (B9 `child.ts`, verbatim excerpts)

Exit-code vocabulary used for init-failure reporting:

```typescript
/**
 * @see https://nodejs.org/api/process.html#process_exit_codes
 */
const exitCodesErrors: { [index: number]: string } = {
  1: 'Uncaught Fatal Exception',
  2: 'Unused',
  3: 'Internal JavaScript Parse Error',
  4: 'Internal JavaScript Evaluation Failure',
  5: 'Fatal Error',
  6: 'Non-function Internal Exception Handler',
  7: 'Internal Exception Handler Run-Time Failure',
  8: 'Unused',
  9: 'Invalid Argument',
  10: 'Internal JavaScript Run-Time Failure',
  12: 'Invalid Debug Argument',
  13: 'Unfinished Top-Level Await',
};
```

Class doc comment (verbatim):

> "Child class
>
> This class is used to create a child process or worker thread, and allows using isolated processes or threads for processing jobs."

Identity, spawn, and event forwarding (verbatim):

```typescript
get pid() {
  if (this.childProcess) {
    return this.childProcess.pid;
  } else if (this.worker) {
    // Worker threads pids can become negative when they are terminated
    // so we need to use the absolute value to index the retained object
    return Math.abs(this.worker.threadId);
  } else {
    throw new Error('No child process or worker thread');
  }
}

async init(): Promise<void> {
  const execArgv = await convertExecArgv(process.execArgv);

  let parent: ChildProcess | Worker;

  if (this.opts.useWorkerThreads) {
    this.worker = parent = new Worker(this.mainFile, {
      execArgv,
      stdin: true,
      stdout: true,
      stderr: true,
      ...(this.opts.workerThreadsOptions ? this.opts.workerThreadsOptions : {}),
    });
  } else {
    this.childProcess = parent = fork(this.mainFile, [], {
      execArgv,
      stdio: 'pipe',
      ...(this.opts.workerForkOptions ? this.opts.workerForkOptions : {}),
    });
  }

  // 'exit' records _exitCode/_signalCode (signalCode coerced from undefined to
  // null "for backwards compatibility"), sets _killed, re-emits 'exit', then
  // "Clean all listeners, we do not expect any more events after 'exit'"
  // (parent.removeAllListeners(); this.removeAllListeners();).
  // 'error', 'message' and 'close' are forwarded verbatim onto the Child emitter.

  // `parent.stdout`/`parent.stderr` may be null when the underlying runtime
  // does not pipe child stdio (e.g. Bun ignores `worker_threads` stdout/stderr
  // options, and Node returns null when `stdio: 'ignore'` is passed in
  // `workerForkOptions`). Guard the pipe calls so initialization does not throw.
  // See https://github.com/taskforcesh/bullmq/issues/2232
  parent.stdout?.pipe(process.stdout);
  parent.stderr?.pipe(process.stderr);

  await this.initChild();
}
```

Init handshake — parent sends `Init`, waits for `InitCompleted`/`InitFailed`; unknown `cmd` values are ignored (verbatim):

```typescript
private async initChild() {
  const onComplete = new Promise<void>((resolve, reject) => {
    const onMessageHandler = (msg: any) => {
      if (!Object.values(ParentCommand).includes(msg.cmd)) {
        return;
      }

      if (msg.cmd === ParentCommand.InitCompleted) {
        resolve();
      } else if (msg.cmd === ParentCommand.InitFailed) {
        const err = new Error();
        err.stack = msg.err.stack;
        err.message = msg.err.message;
        reject(err);
      }
      this.off('message', onMessageHandler);
      this.off('close', onCloseHandler);
    };

    const onCloseHandler = (code: number, signal: number) => {
      if (code > 128) {
        code -= 128;
      }
      const msg = exitCodesErrors[code] || `Unknown exit code ${code}`;
      reject(
        new Error(`Error initializing child: ${msg} and signal ${signal}`),
      );
      this.off('message', onMessageHandler);
      this.off('close', onCloseHandler);
    };

    this.on('message', onMessageHandler);
    this.on('close', onCloseHandler);
  });

  await this.send({
    cmd: ChildCommand.Init,
    value: this.processFile,
  });
  await onComplete;
}
```

Kill with escalation — `kill(signal = 'SIGKILL', timeoutMs?)`: returns immediately if `hasProcessExited()`; otherwise registers `onExitOnce`, calls `killProcess(signal)` (`childProcess.kill(signal)` or `worker.terminate()`), and if `timeoutMs` is `0` or finite sets a timer that escalates to `killProcess('SIGKILL')` when the child still has not exited; awaits `onExit` in both paths. `hasProcessExited(): boolean { return !!(this.exitCode !== null || this.signalCode); }`

`send(msg)` mirrors `asyncSend`: `childProcess.send(msg, cb)` (reject on `err`) when forked, `resolve(this.worker.postMessage(msg))` when a worker thread, `resolve()` otherwise.

`convertExecArgv` — spawn-time debugger-port remapping: every `process.execArgv` entry not containing `--inspect` is passed through unchanged; each `--inspect*` arg is rewritten to `${argName}=${port}` with `port` from a freshly bound ephemeral port (`getFreePort()` listens on `0`, reads `AddressInfo.port`, closes). Converted args are appended after the standard ones.

---

## 8. Payload / config surface

### B13 — job payload crossing the boundary (verbatim)

```typescript
export interface JobJson {
  id: string;
  name: string;
  data: string;
  opts: JobsOptions;
  progress: JobProgress;
  attemptsMade: number;
  attemptsStarted: number;
  finishedOn?: number;
  processedOn?: number;
  timestamp: number;
  delay?: number;
  priority?: number;
  failedReason: string;
  stacktrace?: string;
  returnvalue: string;
  parent?: ParentKeys;
  parentKey?: string;
  repeatJobKey?: string;
  debounceId?: string;
  deduplicationId?: string;
  deferredFailure?: string;
  processedBy?: string;
  stalledCounter: number;
}
```

```typescript
export type JobJsonSandbox = JobJson & {
  queueName: string;
  queueQualifiedName: string;
  prefix: string;
};
```

`data` and `returnvalue` are **strings** on the wire (JSON-encoded); `wrapJob` parses them into `data` / `returnValue`.

### B12 — `SandboxedJob` (the child-visible API surface) (verbatim)

```typescript
/**
 * @see {@link https://docs.bullmq.io/guide/workers/sandboxed-processors}
 */
export interface SandboxedJob<T = any, R = any> extends Omit<
  JobJsonSandbox,
  'data' | 'opts' | 'returnvalue'
> {
  data: T;
  opts: JobsOptions;
  queueQualifiedName: string;
  moveToDelayed: (timestamp: number, token?: string) => Promise<void>;
  moveToWait: (token?: string) => Promise<void>;
  moveToWaitingChildren: (
    token?: string,
    opts?: MoveToWaitingChildrenOpts,
  ) => Promise<boolean>;
  log: (row: string) => void;
  updateData: (data: T) => Promise<void>;
  updateProgress: (value: JobProgress) => Promise<void>;
  getChildrenValues: <CT = any>() => Promise<{ [jobKey: string]: CT }>;
  getIgnoredChildrenFailures: () => Promise<{ [jobKey: string]: string }>;
  getDependenciesCount: (opts?: {
    failed?: boolean;
    ignored?: boolean;
    processed?: boolean;
    unprocessed?: boolean;
  }) => Promise<{
    failed?: number;
    ignored?: number;
    processed?: number;
    unprocessed?: number;
  }>;
  returnValue: R;
}
```

### B11 — `SandboxedOptions` config surface (verbatim)

```typescript
export interface SandboxedOptions {
  /**
   * Use Worker Threads instead of Child Processes.
   * Note: This option can only be used when specifying
   * a file for the processor argument.
   *
   * @defaultValue false
   */
  useWorkerThreads?: boolean;

  /**
   * Support passing Worker Fork Options.
   * Note: This option can only be used when specifying
   * a file for the processor argument and useWorkerThreads is passed as false (default value).
   * @see {@link https://nodejs.org/api/child_process.html#child_processforkmodulepath-args-options}
   */
  workerForkOptions?: ForkOptions;

  /**
   * Support passing Worker Threads Options.
   * Note: This option can only be used when specifying
   * a file for the processor argument and useWorkerThreads is passed as true.
   * @see {@link https://nodejs.org/api/worker_threads.html#new-workerfilename-options}
   */
  workerThreadsOptions?: WorkerThreadsOptions;
}
```

---

## 9. B14 — docs.bullmq.io "Sandboxed processors" (verbatim prose)

> "It is also possible to define workers to run on a separate process. We call these processors _sandboxed_, because they run isolated from the rest of the code."

> "When your workers perform CPU-heavy operations, they will inevitably keep the NodeJS event loop busy, which prevents BullMQ from doing job bookkeeping such as extending job locks, ultimately leading to 'stalled' jobs."

> "Since _sandboxed_ workers run the processor in a different process than the bookkeeping code, they will not result in stalled jobs as easily as standard workers. Make sure that you keep your concurrency factor within sane numbers for this not to happen."

Processor definition and registration:

```typescript
import { SandboxedJob } from 'bullmq';

module.exports = async (job: SandboxedJob) => {
    // Do something with job
};
```

```typescript
import { Worker } from 'bullmq'

const processorFile = path.join(__dirname, 'my_procesor.js');
worker = new Worker(queueName, processorFile);
```

URL support:

> "Processors can be defined using URL instances:"

```typescript
import { pathToFileURL } from 'url';

const processorUrl = pathToFileURL(__dirname + '/my_procesor.js');

worker = new Worker(queueName, processorUrl);
```

> (hint, warning) "Recommended for Windows OS."

Worker Threads:

> "The default mechanism for launching sandboxed workers is using Node's spawn process library. From BullMQ version v3.13.0, it is also possible to launch the workers using Node's new Worker Threads library. These threads are supposed to be less resource-demanding than the previous approach, however, they are still not as lightweight as we could expect since Node's runtime needs to be duplicated by every thread."

> "In order to enable worker threads support use the `useWorkerThreads` option when defining an external processor file:"

```typescript
import { Worker } from 'bullmq'

const processorFile = path.join(__dirname, 'my_procesor.js');
worker = new Worker(queueName, processorFile, { useWorkerThreads: true });
```
