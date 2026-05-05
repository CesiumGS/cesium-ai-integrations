"""Anthropic-specific screenshot analysis for the Cesium MCP App evaluation harness."""

from typing import Any

from evaluation.prompts import VISION_BEFORE_AFTER_SYSTEM_PROMPT, VISION_SEQUENCE_SYSTEM_PROMPT, VISION_SYSTEM_PROMPT
from evaluation.visual_eval import _parse_vision_response, screenshot_to_base64


async def analyze_screenshot_anthropic(
    client: Any,
    screenshot_bytes: bytes,
    visual_question: str,
    model: str = "claude-opus-4-5",
) -> tuple[str, str | None]:
    """Analyze a screenshot with an Anthropic vision model.

    Args:
        client: AsyncAnthropic client instance.
        screenshot_bytes: PNG image bytes to analyze.
        visual_question: Question about what should be visible in the screenshot.
        model: Anthropic model supporting vision (default: claude-opus-4-5).

    Returns:
        (answer, explanation) — answer is True/False or a string value; explanation may be None.
    """
    b64 = screenshot_to_base64(screenshot_bytes)

    response = await client.messages.create(
        model=model,
        max_tokens=500,
        system=VISION_SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/png",
                            "data": b64,
                        },
                    },
                    {"type": "text", "text": visual_question},
                ],
            }
        ],
    )

    content = response.content[0].text if response.content else ""
    return _parse_vision_response(content)


async def analyze_screenshot_sequence_anthropic(
    client: Any,
    screenshot_sequence: list[tuple[bytes, str]],
    visual_question: str,
    model: str = "claude-opus-4-5",
) -> tuple[str | None, str | None]:
    """Analyze a sequence of labeled screenshots with an Anthropic vision model.

    All images are sent in a single request with labels so the model can reason
    about how the UI evolved across multiple tool calls.

    Args:
        client: AsyncAnthropic client instance.
        screenshot_sequence: Ordered list of (png_bytes, label) tuples.
            The first entry is the initial state; each subsequent entry is
            the state after a tool call, with a descriptive label.
        visual_question: Question about the cumulative result of the sequence.
        model: Anthropic model supporting vision (default: claude-opus-4-5).

    Returns:
        (answer, explanation) — answer is True/False or a string value; explanation may be None.
    """
    message_content: list[dict] = []
    for i, (png_bytes, label) in enumerate(screenshot_sequence):
        step_label = f"Screenshot {i + 1} ({label}):"
        message_content.append({"type": "text", "text": step_label})
        b64 = screenshot_to_base64(png_bytes)
        message_content.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": "image/png",
                "data": b64,
            },
        })
    message_content.append({"type": "text", "text": visual_question})

    response = await client.messages.create(
        model=model,
        max_tokens=600,
        system=VISION_SEQUENCE_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": message_content}],
    )

    raw = response.content[0].text if response.content else ""
    return _parse_vision_response(raw)


async def analyze_before_after_anthropic(
    client: Any,
    before_screenshot_bytes: bytes,
    after_screenshot_bytes: bytes,
    visual_question: str,
    model: str = "claude-opus-4-5",
) -> tuple[str | None, str | None]:
    """Analyze before/after screenshots with an Anthropic vision model.

    Both images are sent in a single request so the model can reason about
    what changed between the two states.

    Args:
        client: AsyncAnthropic client instance.
        before_screenshot_bytes: PNG image bytes captured before the tool call.
        after_screenshot_bytes: PNG image bytes captured after the tool call.
        visual_question: Question about how the view changes between before and after.
        model: Anthropic model supporting vision (default: claude-opus-4-5).

    Returns:
        (answer, explanation) — answer is True/False or a string value; explanation may be None.
    """
    b64_before = screenshot_to_base64(before_screenshot_bytes)
    b64_after = screenshot_to_base64(after_screenshot_bytes)

    response = await client.messages.create(
        model=model,
        max_tokens=500,
        system=VISION_BEFORE_AFTER_SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Image 1 (BEFORE the tool call):"},
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/png",
                            "data": b64_before,
                        },
                    },
                    {"type": "text", "text": "Image 2 (AFTER the tool call):"},
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/png",
                            "data": b64_after,
                        },
                    },
                    {"type": "text", "text": visual_question},
                ],
            }
        ],
    )

    content = response.content[0].text if response.content else ""
    return _parse_vision_response(content)
