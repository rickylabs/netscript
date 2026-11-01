import { Button } from '../../packages/fresh-ui/registry/components/ui/button.tsx';
import { useState } from 'preact/hooks';
import { Resizable } from '../../packages/fresh-ui/registry/components/ui/resizable.tsx';
import { Direction } from '../../packages/fresh-ui/registry/components/ui/direction.tsx';

/** Real resize modes, controlled hosts and lifecycle changes. */
export function Resizables() {
  const [size, setSize] = useState(180);
  const [accept, setAccept] = useState(false);
  const [proposals, setProposals] = useState(0);
  const [lastProposal, setLastProposal] = useState(0);
  const [width, setWidth] = useState(560);
  const [mounted, setMounted] = useState(false);
  const [lifecycleDirection, setLifecycleDirection] = useState<'horizontal' | 'vertical'>(
    'horizontal',
  );
  const [geometryProposals, setGeometryProposals] = useState(0);
  return (
    <>
      <h2>Resizable examples</h2>
      <section id='resize-horizontal' aria-label='Horizontal resizing'>
        <Resizable
          label='Horizontal contents'
          style={{ width: 'min(560px, 100%)', height: 240 }}
          startContent={<Button type='button'>Open horizontal chapter</Button>}
          endContent={<a href='#horizontal-chapter'>Read horizontal chapter</a>}
        />
      </section>
      <section id='resize-vertical' aria-label='Vertical resizing'>
        <Resizable
          label='Vertical contents'
          direction='vertical'
          style={{ width: 'min(360px, 100%)', height: 320 }}
          startContent={<Button type='button'>Open vertical chapter</Button>}
          endContent={<a href='#vertical-chapter'>Read vertical chapter</a>}
        />
      </section>
      <section id='resize-rtl' aria-label='RTL resizing'>
        <Direction as='div' dir='rtl'>
          <Resizable
            label='RTL contents'
            style={{ width: 'min(560px, 100%)', height: 200 }}
            startContent='Primary'
            endContent='Secondary'
          />
        </Direction>
      </section>
      <section id='resize-plain' aria-label='Plain handle resizing'>
        <h3 id='plain-contents-title'>Plain contents</h3>
        <Resizable
          label='Fallback contents'
          labelledBy='plain-contents-title'
          grip={false}
          style={{ width: 'min(560px, 100%)', height: 180 }}
          startContent='Primary'
          endContent='Secondary'
        />
      </section>
      <section id='resize-controlled' aria-label='Controlled resizing'>
        <Button type='button' onClick={() => setAccept((v) => !v)}>Accept controlled sizes</Button>
        <Resizable
          label='Controlled contents'
          size={size}
          style={{ width: 'min(560px, 100%)', height: 180 }}
          startContent='Primary'
          endContent='Secondary'
          onSizeChange={(next) => {
            setProposals((n) => n + 1);
            setLastProposal(next);
            if (accept) setSize(next);
          }}
        />
        <output aria-label='Resize proposal count'>{proposals}</output>
        <output aria-label='Last resize proposal'>{lastProposal}</output>
      </section>
      <section id='resize-geometry' aria-label='Container resize'>
        <Button type='button' onClick={() => setWidth(120)}>Shrink resize container</Button>
        <Button type='button' onClick={() => setWidth(560)}>Restore resize container</Button>
        <div style={{ width, maxWidth: '100%' }}>
          <Resizable
            label='Adaptive contents'
            size={280}
            style={{ height: 180 }}
            startContent='Primary'
            endContent='Secondary'
            onSizeChange={() => setGeometryProposals((n) => n + 1)}
          />
        </div>
        <output aria-label='Geometry resize proposals'>{geometryProposals}</output>
      </section>
      <section id='resize-lifecycle' aria-label='Resize lifecycle'>
        <Button type='button' onClick={() => setMounted(true)}>Mount resize example</Button>
        <Button type='button' onClick={() => setMounted(false)}>Remove resize example</Button>
        <Button
          type='button'
          onClick={() =>
            setLifecycleDirection((v) => v === 'horizontal' ? 'vertical' : 'horizontal')}
        >
          Switch resize direction
        </Button>
        {mounted && (
          <Resizable
            label='Removable contents'
            direction={lifecycleDirection}
            style={{ width: 'min(560px, 100%)', height: 180 }}
            startContent='Primary'
            endContent='Secondary'
          />
        )}
      </section>
    </>
  );
}
