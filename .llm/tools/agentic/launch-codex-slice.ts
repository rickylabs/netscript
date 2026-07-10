/** @deprecated Retained through one compatibility cycle; retirement requires reviewed #577-#582 completion. */
/**
 * launch-codex-slice.ts — stage, safety-check, launch, and record a WSL Codex slice.
 *
 * The supervisor delegates implementation slices to WSL Codex sessions via
 * `codex debug app-server send-message-v2` (wrapped by `~/launch_slice.sh`).
 * Doing that by hand from Windows PowerShell is fragile: PowerShell parses `<` /
 * `$(...)` inside the command string (the "'<' operator is reserved" parse
 * error), and PowerShell here-strings join lines with CRLF, whose trailing `\r`
 * breaks `cd`/redirects once inside `bash -lc`. This tool removes both landmines
 * structurally via the shared `wsl()` helper (argv array, no shell parsing) and
 * LF-normalizes the brief before staging. It enforces the handoff contract
 * (brief must begin with `use harness` and carry a `## SKILL` chapter) and
 * push-safety (worktree must have NO upstream so a stray bare push fails loudly),
 * then auto-writes the `codex-thread-ids.md` run artifact from the live
 * thread/start response.
 *
 * Modes:
 *   (default)        Validate brief -> push-safety -> stage (LF) -> launch via
 *                    ~/launch_slice.sh, stream the turn, record thread id. Run
 *                    this with run_in_background: it streams the whole turn and
 *                    writes the thread artifact as soon as thread/start arrives.
 *   --dry-run        Everything except the send: validate + safety + stage +
 *                    print the exact launch command. Safe; forks nothing.
 *   --parse-log F    Parse an existing launch log for thread id / rollout /
 *                    model and print them. Safe; used for parser smoke tests.
 *
 * Usage:
 *   deno run --allow-read --allow-write --allow-run \
 *     .llm/tools/agentic/launch-codex-slice.ts \
 *     --brief <win-path-to-implement.md> \
 *     --worktree /home/codex/repos/<wt> \
 *     --branch feat/prime-time/auth-s1-contract \
 *     --slug auth-s1 \
 *     --slice-dir <win-path-to-slice-run-dir> \
 *     [--expect-base <sha>] [--user codex] [--pretty] [--dry-run]
 *
 * Exit codes: 0 = ok (launched / dry-run clean / parsed) · 1 = launch failed or
 * no thread id · 2 = usage error · 3 = brief contract violation · 4 = push-safety
 * violation (upstream set / wrong branch / wrong base) · 5 = worktree not found.
 */

import {
  type CommandResult,
  evaluateGitSafety,
  parseThreadInfo,
  requireValue,
  sq,
  type ThreadInfo,
  validateHandoffContract,
  winToWsl,
  wsl,
  wslGitInfo,
  wslHome,
  wslUser,
} from './agentic-lib.ts';
import { LocalSenderOwnershipAdapter } from './runtime/adapters/local-sender-ownership-adapter.ts';
import {
  activateSenderOwnership,
  decideSenderOwnership,
  newSenderOwnershipRecord,
} from './runtime/sender-ownership.ts';

interface Options {
  mode: 'launch' | 'dry-run' | 'parse-log';
  brief?: string;
  worktree?: string;
  branch?: string;
  slug?: string;
  dest?: string;
  sliceDir?: string;
  expectBase?: string;
  user: string;
  parseLog?: string;
  pretty: boolean;
  profile?: string;
  profileHome?: string;
}

