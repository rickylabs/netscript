import { Button, Card } from '@app/components/ui/mod.ts';

interface ExampleCard {
  readonly title: string;
  readonly href: string;
  readonly description: string;
  readonly status: string;
}

interface ExamplesViewProps {
  readonly examples: readonly ExampleCard[];
}

export default function ExamplesView({ examples }: ExamplesViewProps) {
  return (
    <div class='min-h-[calc(100vh-52px)] bg-ns-bg text-ns-fg'>
      <section class='ns-shell ns-section'>
        <div class='ns-stack ns-stack--md'>
          <div class='ns-stack ns-stack--xs'>
            <span class='ns-badge ns-badge--secondary w-fit'>Showcase routes</span>
            <h1 class='text-3xl font-semibold text-ns-fg sm:text-4xl'>Examples</h1>
            <p class='max-w-3xl text-sm leading-7 text-ns-muted-fg sm:text-base'>
              This landing page is the discovery surface for the scaffolded demos. Later rollout
              steps fill in the linked routes with service and telemetry examples.
            </p>
          </div>

          <div class='ns-grid'>
            {examples.map((example) => (
              <Card key={example.href} interactive>
                <Card.Header>
                  <Card.Title>{example.title}</Card.Title>
                  <Card.Description>{example.description}</Card.Description>
                </Card.Header>
                <Card.Body class='ns-stack ns-stack--sm text-sm text-ns-muted-fg'>
                  <span class='ns-badge ns-badge--secondary w-fit'>{example.status}</span>
                  <Button type='link' href={example.href} variant='outline' class='w-fit'>
                    Visit route
                  </Button>
                </Card.Body>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
