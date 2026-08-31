# Drift Log: background-reference startup preflight documentation

## 2026-08-30 — Conditional preflight described as unconditional

- **Observed drift:** the public page, research, plan, and PR body said the generated AppHost
  preflights every declared reference and treated every declaration as required configuration
  without qualification.
- **Source reality:** `generate-register-background.ts` places the entire per-processor block,
  including reference preflight and registration, inside
  `config.BackgroundProcessors['<name>']?.Enabled !== false`. A processor explicitly configured
  with `Enabled: false` is skipped wholesale, so its declared references are not preflighted.
- **Detection:** an external `augmentcode[bot]` inline review raised the mismatch independently;
  the supervisor-dispatched formal IMPL-EVAL at `d5ba40eb` confirmed it as blocking finding B1.
- **Class:** conditional behavior stated as unconditional—the same defect class as the earlier
  permission-wording defect in this lane.
- **Resolution:** narrow every repeated claim to processors that are not explicitly disabled,
  preserve the verified exact message templates, regenerate the complete derived chain, and send
  the repaired head to a fresh supervisor-dispatched formal IMPL-EVAL.
- **Architecture debt:** none; the inaccurate claim is fixed in this repair.