function printHelp(): void {
  console.log([
    'Usage:',
    '  deno run --allow-read --allow-write --allow-run \\',
    '    .llm/tools/agentic/launch-codex-slice.ts --brief <win path> \\',
    '    --worktree <wsl path> --branch <branch> --slug <slug> --slice-dir <win path> [options]',
    '',
    'Options:',
    '  --brief <path>       Windows path to the slice brief (implement.md). Required to launch.',
    '  --worktree <path>    WSL worktree path (e.g. /home/codex/repos/<wt>). Required to launch.',
    '  --branch <name>      Expected branch in the worktree. Verified before launch.',
    '  --slug <name>        Short slug; default dest = /home/codex/<slug>-brief.md.',
    '  --dest <wsl path>    Explicit WSL staging path for the brief. Overrides --slug.',
    '  --slice-dir <path>   Windows path to the run-artifact slice dir for codex-thread-ids.md.',
    '  --expect-base <sha>  If set, worktree HEAD short sha must equal this before launch.',
    '  --profile <name>     Named Codex profile layer for this child only.',
    '  --profile-home <dir> Isolated CODEX_HOME containing the named profile.',
    '  --user <name>        WSL user. Default: codex.',
    '  --dry-run            Validate + safety-check + stage + print launch command; do not send.',
    '  --parse-log <file>   Parse a saved launch log for thread id and exit.',
    '  --pretty             Human-readable output instead of JSON.',
    '  --help               Show this help.',
  ].join('\n'));
}

function parseArgs(args: string[]): Options | null {
  const o: Options = { mode: 'launch', user: wslUser(), pretty: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    switch (a) {
      case '--brief':
        o.brief = requireValue(args, i, a);
        i++;
        break;
      case '--worktree':
        o.worktree = requireValue(args, i, a);
        i++;
        break;
      case '--branch':
        o.branch = requireValue(args, i, a);
        i++;
        break;
      case '--slug':
        o.slug = requireValue(args, i, a);
        i++;
        break;
      case '--dest':
        o.dest = requireValue(args, i, a);
        i++;
        break;
      case '--slice-dir':
        o.sliceDir = requireValue(args, i, a);
        i++;
        break;
      case '--expect-base':
        o.expectBase = requireValue(args, i, a);
        i++;
        break;
      case '--profile':
        o.profile = requireValue(args, i, a);
        i++;
        break;
      case '--profile-home':
        o.profileHome = requireValue(args, i, a);
        i++;
        break;
      case '--user':
        o.user = requireValue(args, i, a);
        i++;
        break;
      case '--parse-log':
        o.mode = 'parse-log';
        o.parseLog = requireValue(args, i, a);
        i++;
        break;
      case '--dry-run':
        o.mode = 'dry-run';
        break;
      case '--pretty':
        o.pretty = true;
        break;
      case '--help':
        printHelp();
        return null;
      default:
        throw new Error(`Unknown argument: ${a}`);
    }
  }
  return o;
}

function threadRecord(o: Options, info: ThreadInfo, dest: string): string {
  return [
    `# ${o.slug ?? 'slice'} — Codex implementation thread`,
    '',
    `- **Thread / session id:** \`${info.threadId ?? 'UNKNOWN'}\``,
    info.rollout ? `- **Rollout:** \`${info.rollout}\`` : '',
    `- **Worktree:** \`${o.worktree}\``,
    `- **Branch:** \`${o.branch}\`${
      o.expectBase ? ` @ \`${o.expectBase}\`` : ''
    } (NO upstream by design).`,
    `- **Push rule:** explicit refspec only — \`git push origin HEAD:refs/heads/${o.branch}\`.`,
    `- **Model:** ${info.model ?? '?'} · approval=never · sandbox=dangerFullAccess`,
    `- **Brief (staged):** \`${dest}\``,
    '',
    '## Steering (same thread — never a second send-message-v2 at this worktree)',
    '```bash',
    `codex exec resume ${info.threadId ?? '<thread-id>'} -- "<follow-up>"`,
    '```',
    '',
    '_Written by `.llm/tools/agentic/launch-codex-slice.ts`._',
    '',
  ].filter((l) => l !== '').join('\n');
}

