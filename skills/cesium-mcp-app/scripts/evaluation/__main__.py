"""CLI entry point for the Cesium MCP App evaluation harness.

Run with:  python -m evaluation evaluation.xml
"""

import argparse
import asyncio
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

from connections import create_connection
from evaluation.runner import run_evaluation

load_dotenv()


def parse_headers(header_list: list[str]) -> dict[str, str]:
    """Parse header strings in format 'Key: Value' into a dictionary."""
    headers = {}
    if not header_list:
        return headers

    for header in header_list:
        if ":" in header:
            key, value = header.split(":", 1)
            headers[key.strip()] = value.strip()
        else:
            print(f"Warning: Ignoring malformed header: {header}")
    return headers


async def main():
    parser = argparse.ArgumentParser(
        description="Evaluate a Cesium MCP App using test questions",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Evaluate the default local Cesium MCP App (HTTP, port 3003)
  python -m evaluation evaluation.xml

  # Evaluate with a custom URL
  python -m evaluation evaluation.xml --url http://localhost:4000/mcp

  # Evaluate using SSE transport
  python -m evaluation evaluation.xml --transport sse --url http://localhost:3003/mcp

  # Save report to file
  python -m evaluation evaluation.xml --output report.md

  # Evaluate using Anthropic Claude (defaults to claude-opus-4-5)
  python -m evaluation evaluation.xml --model-provider anthropic

  # Use a specific Anthropic model
  python -m evaluation evaluation.xml --model-provider anthropic --model claude-opus-4-5
        """,
    )

    parser.add_argument("eval_file", type=Path, help="Path to evaluation XML file")
    parser.add_argument(
        "--transport",
        choices=["http", "sse"],
        default="http",
        help="MCP transport type (default: http)",
    )
    parser.add_argument(
        "--url",
        default="http://localhost:3003/mcp",
        help="MCP server URL (default: http://localhost:3003/mcp)",
    )
    parser.add_argument(
        "--header",
        nargs="+",
        dest="headers",
        metavar="KEY:VALUE",
        help="HTTP headers in 'Key: Value' format",
    )
    parser.add_argument(
        "--model-provider",
        choices=["openai", "anthropic"],
        default="openai",
        dest="model_provider",
        help="LLM provider to use (default: openai)",
    )
    parser.add_argument(
        "--model",
        default=None,
        help="Model name (default: gpt-4o for openai, claude-opus-4-5 for anthropic)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="Output file for evaluation report (default: stdout)",
    )

    args = parser.parse_args()

    if not args.eval_file.exists():
        print(f"Error: Evaluation file not found: {args.eval_file}")
        sys.exit(1)

    # Lazy provider import — only the chosen provider's package is required
    if args.model_provider == "anthropic":
        from anthropic import AsyncAnthropic  # noqa: PLC0415

        from evaluation.anthropic_eval import REQUIRED_ENV_KEY  # noqa: PLC0415
        from evaluation.anthropic_eval import agent_loop_anthropic as loop_fn  # noqa: PLC0415

        client = AsyncAnthropic()
    else:
        from openai import AsyncOpenAI  # noqa: PLC0415

        from evaluation.openai_eval import REQUIRED_ENV_KEY  # noqa: PLC0415
        from evaluation.openai_eval import agent_loop as loop_fn  # noqa: PLC0415

        openai_kwargs = {}
        if os.environ.get("OPENAI_URL"):
            openai_kwargs["base_url"] = os.environ["OPENAI_URL"]
        client = AsyncOpenAI(**openai_kwargs)

    if not os.environ.get(REQUIRED_ENV_KEY):
        print(
            f"⚠️  Skipping evaluation: {REQUIRED_ENV_KEY} is not set. "
            "Define it in a .env file or as an environment variable to run evaluations."
        )
        sys.exit(0)

    headers = parse_headers(args.headers) if args.headers else None

    connection = create_connection(transport=args.transport, url=args.url, headers=headers)

    print(f"🚀 Starting Cesium MCP App Evaluation")
    print(f"🤖 Provider: {args.model_provider} | Model: {args.model}")
    print(f"🔗 Connecting to Cesium MCP App at {args.url} via {args.transport}...")

    model = args.model
    if model is None:
        if args.model_provider == "openai":
            model = os.environ.get("OPENAI_MODEL", "gpt-5.4")
        else:
            model = "claude-opus-4-5"

    async with connection:
        print("✅ Connected successfully")
        report = await run_evaluation(args.eval_file, connection, model, loop_fn, client)

        if args.output:
            args.output.write_text(report, encoding="utf-8")
            print(f"\n✅ Report saved to {args.output}")
        else:
            print("\n" + report)


if __name__ == "__main__":
    asyncio.run(main())
