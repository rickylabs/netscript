import type { VNode } from 'preact';
import { Badge } from '@app/components/ui/mod.ts';
import TokenClipboard from '../(_islands)/TokenClipboard.tsx';
import {
  colorRamps,
  type DesignToken,
  easeTokens,
  fontTokens,
  foundationTokens,
  leadingTokens,
  radiusTokens,
  type SemanticIntent,
  semanticIntents,
  shadowTokens,
  spaceTokens,
  textTokens,
  tokenManifestMeta,
  trackingTokens,
  zTokens,
} from '../(_shared)/tokens.ts';

const SECTIONS = [
  { id: 'roles', label: 'Roles' },
  { id: 'ramps', label: 'Ramps' },
  { id: 'type', label: 'Type' },
  { id: 'space', label: 'Space' },
  { id: 'radius', label: 'Radius' },
  { id: 'shadow', label: 'Shadow' },
  { id: 'motion', label: 'Motion' },
  { id: 'z', label: 'Z-scale' },
] as const;

const SPECIMEN = 'Pack my box with five dozen liquor jugs';

/** Copyable `var(--ns-*)` chip; TokenClipboard handles the click. */
function CopyVar({ token }: { token: DesignToken }): VNode {
  return (
    <button
      type='button'
      class='ns-token-copy'
      data-token-copy={`var(${token.cssVar})`}
      title={`Copy var(${token.cssVar})`}
    >
      {token.cssVar}
    </button>
  );
}

function TokenRow(
  { token, preview }: { token: DesignToken; preview: VNode },
): VNode {
  return (
    <div class='ns-token-row'>
      <div class='ns-token-row__preview'>{preview}</div>
      <CopyVar token={token} />
      <code class='ns-token-row__value'>{token.value}</code>
    </div>
  );
}

function SectionHeading(
  { id, title, lede }: { id: string; title: string; lede: string },
): VNode {
  return (
    <header class='ns-token-section__head'>
      <h2 id={id} class='ns-token-section__title'>{title}</h2>
      <p class='ns-token-section__lede'>{lede}</p>
    </header>
  );
}

function FoundationGrid(): VNode {
  return (
    <div class='ns-token-grid'>
      {foundationTokens.map((token) => (
        <TokenRow
          key={token.name}
          token={token}
          preview={
            <span
              class='ns-token-swatch'
              style={`background: var(${token.cssVar});`}
            />
          }
        />
      ))}
    </div>
  );
}

function IntentStrip({ intent }: { intent: SemanticIntent }): VNode | null {
  const base = intent.tokens.find((token) => token.name === intent.role);
  const fg = intent.tokens.find((token) => token.name === `${intent.role}-fg`);
  const rest = intent.tokens.filter((token) => token !== base && token !== fg);
  if (!base || !fg) return null;
  return (
    <div class='ns-token-intent'>
      <button
        type='button'
        class='ns-token-intent__hero'
        style={`background: var(${base.cssVar}); color: var(${fg.cssVar});`}
        data-token-copy={`var(${base.cssVar})`}
        title={`Copy var(${base.cssVar})`}
      >
        <strong>{intent.role}</strong>
        <code>{base.cssVar}</code>
      </button>
      <div class='ns-token-intent__companions'>
        {[fg, ...rest].map((token) => (
          <TokenRow
            key={token.name}
            token={token}
            preview={
              <span
                class='ns-token-swatch ns-token-swatch--sm'
                style={`background: var(${token.cssVar});`}
              />
            }
          />
        ))}
      </div>
    </div>
  );
}

function RampStrips(): VNode {
  return (
    <div class='ns-stack ns-stack--lg'>
      {colorRamps.map((ramp) => (
        <figure key={ramp.name} class='ns-token-ramp'>
          <figcaption class='ns-token-ramp__name'>
            {ramp.name}
            <span class='ns-token-ramp__range'>
              {ramp.steps[0]?.name.split('-').pop()}–{ramp.steps.at(-1)?.name.split('-').pop()}
            </span>
          </figcaption>
          <div class='ns-token-ramp__strip'>
            {ramp.steps.map((step) => (
              <button
                key={step.name}
                type='button'
                class='ns-token-ramp__step'
                style={`background: var(${step.cssVar});`}
                data-token-copy={`var(${step.cssVar})`}
                title={`${step.cssVar} · ${step.value}`}
              >
                <span class='ns-token-ramp__step-label'>{step.name.split('-').pop()}</span>
              </button>
            ))}
          </div>
        </figure>
      ))}
    </div>
  );
}

function TypeSpecimens(): VNode {
  return (
    <div class='ns-stack ns-stack--lg'>
      {fontTokens.map((token) => (
        <TokenRow
          key={token.name}
          token={token}
          preview={
            <span
              class='ns-token-type-specimen'
              style={`font-family: var(${token.cssVar});`}
            >
              {SPECIMEN}
            </span>
          }
        />
      ))}
      {textTokens.map((token) => (
        <TokenRow
          key={token.name}
          token={token}
          preview={
            <span
              class='ns-token-type-specimen'
              style={`font-size: var(${token.cssVar});`}
            >
              Scale {token.name.replace('text-', '')}
            </span>
          }
        />
      ))}
      {leadingTokens.map((token) => (
        <TokenRow
          key={token.name}
          token={token}
          preview={
            <span
              class='ns-token-type-paragraph'
              style={`line-height: var(${token.cssVar});`}
            >
              {SPECIMEN}, then wraps onto a second line to show its leading.
            </span>
          }
        />
      ))}
      {trackingTokens.map((token) => (
        <TokenRow
          key={token.name}
          token={token}
          preview={
            <span
              class='ns-token-type-specimen'
              style={`letter-spacing: var(${token.cssVar});`}
            >
              tracking
            </span>
          }
        />
      ))}
    </div>
  );
}

