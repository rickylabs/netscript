#!/usr/bin/env python3
"""Run an OpenHands SDK conversation from a prompt file."""

from __future__ import annotations

import os
import sys
from pathlib import Path

from openhands.sdk import Conversation, LLM, get_logger
from openhands.tools.preset.default import get_default_agent


logger = get_logger(__name__)

SUMMARY_RETRY_PROMPT = (
    "You finished without writing the required run summary file at {path}. "
    "Write that file now as markdown with Summary, Changes, Validation, and "
    "Remaining risks sections, then stop. Describe ONLY work you actually "
    "performed and files you actually wrote in this run. If the task is "
    "incomplete, state that explicitly and list what remains; never describe "
    "intended or planned work as if it were done."
)

DEFAULT_MAX_ITERATIONS = 500


def summary_present(path: Path) -> bool:
    try:
        return path.is_file() and bool(path.read_text(encoding="utf-8").strip())
    except OSError:
        return False


def record_summary_source(path: Path, source: str) -> None:
    (path.parent / "summary-source.txt").write_text(source + "\n", encoding="utf-8")


def final_agent_message(conversation: Conversation) -> str:
    """Best-effort extraction of the last agent message; SDK event shape may drift."""
    try:
        events = list(getattr(conversation.state, "events", []) or [])
    except Exception as error:
        logger.warning("Could not read conversation events: %s", error)
        return ""
    texts: list[str] = []
    for event in events:
        if str(getattr(event, "source", "")) != "agent":
            continue
        message = getattr(event, "llm_message", None) or getattr(event, "message", None)
        content = getattr(message, "content", message)
        if isinstance(content, str):
            if content.strip():
                texts.append(content.strip())
        elif isinstance(content, (list, tuple)):
            parts = [str(getattr(part, "text", "") or "") for part in content]
            joined = "\n".join(part for part in parts if part.strip())
            if joined.strip():
                texts.append(joined.strip())
    return texts[-1] if texts else ""


def resolve_max_iterations() -> int:
    raw = os.getenv("OPENHANDS_MAX_ITERATIONS", "")
    try:
        value = int(raw)
    except ValueError:
        if raw:
            logger.warning("Ignoring non-integer OPENHANDS_MAX_ITERATIONS=%r", raw)
        return DEFAULT_MAX_ITERATIONS
    return max(50, min(value, 3000))


def hit_iteration_limit(conversation: Conversation) -> bool:
    """Detect the SDK's MaxIterationsReached error; event shape may drift."""
    try:
        events = list(getattr(conversation.state, "events", []) or [])
    except Exception as error:
        logger.warning("Could not read conversation events: %s", error)
        events = []
    for event in events:
        if str(getattr(event, "code", "")) == "MaxIterationsReached":
            return True
    status = str(getattr(conversation.state, "execution_status", "") or "")
    return status.lower().endswith("error")


def write_failure_summary(path: Path, max_iterations: int, message: str) -> None:
    """Truthful summary for runs cut off by the iteration limit.

    Never ask the agent to summarize after a cutoff: with its context gone it
    reliably describes intended work as done.
    """
    lines = [
        "# OpenHands Agent Summary — INCOMPLETE (iteration limit)",
        "",
        f"The agent hit the maximum iterations limit ({max_iterations}) before",
        "finishing the task. Any commits on the branch reflect partial work;",
        "treat claims of completed artifacts as unverified.",
        "",
        "Re-trigger with a narrower task or a higher `iterations=` value.",
        "",
    ]
    if message:
        lines += ["## Last agent message before cutoff", "", message, ""]
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines), encoding="utf-8")
    record_summary_source(path, "synthesized-after-iteration-limit")


def ensure_summary(conversation: Conversation) -> None:
    """Enforce the summary contract: the workflow reports only from this file."""
    raw_path = os.getenv("OPENHANDS_SUMMARY_PATH")
    if not raw_path:
        return
    path = Path(raw_path)
    if summary_present(path):
        record_summary_source(path, "agent")
        return

    logger.warning("Agent did not write %s; asking once more", path)
    try:
        conversation.send_message(SUMMARY_RETRY_PROMPT.format(path=path))
        conversation.run()
    except Exception as error:
        logger.warning("Summary retry turn failed: %s", error)
    if summary_present(path):
        record_summary_source(path, "agent-after-retry")
        return

    logger.warning("Agent still did not write %s; synthesizing from final message", path)
    message = final_agent_message(conversation)
    lines = [
        "# OpenHands Agent Summary",
        "",
        "_Synthesized by agent_runner: the agent completed without writing the",
        "summary file, including after one explicit retry._",
        "",
    ]
    if message:
        lines += ["## Final agent message", "", message, ""]
    else:
        lines += [
            "No final agent message could be recovered. Inspect agent.log in the",
            "Actions artifact and the commits on the branch for the actual outcome.",
            "",
        ]
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines), encoding="utf-8")
    record_summary_source(path, "synthesized")


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
    max_iterations = resolve_max_iterations()
    conversation = Conversation(
        agent=agent,
        workspace=os.getcwd(),
        max_iteration_per_run=max_iterations,
    )

    logger.info(
        "Starting OpenHands conversation from %s (max iterations %d)",
        prompt_path,
        max_iterations,
    )
    conversation.send_message(prompt)
    conversation.run()

    if hit_iteration_limit(conversation):
        logger.error("Run ended at the iteration limit; reporting failure")
        raw_path = os.getenv("OPENHANDS_SUMMARY_PATH")
        if raw_path:
            try:
                write_failure_summary(
                    Path(raw_path), max_iterations, final_agent_message(conversation)
                )
            except Exception as error:
                logger.warning("Failure summary write failed: %s", error)
        return 3

    try:
        ensure_summary(conversation)
    except Exception as error:
        logger.warning("Summary enforcement failed: %s", error)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
