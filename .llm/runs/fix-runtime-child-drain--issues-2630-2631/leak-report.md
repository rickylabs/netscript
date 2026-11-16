# Resource inspection

Ran the repository teardown preview without --apply. No commands were planned and no foreign or unknown-owner resource was mutated. The reporter found unrelated resources; their operator identities and paths are omitted under the public-repository restriction. The lane owns its Redis test container through the creation receipt, exact container identity, run label and repository bind mount; cleanup verifies those proofs immediately before removal.
