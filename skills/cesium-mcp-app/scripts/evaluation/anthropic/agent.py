"""Anthropic-specific agent loop for the Cesium MCP App evaluation harness."""

import json
import time
import traceback
from typing import Any

from anthropic import AsyncAnthropic

from evaluation.prompts import EVALUATION_PROMPT

REQUIRED_ENV_KEY = "ANTHROPIC_API_KEY"


def _to_anthropic_tools(tools: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Convert MCP tool definitions to Anthropic tool format."""
    return [
        {
            "name": tool["name"],
            "description": tool.get("description", ""),
            "input_schema": tool["input_schema"],
        }
        for tool in tools
    ]


async def agent_loop_anthropic(
    client: AsyncAnthropic,
    model: str,
    question: str,
    tools: list[dict[str, Any]],
    connection: Any,
) -> tuple[str, dict[str, Any]]:
    """Run the agent loop with MCP tools (Anthropic)."""
    anthropic_tools = _to_anthropic_tools(tools)
    messages: list[Any] = [
        {"role": "user", "content": question},
    ]

    response = await client.messages.create(
        model=model,
        max_tokens=4096,
        system=EVALUATION_PROMPT,
        messages=messages,
        tools=anthropic_tools,
    )

    tool_metrics: dict[str, Any] = {}

    while response.stop_reason == "tool_use":
        tool_use_blocks = [b for b in response.content if b.type == "tool_use"]
        messages.append({"role": "assistant", "content": response.content})

        tool_results = []
        for tool_use in tool_use_blocks:
            tool_name = tool_use.name
            tool_input = tool_use.input

            tool_start_ts = time.time()
            try:
                tool_result = await connection.call_tool(tool_name, tool_input)
                tool_response = json.dumps(tool_result) if isinstance(tool_result, (dict, list)) else str(tool_result)
            except Exception as e:
                tool_response = f"Error executing tool {tool_name}: {str(e)}\n"
                tool_response += traceback.format_exc()
            tool_duration = time.time() - tool_start_ts

            if tool_name not in tool_metrics:
                tool_metrics[tool_name] = {"count": 0, "durations": []}
            tool_metrics[tool_name]["count"] += 1
            tool_metrics[tool_name]["durations"].append(tool_duration)

            tool_results.append({
                "type": "tool_result",
                "tool_use_id": tool_use.id,
                "content": tool_response,
            })

        messages.append({"role": "user", "content": tool_results})

        response = await client.messages.create(
            model=model,
            max_tokens=4096,
            system=EVALUATION_PROMPT,
            messages=messages,
            tools=anthropic_tools,
        )

    response_text = "".join(b.text for b in response.content if b.type == "text")
    return response_text, tool_metrics
