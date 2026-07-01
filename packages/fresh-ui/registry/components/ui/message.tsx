/**
 * @component Message
 * @layer 2
 * @depends theme-seed
 * @description A chat message in a thread: author + time, inline-markup body
 * (**bold**, `code`, [n] citations), tool-call + chart/code blocks, follow-up
 * chips, and hover actions. User messages are right-aligned bubbles; assistant
 * messages are card-less prose. Exports `renderInline` and `TypingIndicator`.
 */

import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';
import { Avatar } from './avatar.tsx';
import { CitationChip } from './citation-chip.tsx';
import { ChartBlock, type ChartDatum } from './chart-block.tsx';
import { CodeBlock } from './code-block.tsx';
import { ToolCallCard, type ToolCallStatus } from './tool-call-card.tsx';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface MessageAuthor {
  name: string;
  initials?: string;
  agent?: boolean;
}

export type MessageBlock =
  | {
    type: 'chart';
    title?: string;
    sub?: string;
    data: ChartDatum[];
    unit?: string;
    variant?: 'bar' | 'column';
  }
  | { type: 'code'; code: string; filename?: string; lang?: string };

export interface MessageTool {
  name: string;
  args?: string;
  result?: string;
  status: ToolCallStatus;
  defaultOpen?: boolean;
}

export interface MessageData {
  role: MessageRole;
  author: MessageAuthor;
  time?: string;
  model?: string;
  body?: string;
  blocks?: MessageBlock[];
  tools?: MessageTool[];
  followups?: string[];
  /** Show the typing indicator instead of a body (assistant in-progress). */
  pending?: boolean;
}

/**
 * Wiring for citations + follow-ups shared with the surrounding thread.
 */
export interface MessageCtx {
  activeCite?: number;
  onCite?: (index: number) => void;
  onFollowup?: (text: string) => void;
}

const INLINE = /(\*\*([^*]+)\*\*)|(`([^`]+)`)|(\[(\d+)\])/g;

/**
 * Turns a string with `**bold**`, `` `code` ``, and `[n]` citation markers into
 * an array of text + element nodes. Exported for reuse in other prose surfaces.
 */
export function renderInline(text: string, ctx?: MessageCtx): (string | VNode)[] {
  const nodes: (string | VNode)[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  INLINE.lastIndex = 0;
  while ((match = INLINE.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    if (match[2] !== undefined) {
      nodes.push(<strong>{match[2]}</strong>);
    } else if (match[4] !== undefined) {
      nodes.push(<code class='ns-inline-code'>{match[4]}</code>);
    } else if (match[6] !== undefined) {
      const index = Number(match[6]);
      nodes.push(
        <CitationChip index={index} active={ctx?.activeCite === index} onClick={ctx?.onCite} />,
      );
    }
    last = INLINE.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/**
 * Animated "assistant is typing" indicator.
 */
export function TypingIndicator(): VNode {
  return (
    <span class='ns-typing' role='status' aria-label='Assistant is typing'>
      <span></span>
      <span></span>
      <span></span>
    </span>
  );
}

function renderBlock(block: MessageBlock): VNode {
  if (block.type === 'chart') {
    return (
      <ChartBlock
        title={block.title}
        sub={block.sub}
        data={block.data}
        unit={block.unit}
        variant={block.variant}
      />
    );
  }
  return <CodeBlock code={block.code} filename={block.filename} lang={block.lang} />;
}

interface MessageProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class'> {
  message: MessageData;
  ctx?: MessageCtx;
  class?: string;
}

/**
 * Renders a single chat message.
 */
export function Message({ message, ctx, class: className, ...props }: MessageProps): VNode {
  const { role, author, time, model, body, blocks, tools, followups, pending } = message;

  return (
    <div {...props} class={cn('ns-message', `ns-message--${role}`, className)}>
      <div class='ns-message__avatar'>
        <Avatar name={author.name} initials={author.initials} agent={author.agent} size='sm' />
      </div>
      <div class='ns-message__main'>
        <div class='ns-message__head'>
          <span class='ns-message__author'>{author.name}</span>
          {model ? <span class='ns-message__model'>{model}</span> : null}
          {time ? <span class='ns-message__time'>{time}</span> : null}
        </div>
        <div class='ns-message__body'>
          {pending ? <TypingIndicator /> : null}
          {body ? <p class='ns-message__text'>{renderInline(body, ctx)}</p> : null}
          {blocks?.map((block, index) => <div key={`b${index}`}>{renderBlock(block)}</div>)}
          {tools?.map((tool, index) => (
            <ToolCallCard
              key={`t${index}`}
              name={tool.name}
              args={tool.args}
              result={tool.result}
              status={tool.status}
              defaultOpen={tool.defaultOpen}
            />
          ))}
        </div>
        {followups && followups.length
          ? (
            <div class='ns-message__followups ns-cluster ns-cluster--sm'>
              {followups.map((followup, index) => (
                <button
                  key={`f${index}`}
                  type='button'
                  class='ns-pill'
                  onClick={() => ctx?.onFollowup?.(followup)}
                >
                  {followup}
                </button>
              ))}
            </div>
          )
          : null}
        <div class='ns-message__actions'>
          <button type='button' class='ns-msg-action' aria-label='Copy message'>Copy</button>
          <button type='button' class='ns-msg-action' aria-label='Regenerate response'>
            Regenerate
          </button>
        </div>
      </div>
    </div>
  );
}
