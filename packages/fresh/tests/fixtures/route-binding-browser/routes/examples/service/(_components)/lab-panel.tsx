import ServiceShowcaseLab, {
  type ServiceShowcaseLabProps,
} from '../../(_islands)/ServiceShowcaseLab.tsx';

/** Server layer matching the generated showcase's panel-to-island path. */
export function ServiceExampleLabPanel(props: ServiceShowcaseLabProps): object {
  return (
    <article id='service-showcase-layer'>
      <h1>Service showcase hydration fixture</h1>
      <ServiceShowcaseLab {...props} />
    </article>
  );
}
