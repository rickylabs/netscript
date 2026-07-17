# Auth Sessions — component rethink

## Design question

What components make principal identity, session expiry, and granted authority scannable without
inventing a security score?

Auth Sessions is an identity roster ordered against a temporal expiry horizon. Selecting a
principal reveals exact provider/device/location facts, granted scopes, lifecycle events, and one
real elapsed-versus-remaining TTL proportion.

## Anchor references

- `07-chat-signin.png`: identity-first account treatment and restrained provider facts.
- `05-timeoff-workhour-cards.png`: time-remaining analysis and ordered temporal records.

## Component decisions

- Reduced the header to active-session facts plus the real expiry horizon; removed elevated/MFA
  score meters and the multicolor status channel.
- Rebuilt the roster as contiguous selectable records with initials avatars and squarish DM Mono
  provider/scope labels.
- Removed per-status colored borders, icon badges, and rainbow TTL styling; expiry position carries
  urgency.
- Kept one selected-session TTL lifespan with hatched elapsed time, a now marker, and copper
  remaining time.
- Flattened the detail pane to one Card with internal definition-list and lifecycle hairlines.

## Self-verification

Playwright CLI captured main, alternate selected session, dark, and 390px mobile states in
`auth-sessions-refix-shots/`. Zero rendered holes, console errors, and horizontal overflow were
found.
