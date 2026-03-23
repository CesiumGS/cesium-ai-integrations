import json
import time
import traceback
from typing import Any

from openai import AsyncOpenAI

from evaluation.prompts import EVALUATION_PROMPT

REQUIRED_ENV_KEY = "OPENAI_API_KEY"


def _serialize_tool_result(tool_result: Any) -> str:
    """Serialize an MCP tool result to a plain string.

    MCP returns a list of content items (e.g. TextContent). Extract their .text
    directly instead of json.dumps, which cannot serialize Pydantic models.
    """
    if isinstance(tool_result, list):
        parts = []
        for item in tool_result:
            if hasattr(item, "text"):
                parts.append(item.text)
            else:
                try:
                    parts.append(json.dumps(item))
                except Exception:
                    parts.append(str(item))
        return "\n".join(parts)
    if isinstance(tool_result, dict):
        return json.dumps(tool_result)
    return str(tool_result)


def _to_responses_tools(tools: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Convert MCP tool definitions to OpenAI Responses API function format."""
    return [
        {
            "type": "function",
            "name": tool["name"],
            "description": tool.get("description", ""),
            "parameters": tool["input_schema"],
            "strict": False,
        }
        for tool in tools
    ]


async def agent_loop(
    client: AsyncOpenAI,
    model: str,
    question: str,
    tools: list[dict[str, Any]],
    connection: Any,
) -> tuple[str, dict[str, Any]]:
    """Run the agent loop with MCP tools using the OpenAI Responses API (stateless)."""
    responses_tools = _to_responses_tools(tools)
    tool_metrics: dict[str, Any] = {}

    # Build the full conversation input array incrementally (stateless — no previous_response_id)
    input_items: list[Any] = [{"role": "user", "content": question}]
    response = None

    while True:
        response = await client.responses.create(
            model=model,
            instructions=EVALUATION_PROMPT,
            input=input_items,
            tools=responses_tools,
        )

        function_calls = [item for item in response.output if item.type == "function_call"]
        if not function_calls:
            break

        # Append all output items to history so the next turn has context.
        # Reasoning models (o-series) require reasoning items to accompany
        # function_call items — omitting them causes a 400 error.
        # summary is always required on reasoning items (even as an empty list).
        for item in response.output:
            if item.type == "reasoning":
                summary = []
                if hasattr(item, "summary") and item.summary:
                    summary = [{"type": s.type, "text": s.text} for s in item.summary]
                input_items.append({"type": "reasoning", "id": item.id, "summary": summary})
            elif item.type == "function_call":
                input_items.append({
                    "type": "function_call",
                    "id": item.id,
                    "call_id": item.call_id,
                    "name": item.name,
                    "arguments": item.arguments,
                })

        # Execute tools and append results
        for call in function_calls:
            tool_name = call.name
            tool_input = json.loads(call.arguments)

            tool_start_ts = time.time()
            try:
                tool_result = await connection.call_tool(tool_name, tool_input)
                tool_response = _serialize_tool_result(tool_result)
            except Exception as e:
                tool_response = f"Error executing tool {tool_name}: {str(e)}\n"
                tool_response += traceback.format_exc()
            tool_duration = time.time() - tool_start_ts

            if tool_name not in tool_metrics:
                tool_metrics[tool_name] = {"count": 0, "durations": []}
            tool_metrics[tool_name]["count"] += 1
            tool_metrics[tool_name]["durations"].append(tool_duration)

            input_items.append({
                "type": "function_call_output",
                "call_id": call.call_id,
                "output": tool_response,
            })

    final_text = ""
    if response is not None:
        for item in response.output:
            if item.type == "message":
                for content in item.content:
                    if hasattr(content, "text"):
                        final_text += content.text

    return final_text, tool_metrics
