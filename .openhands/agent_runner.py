#!/usr/bin/env python3
"""Run an OpenHands SDK conversation from a prompt file."""

from __future__ import annotations

import os
import sys
from pathlib import Path

from openhands.sdk import Conversation, LLM, get_logger
from openhands.tools.preset.default import get_default_agent


logger = get_logger(__name__)


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: agent_runner.py <prompt-file>", file=sys.stderr)
        return 2

    prompt_path = Path(sys.argv[1])
    prompt = prompt_path.read_text(encoding="utf-8")

    api_key = os.getenv("LLM_API_KEY")
    if not api_key:
        print("LLM_API_KEY is required", file=sys.stderr)
        return 2

    llm_config: dict[str, object] = {
        "model": os.getenv("LLM_MODEL", "anthropic/claude-sonnet-4"),
        "api_key": api_key,
        "usage_id": "netscript-openhands-agent",
        "drop_params": True,
    }
    if os.getenv("LLM_BASE_URL"):
        llm_config["base_url"] = os.environ["LLM_BASE_URL"]

    agent = get_default_agent(
        llm=LLM(**llm_config),
        cli_mode=True,
    )
    conversation = Conversation(
        agent=agent,
        workspace=os.getcwd(),
    )

    logger.info("Starting OpenHands conversation from %s", prompt_path)
    conversation.send_message(prompt)
    conversation.run()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