function SpaceBars(): VNode {
  return (
    <div class='ns-token-grid'>
      {spaceTokens.map((token) => (
        <TokenRow
          key={token.name}
          token={token}
          preview={
            <span class='ns-token-space-track'>
              <span
                class='ns-token-space-bar'
                style={`width: var(${token.cssVar});`}
              />
            </span>
          }
        />
      ))}
    </div>
  );
}

function RadiusTiles(): VNode {
  return (
    <div class='ns-token-tiles'>
      {radiusTokens.map((token) => (
        <TokenRow
          key={token.name}
          token={token}
          preview={
            <span
              class='ns-token-radius-tile'
              style={`border-radius: var(${token.cssVar});`}
            />
          }
        />
      ))}
    </div>
  );
}

function ShadowTiles(): VNode {
  return (
    <div class='ns-token-tiles'>
      {shadowTokens.map((token) => (
        <TokenRow
          key={token.name}
          token={token}
          preview={
            <span
              class='ns-token-shadow-tile'
              style={`box-shadow: var(${token.cssVar});`}
            />
          }
        />
      ))}
    </div>
  );
}

function MotionChips(): VNode {
  return (
    <div class='ns-token-tiles'>
      {easeTokens.map((token) => (
        <TokenRow
          key={token.name}
          token={token}
          preview={
            <span
              class='ns-token-motion-chip'
              style={`transition: transform var(${token.cssVar});`}
            >
              hover
            </span>
          }
        />
      ))}
    </div>
  );
}

function ZStack(): VNode {
  return (
    <div class='ns-token-zstack'>
      {zTokens.map((token, index) => (
        <button
          key={token.name}
          type='button'
          class='ns-token-zplate'
          style={`z-index: var(${token.cssVar}); --zplate-indent: ${index * 2.5}rem;`}
          data-token-copy={`var(${token.cssVar})`}
          title={`Copy var(${token.cssVar})`}
        >
          <code>{token.cssVar}</code>
          <span>{token.value}</span>
        </button>
      ))}
    </div>
  );
}

export default function DesignTokensView() {
  return (
    <main class='ns-tokens-page'>
      <TokenClipboard />

      <header class='ns-page-header'>
        <div class='ns-cluster ns-cluster--md'>
          <h1>Tokens</h1>
          <Badge variant='primary'>NS One</Badge>
          <Badge variant='muted'>manifest v{tokenManifestMeta.version}</Badge>
        </div>
        <p class='ns-lede'>
          The{' '}
          {tokenManifestMeta.total}-token vocabulary every component is allowed to speak. Swatches
          render from the live CSS variables, so this page always shows the active theme. Click any
          token to copy its variable.
        </p>
      </header>

      <div class='ns-tokens-layout'>
        <nav class='ns-tokens-rail' aria-label='Token sections'>
          {SECTIONS.map((section) => (
            <a key={section.id} href={`#${section.id}`} class='ns-tokens-rail__link'>
              {section.label}
            </a>
          ))}
        </nav>

        <div class='ns-tokens-sections'>
          <section class='ns-token-section'>
            <SectionHeading
              id='roles'
              title='Semantic roles'
              lede='What components consume. Surfaces, text, and borders first; the six intents below each pair a base with its fg, hover, subtle, and border companions.'
            />
            <FoundationGrid />
            <div class='ns-stack ns-stack--lg'>
              {semanticIntents.map((intent) => <IntentStrip key={intent.role} intent={intent} />)}
            </div>
          </section>

          <section class='ns-token-section'>
            <SectionHeading
              id='ramps'
              title='Primitive ramps'
              lede='Theme raw material. Semantic roles map onto these steps; components never reference a ramp directly.'
            />
            <RampStrips />
          </section>

          <section class='ns-token-section'>
            <SectionHeading
              id='type'
              title='Type'
              lede='Families, scale, leading, and tracking — each rendered at its own value.'
            />
            <TypeSpecimens />
          </section>

          <section class='ns-token-section'>
            <SectionHeading
              id='space'
              title='Space'
              lede='The spacing scale, drawn to size.'
            />
            <SpaceBars />
          </section>

          <section class='ns-token-section'>
            <SectionHeading
              id='radius'
              title='Radius'
              lede='Corner rounding, from subtle to full pill.'
            />
            <RadiusTiles />
          </section>

          <section class='ns-token-section'>
            <SectionHeading
              id='shadow'
              title='Shadow'
              lede='Elevation steps for raised surfaces and overlays.'
            />
            <ShadowTiles />
          </section>

          <section class='ns-token-section'>
            <SectionHeading
              id='motion'
              title='Motion'
              lede='Duration and easing pairs. Hover a chip to feel each curve.'
            />
            <MotionChips />
          </section>

          <section class='ns-token-section'>
            <SectionHeading
              id='z'
              title='Z-scale'
              lede='The stacking order contract: each layer sits exactly one plate above the last.'
            />
            <ZStack />
          </section>
        </div>
      </div>
    </main>
  );
}
