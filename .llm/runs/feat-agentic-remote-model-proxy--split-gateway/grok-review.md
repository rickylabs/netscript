# OpenCode / Grok 4.5 Adversarial Review

- Session: OpenCode + OpenRouter `x-ai/grok-4.5`, variant `high`, 2026-08-05
- Generator: separate from this evaluator session
- Verdict: `FAIL_RESCOPE`

## Blocking findings

1. Claude 2.1.222 rejects `claude remote-control` before any request when
   `ANTHROPIC_BASE_URL` is loopback.
2. Interactive `--remote-control` can remain alive and run OpenRouter inference without creating a
   `bridgeSessionId`; process survival is not attachment evidence.
3. HTTPS CONNECT cannot path-route encrypted requests without TLS termination. A trusted local
   root, binary patch, OAuth leak, or provider-managed-host mode is outside the security contract.
4. The task/module names and original plan therefore overstated an impossible current capability.

## Non-blocking review

- Credential boundary, SSRF/listener exposure, streaming response forwarding, cleanup, and tested
  argv shapes were sound for an inference-only launcher.
- Add a request body limit, trailing-slash route test, and explicit unsupported classification.
- Design named an audit port that was not implemented; remove the speculative claim rather than
  introduce unused evidence machinery.

## Required rescope

Ship the gateway only as an inference-only OpenRouter launcher, explicitly reject Remote Control,
and document that alternate inference cannot be mobile-visible on Claude Code 2.1.196+.
