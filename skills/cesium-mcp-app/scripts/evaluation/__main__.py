"""CLI entry point for the Cesium MCP App evaluation harness.

Run with:  python -m evaluation evaluation-text.xml
           python -m evaluation evaluation-text.xml --visual-file evaluation-visual.xml
"""

import argparse
import asyncio
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

from connections import create_connection
from evaluation.runner import parse_evaluation_file, run_evaluation

load_dotenv()


def prompt_eval_type(text_count: int, visual_count: int) -> str:
    """Interactively ask the user which evaluation type to run.

    Returns 'text', 'visual', or 'both'.  Falls back to 'both' in
    non-interactive (CI) mode.
    """
    if text_count == 0:
        return "visual"
    if visual_count == 0:
        return "text"

    if not sys.stdin.isatty():
        print("Non-interactive mode detected — running both text and visual tests.")
        return "both"

    print(f"\nEvaluation contains:")
    print(f"  [1] text   — {text_count} question(s)")
    print(f"  [2] visual — {visual_count} question(s)")
    print(f"  [3] both   (default)")

    while True:
        choice = input("\nWhich type do you want to run? [1/2/3, default: 3]: ").strip() or "3"
        if choice == "1":
            return "text"
        if choice == "2":
            return "visual"
        if choice == "3":
            return "both"
        print("Invalid choice. Please enter 1, 2, or 3.")


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
  # Text tests only (interactive prompt skipped — only text tasks present)
  python -m evaluation evaluation-text.xml

  # Visual tests only
  python -m evaluation evaluation-visual.xml --type visual \\
    --visual --resource-uri ui://my-app/mcp-app.html

  # Two separate files — harness prompts which type to run
  python -m evaluation evaluation-text.xml \\
    --visual-file evaluation-visual.xml \\
    --visual --resource-uri ui://my-app/mcp-app.html

  # Skip the interactive prompt: run only text
  python -m evaluation evaluation-text.xml --visual-file evaluation-visual.xml --type text

  # Skip the interactive prompt: run only visual
  python -m evaluation evaluation-text.xml --visual-file evaluation-visual.xml \\
    --type visual --visual --resource-uri ui://my-app/mcp-app.html

  # Evaluate with a custom URL
  python -m evaluation evaluation-text.xml --url http://localhost:4000/mcp

  # Save report to file
  python -m evaluation evaluation-text.xml --output report.md

  # Evaluate using Anthropic Claude (defaults to claude-opus-4-5)
  python -m evaluation evaluation-text.xml --model-provider anthropic

  # Visual evaluation using Anthropic for vision analysis
  python -m evaluation evaluation-text.xml --visual-file evaluation-visual.xml \\
    --visual --resource-uri ui://my-app/mcp-app.html --visual-provider anthropic

  # Single combined file (backward-compatible)
  python -m evaluation evaluation.xml --visual --resource-uri ui://my-app/mcp-app.html
        """,
    )

    parser.add_argument(
        "eval_file",
        type=Path,
        help="Path to evaluation XML file (text tasks, or a combined text+visual file)",
    )
    parser.add_argument(
        "--type",
        choices=["text", "visual", "both"],
        default=None,
        dest="eval_type",
        metavar="{text,visual,both}",
        help=(
            "Which evaluation type to run. "
            "Omit to be prompted interactively when both types are present."
        ),
    )
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

    # Visual evaluation arguments
    visual_group = parser.add_argument_group(
        "visual evaluation",
        "Render the MCP App UI in a headless browser and analyze screenshots with a vision model. "
        "Requires: pip install playwright && playwright install chromium",
    )
    visual_group.add_argument(
        "--visual",
        action="store_true",
        help='Enable visual evaluation for type="visual" QA pairs',
    )
    visual_group.add_argument(
        "--visual-file",
        type=Path,
        default=None,
        dest="visual_file",
        help=(
            "Path to a separate visual-only evaluation XML file. "
            "When provided, text tasks are read from eval_file and visual tasks "
            "are read from this file."
        ),
    )
    visual_group.add_argument(
        "--resource-uri",
        dest="resource_uri",
        default=None,
        help="MCP resource URI to read the app HTML from (e.g. ui://my-app/mcp-app.html)",
    )
    visual_group.add_argument(
        "--visual-provider",
        choices=["openai", "anthropic"],
        default=None,
        dest="visual_provider",
        help="Vision model provider for screenshot analysis (default: same as --model-provider)",
    )
    visual_group.add_argument(
        "--visual-model",
        default=None,
        dest="visual_model",
        help="Vision model name (default: gpt-4o for openai, claude-opus-4-5 for anthropic)",
    )
    visual_group.add_argument(
        "--screenshot-width",
        type=int,
        default=1280,
        dest="screenshot_width",
        help="Browser viewport width for screenshots (default: 1280)",
    )
    visual_group.add_argument(
        "--screenshot-height",
        type=int,
        default=800,
        dest="screenshot_height",
        help="Browser viewport height for screenshots (default: 800)",
    )

    args = parser.parse_args()

    if not args.eval_file.exists():
        print(f"Error: Evaluation file not found: {args.eval_file}")
        sys.exit(1)

    if args.visual_file and not args.visual_file.exists():
        print(f"Error: Visual evaluation file not found: {args.visual_file}")
        sys.exit(1)

    # Load QA pairs from the provided file(s) to determine which types are available.
    # When --visual-file is given, text pairs come from eval_file and visual pairs
    # come from visual_file.  Otherwise both types may exist in eval_file.
    qa_pairs_all = parse_evaluation_file(args.eval_file)
    if args.visual_file:
        qa_pairs_all += [
            p for p in parse_evaluation_file(args.visual_file) if p.get("type") == "visual"
        ]

    text_count = sum(1 for p in qa_pairs_all if p.get("type", "text") == "text")
    visual_count = sum(1 for p in qa_pairs_all if p.get("type") == "visual")

    # Determine which evaluation type(s) to run.
    if args.eval_type:
        eval_type = args.eval_type
    else:
        eval_type = prompt_eval_type(text_count, visual_count)

    # Guard: visual tasks require --visual + --resource-uri
    if eval_type in ("visual", "both") and visual_count > 0:
        if not args.visual:
            print(
                "Error: visual tasks selected but --visual is not set. "
                "Add --visual --resource-uri <URI> to enable visual evaluation."
            )
            sys.exit(1)

    print(f"\n▶  Running evaluation type: {eval_type}")

    if args.model_provider == "anthropic":
        from anthropic import AsyncAnthropic  # noqa: PLC0415

        from evaluation.anthropic.agent import REQUIRED_ENV_KEY  # noqa: PLC0415
        from evaluation.anthropic.agent import agent_loop_anthropic as loop_fn  # noqa: PLC0415

        client = AsyncAnthropic()
    else:
        from openai import AsyncOpenAI  # noqa: PLC0415

        from evaluation.openai.agent import REQUIRED_ENV_KEY  # noqa: PLC0415
        from evaluation.openai.agent import agent_loop as loop_fn  # noqa: PLC0415

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

    # Resolve visual evaluation settings — only when visual tasks will actually run
    visual_client = None
    visual_model: str | None = None
    vision_analyze_fn = None
    vision_compare_fn = None
    vision_sequence_fn = None

    if args.visual and eval_type in ("visual", "both"):
        if not args.resource_uri:
            print("Error: --resource-uri is required when --visual is specified.")
            sys.exit(1)

        visual_provider = args.visual_provider or args.model_provider
        raw_visual_model = args.visual_model

        if visual_provider == "anthropic":
            from anthropic import AsyncAnthropic  # noqa: PLC0415
            from evaluation.anthropic.visual import analyze_screenshot_anthropic  # noqa: PLC0415
            from evaluation.anthropic.visual import analyze_screenshot_sequence_anthropic  # noqa: PLC0415
            from evaluation.anthropic.visual import analyze_screenshots_anthropic  # noqa: PLC0415

            visual_client = AsyncAnthropic()
            visual_model = raw_visual_model or "claude-opus-4-5"
            vision_analyze_fn = analyze_screenshot_anthropic
            vision_compare_fn = analyze_screenshots_anthropic
            vision_sequence_fn = analyze_screenshot_sequence_anthropic
        else:
            from openai import AsyncOpenAI  # noqa: PLC0415
            from evaluation.openai.visual import analyze_screenshot_openai  # noqa: PLC0415
            from evaluation.openai.visual import analyze_screenshot_sequence_openai  # noqa: PLC0415
            from evaluation.openai.visual import analyze_screenshots_openai  # noqa: PLC0415

            vis_kwargs = {}
            if os.environ.get("OPENAI_URL"):
                vis_kwargs["base_url"] = os.environ["OPENAI_URL"]
            visual_client = AsyncOpenAI(**vis_kwargs)
            visual_model = raw_visual_model or "gpt-4o"
            vision_analyze_fn = analyze_screenshot_openai
            vision_compare_fn = analyze_screenshots_openai
            vision_sequence_fn = analyze_screenshot_sequence_openai

        print(f"📸 Visual evaluation enabled | Provider: {visual_provider} | Model: {visual_model}")

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
        screenshot_dir = args.output.parent if (args.visual and args.output) else None
        if screenshot_dir is not None:
            print(f"📁 Screenshots will be saved to: {screenshot_dir}")
        report = await run_evaluation(
            args.eval_file,
            connection,
            model,
            loop_fn,
            client,
            visual_client=visual_client,
            visual_model=visual_model,
            vision_analyze_fn=vision_analyze_fn,
            vision_compare_fn=vision_compare_fn,
            vision_sequence_fn=vision_sequence_fn,
            resource_uri=args.resource_uri if args.visual else None,
            screenshot_width=args.screenshot_width,
            screenshot_height=args.screenshot_height,
            screenshot_dir=screenshot_dir,
            eval_type=eval_type,
            extra_visual_file=args.visual_file,
        )

        if args.output:
            args.output.write_text(report, encoding="utf-8")
            print(f"\n✅ Report saved to {args.output}")
        else:
            print("\n" + report)


if __name__ == "__main__":
    asyncio.run(main())
