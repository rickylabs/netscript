# Targeted install fixture

Maintainer init requires a generated project beneath the checkout. A --no-aspire project currently cannot install plugins because installation regenerates Aspire helpers; use a scaffolded AppHost for an install-only fixture, without restoring or starting it. Keep this separate from the coordinator-owned full scaffold.runtime gate.
