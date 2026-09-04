# Environment facts you cannot discover from inside, and the design guidance

## 1. Docker is a remote daemon. This is why your ports are unreachable.

`DOCKER_HOST=tcp://netscript-dind:2375`. Containers do **not** run in your container — they run
inside a separate Docker-in-Docker host. Aspire publishes container ports bound to `127.0.0.1`
**inside that dind host**, so:

- `localhost:<port>` from your shell reaches nothing.
- The container bridge IPs (`172.18.0.x`) are inside dind and are not routable from here.
- `netscript-dind:<published port>` is also closed, because the binding is `127.0.0.1`, not
  `0.0.0.0`.

This is an environment topology fact, not a NetScript or Aspire defect. **Do not record it as a
framework defect**, and do not spend more time probing it.

**Proven workaround** (verified by the supervisor before being handed to you): run a forwarder
inside the dind host on its host network, then reach it by hostname.

```bash
# publish 127.0.0.1:<dind-port> out onto the dind host's interfaces as <new-port>
docker run -d --name fwd-pg --network host alpine/socat \
  TCP-LISTEN:<new-port>,fork,reuseaddr TCP:127.0.0.1:<dind-port>
# then connect from your container to netscript-dind:<new-port>
```

Verified working: a forwarder for the Postgres container made `netscript-dind:39379` reachable when
`localhost:29379` and the bridge IP both failed. Use a distinct `<new-port>` per service, name every
forwarder you create, and remove the ones you created when you are done. Point your app's connection
string at `netscript-dind:<new-port>`.

If a service only needs to be reached by *other containers*, it does not need a forwarder at all —
containers reach each other over the dind bridge normally.

## 2. Design guidance — build it the way a design team would

Two practices worth adopting wholesale, adapted from how Vercel teaches its agents product design.

### Write a `DESIGN.md` in your repository, and build against it

Not a style description — a decision record with **observable, testable rules**. The failure it
prevents is real: given only prose like "keep the layout clean", every model interprets it
differently and invents its own typography, spacing and layout.

Give it: who the reader is and what they came to do; the hierarchy and typography rules; the
bounded vocabulary of tokens and components available; and — importantly — **the recurring
generated-design patterns you never want to see**, named explicitly so you can avoid them by
reference.

**Write rules that can be checked, never adjectives.** Not "buttons should be clear" but a rule
like *"Destructive actions use Verb + Noun; never `Confirm`, `OK`, or a bare verb."* If a rule
cannot fail, it is decoration.

Three layers, deliberately separated: prose judgment in `DESIGN.md`; a bounded token and component
vocabulary so nothing invents ad-hoc styling; and deterministic checks for whatever a machine can
decide without rendering.

### The operating contract

1. **Start with the job, not the pixels.** Before proposing UI, write the decision: who the user is,
   the job, current behaviour, desired outcome, success signal, non-goals, the object being acted
   on, the action, its consequence, whether it is reversible, and who is permitted to do it. For a
   billing product every one of those has a real answer, and getting them wrong is what makes
   finance software feel dangerous.
2. **Define the outcome before the output.**
3. **Use evidence, not taste.** Treat shipped code as evidence, not precedent — it proves what
   exists, not that it is correct.
4. **Design every reachable state.** This is the one that separates a demo from a product, and in
   this domain it is the whole game: draft, issued, paid, part-paid, failed, retrying, refunded,
   partially refunded, voided, in-flight, empty, loading, permission-denied, stale. A screen that
   only renders the happy path is unfinished.
5. **Verify the real surface** — rendered, in a browser, not by reading your own source.

### Before you call any screen done

Check compact and wide viewports; exercise every materially changed state; verify keyboard order,
focus movement and loading behaviour; and test long content, **large values**, constrained width and
localization risk. Money formatting at large magnitudes is a real failure mode in this domain.