async function main(): Promise<void> {
  let o: Options | null;
  try {
    o = parseArgs(Deno.args);
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    Deno.exit(2);
    return;
  }
  if (!o) return;

  // --- parse-log mode (safe, no side effects) ---
  if (o.mode === 'parse-log') {
    const log = await Deno.readTextFile(o.parseLog!);
    const info = parseThreadInfo(log);
    if (o.pretty) {
      console.log(`threadId: ${info.threadId ?? '(none)'}`);
      console.log(`rollout:  ${info.rollout ?? '(none)'}`);
      console.log(`model:    ${info.model ?? '(none)'}`);
      console.log(`cwd:      ${info.cwd ?? '(none)'}`);
    } else {
      console.log(JSON.stringify({ mode: 'parse-log', ...info }));
    }
    Deno.exit(info.threadId ? 0 : 1);
  }

  // launch / dry-run require the core inputs
  if (!o.brief || !o.worktree) {
    console.error('--brief and --worktree are required to launch. See --help.');
    Deno.exit(2);
  }
  if (Boolean(o.profile) !== Boolean(o.profileHome)) {
    console.error('--profile and --profile-home must be supplied together.');
    Deno.exit(2);
  }
  const dest = o.dest ?? `${wslHome()}/${o.slug ?? 'slice'}-brief.md`;

  // 1) Validate the brief contract (read on Windows; LF-normalize in memory).
  const content = await Deno.readTextFile(o.brief);
  const check = validateHandoffContract(content);
  if (!check.ok) {
    const payload = { stage: 'validate', ok: false, problems: check.problems };
    console.log(
      o.pretty ? `FAIL brief contract: ${check.problems.join('; ')}` : JSON.stringify(payload),
    );
    Deno.exit(3);
  }

  // 2) Push-safety: upstream must be NONE; branch/base must match if given.
  const info = await wslGitInfo(o.user, o.worktree);
  const safety = evaluateGitSafety(info, { branch: o.branch, expectBase: o.expectBase });
  if (!safety.ok) {
    const report = {
      branch: info.branch,
      head: info.head,
      upstream: info.upstream,
      dirty: info.dirty,
      problems: safety.problems,
    };
    console.log(
      o.pretty
        ? `FAIL git-safety: ${JSON.stringify(report)}`
        : JSON.stringify({ stage: 'git-safety', ok: false, ...report }),
    );
    Deno.exit(safety.code);
  }

  // 3) Stage the brief into WSL with CRLF stripped (belt-and-suspenders).
  const mntSrc = winToWsl(o.brief);
  const stage: CommandResult = await wsl(
    o.user,
    `tr -d '\\r' < ${sq(mntSrc)} > ${sq(dest)} && echo "STAGED_BYTES=$(wc -c < ${
      sq(dest)
    } | tr -d ' ')" && echo "SKILL=$(grep -c '^## SKILL' ${sq(dest)})"`,
  );
  if (stage.code !== 0) {
    console.log(JSON.stringify({ stage: 'stage', ok: false, stderr: stage.stderr }));
    Deno.exit(1);
  }
  const stagedBytes = Number(stage.stdout.match(/^STAGED_BYTES=(\d+)$/m)?.[1] ?? '0');

  // Native `--cd` sets the WSL working directory at the interop layer. An
  // in-script `cd <wsl path>` can silently fail to stick when wsl.exe is
  // spawned from a Windows cwd, leaving the launch (and `send-message-v2`,
  // which derives the agent's worktree from the ambient cwd) in the wrong
  // directory. See wslCd in agentic-lib.ts.
  const profileScript = o.profile && o.profileHome
    ? `export PATH="$HOME/.local/bin:$PATH" CODEX_HOME=${sq(o.profileHome)}; msg="$(cat ${
      sq(dest)
    })"; codex --profile ${sq(o.profile)} debug app-server send-message-v2 "$msg"`
    : `~/launch_slice.sh ${sq(dest)}`;
  const launchCommand = `wsl.exe -u ${o.user} --cd ${o.worktree} -- bash -lc ${
    JSON.stringify(profileScript)
  }`;
  const launchPlan = {
    brief: o.brief,
    worktree: o.worktree,
    branch: o.branch,
    dest,
    stagedBytes,
    skillChapter: check.skillChapter,
    useHarness: check.useHarness,
    gitSafety: { branch: info.branch, head: info.head, upstream: info.upstream, dirty: info.dirty },
    launchCommand,
  };

  // 4a) Dry-run: stop here.
  if (o.mode === 'dry-run') {
    if (o.pretty) {
      console.log('DRY-RUN ok');
      console.log(`  brief valid : use harness=${check.useHarness} ## SKILL=${check.skillChapter}`);
      console.log(`  staged      : ${dest} (${stagedBytes} bytes)`);
      console.log(`  git-safety  : ${JSON.stringify(launchPlan.gitSafety)}`);
      console.log(`  would run   : ${launchCommand}`);
    } else {
      console.log(JSON.stringify({ mode: 'dry-run', ok: true, ...launchPlan }));
    }
    Deno.exit(0);
  }

  // Acquire durable ownership after every non-mutating check and immediately
  // before process spawn. A returned thread remains the worktree owner so the
  // next operator is directed to resume instead of creating a rival thread.
  const ownership = new LocalSenderOwnershipAdapter(
    `${Deno.env.get('HOME') ?? ''}/.config/netscript-agentic/runtime/senders`,
  );
  const existing = await ownership.read(o.worktree);
  if (existing) {
    const decision = decideSenderOwnership(o.worktree, {
      record: existing,
      ownerProcessAlive: ownership.isProcessAlive(existing.ownerPid),
      sessionActive: Boolean(existing.sessionId),
    });
    if (decision.kind === 'blocked') {
      console.log(JSON.stringify({
        stage: 'sender-ownership',
        ok: false,
        code: decision.diagnostic.code,
        message: decision.diagnostic.message,
        operatorAction: decision.diagnostic.operatorAction,
      }));
      Deno.exit(4);
    }
    await ownership.release(o.worktree, existing.leaseToken);
  }
  const leaseToken = crypto.randomUUID();
  const owner = newSenderOwnershipRecord({
    worktree: o.worktree,
    ownerPid: Deno.pid,
    leaseToken,
    now: new Date().toISOString(),
  });
  if (!await ownership.create(owner)) {
    console.log(JSON.stringify({
      stage: 'sender-ownership',
      ok: false,
      code: 'duplicate_sender_risk',
      message: 'another launcher acquired this worktree before process spawn',
    }));
    Deno.exit(4);
  }

  // 4b) Launch: stream the turn, record thread id as soon as thread/start lands.
  const child = new Deno.Command('wsl.exe', {
    args: [
      '-u',
      o.user,
      '--cd',
      o.worktree,
      '--',
      'bash',
      '-lc',
      profileScript,
    ],
    stdout: 'piped',
    stderr: 'inherit',
  }).spawn();

  const reader = child.stdout.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let recorded = false;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    await Deno.stdout.write(value); // mirror to bg-job log
    buf += dec.decode(value);
    if (!recorded) {
      const info2 = parseThreadInfo(buf);
      if (info2.threadId) {
        recorded = true;
        await ownership.replace(
          activateSenderOwnership(owner, leaseToken, info2.threadId, new Date().toISOString()),
          leaseToken,
        );
        if (o.sliceDir) {
          const recPath = `${o.sliceDir.replace(/[\\/]$/, '')}/codex-thread-ids.md`;
          await Deno.writeTextFile(recPath, threadRecord(o, info2, dest));
          console.log(`\n[launch-codex-slice] recorded thread ${info2.threadId} -> ${recPath}`);
        } else {
          console.log(
            `\n[launch-codex-slice] thread ${info2.threadId} (no --slice-dir; not recorded)`,
          );
        }
      }
    }
  }
  const status = await child.status;
  if (!recorded) {
    console.log(`\n[launch-codex-slice] WARN: no thread id captured (exit ${status.code})`);
    Deno.exit(1);
  }
  Deno.exit(status.code === 0 ? 0 : 1);
}

if (import.meta.main) await main();
