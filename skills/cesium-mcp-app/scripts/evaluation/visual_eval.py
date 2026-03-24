"""Visual evaluation: render MCP App HTML resources in a headless browser and analyze with vision AI.

Usage overview:
1. Call `screenshot_mcp_resource(html)` to render initial UI state.
2. Call `screenshot_with_tool_input(html, tool_name, args)` to simulate a host posting a
   tool-input message to the app and capture the resulting UI.
3. Call `analyze_screenshot_openai` (evaluation.openai.visual) or
   `analyze_screenshot_anthropic` (evaluation.anthropic.visual) to ask a vision model
   a yes/no or descriptive question about the captured screenshot.

Prerequisites:
    pip install playwright && playwright install chromium

Limitations:
- CesiumJS 3D WebGL rendering may not work in all headless environments.
  Use `--use-gl=angle` (default here) for best compatibility.  Software fallback
  (--use-gl=swiftshader) is slower but broader.
- Tool-input simulation targets the `ontoolinput` pattern used by @modelcontextprotocol/ext-apps.
  The message payload `{ arguments: <tool_args> }` is sent via postMessage to the iframe.
  Adjust `_build_host_wrapper` if your app's ext-apps version uses a different envelope.
"""

import base64
import json
import re
from typing import Any

try:
    from playwright.async_api import async_playwright

    HAS_PLAYWRIGHT = True
except ImportError:
    HAS_PLAYWRIGHT = False

# ---------------------------------------------------------------------------
# Screenshot helpers
# ---------------------------------------------------------------------------

_DEFAULT_CHROMIUM_ARGS = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--use-gl=angle",
    "--enable-webgl",
    "--disable-web-security",  # allow srcdoc iframes to communicate cross-origin
]


async def screenshot_mcp_resource(
    html_content: str,
    width: int = 1280,
    height: int = 800,
    wait_ms: int = 3000,
    wait_selector: str | None = None,
) -> bytes:
    """Render an MCP App HTML resource in a headless browser and return a PNG screenshot.

    Args:
        html_content: Full HTML string of the MCP App resource.
        width: Viewport width in pixels.
        height: Viewport height in pixels.
        wait_ms: Milliseconds to wait after load before screenshotting (lets async JS settle).
        wait_selector: Optional CSS selector to wait for before screenshotting.

    Returns:
        PNG image bytes.
    """
    _require_playwright()

    async with async_playwright() as p:
        browser = await p.chromium.launch(args=_DEFAULT_CHROMIUM_ARGS)
        context = await browser.new_context(viewport={"width": width, "height": height})
        page = await context.new_page()

        await page.set_content(html_content, wait_until="domcontentloaded")

        if wait_selector:
            try:
                await page.wait_for_selector(wait_selector, timeout=10_000)
            except Exception:
                pass  # take screenshot even if selector never appears
        else:
            await page.wait_for_timeout(wait_ms)

        screenshot = await page.screenshot(type="png")
        await browser.close()
        return screenshot


async def screenshot_with_tool_input(
    html_content: str,
    tool_name: str,
    tool_args: dict[str, Any],
    width: int = 1280,
    height: int = 800,
    init_wait_ms: int = 2000,
    after_input_wait_ms: int = 2000,
) -> bytes:
    """Render an MCP App HTML, simulate a host tool-input message, and screenshot the result.

    The app HTML is embedded as a sandboxed iframe inside a thin host wrapper page.  After
    `init_wait_ms` the wrapper posts ``{ arguments: tool_args }`` to the iframe — matching the
    payload shape expected by ``app.ontoolinput`` in @modelcontextprotocol/ext-apps.

    Args:
        html_content: Full HTML string of the MCP App resource.
        tool_name: Tool name passed alongside arguments (informational; inspect ``app.getHostContext()``).
        tool_args: Dict of tool arguments (matches the tool's inputSchema).
        width: Viewport width in pixels.
        height: Viewport height in pixels.
        init_wait_ms: Time (ms) to let the app initialise before sending the tool-input message.
        after_input_wait_ms: Time (ms) to wait for the app to react after the message is sent.

    Returns:
        PNG image bytes.
    """
    _require_playwright()

    wrapper_html = _build_host_wrapper(html_content, tool_name, tool_args, init_wait_ms)
    total_wait = init_wait_ms + after_input_wait_ms + 500

    async with async_playwright() as p:
        browser = await p.chromium.launch(args=_DEFAULT_CHROMIUM_ARGS)
        context = await browser.new_context(viewport={"width": width, "height": height})
        page = await context.new_page()

        await page.set_content(wrapper_html, wait_until="domcontentloaded")
        await page.wait_for_timeout(total_wait)

        screenshot = await page.screenshot(type="png")
        await browser.close()
        return screenshot


def _build_host_wrapper(
    html_content: str,
    tool_name: str,
    tool_args: dict[str, Any],
    delay_ms: int,
) -> str:
    """Return a host page that embeds the MCP App as an iframe and posts a tool-input message."""
    # Escape for use as an HTML attribute value (srcdoc)
    escaped = (
        html_content.replace("&", "&amp;").replace('"', "&quot;").replace("'", "&#39;")
    )
    payload = json.dumps({"arguments": tool_args})

    return f"""<!doctype html>
<html><head>
  <style>
    html, body {{ margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }}
    iframe {{ width: 100%; height: 100%; border: none; display: block; }}
  </style>
</head><body>
  <iframe id="app" srcdoc="{escaped}"
    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"></iframe>
  <script>
    /* Simulate the MCP App host: after the app boots, send the tool-input message. */
    setTimeout(function() {{
      var frame = document.getElementById('app');
      if (frame && frame.contentWindow) {{
        frame.contentWindow.postMessage({payload}, '*');
      }}
    }}, {delay_ms});
  </script>
</body></html>"""


def screenshot_to_base64(screenshot_bytes: bytes) -> str:
    """Encode PNG bytes as a base64 string (for use in vision API calls)."""
    return base64.b64encode(screenshot_bytes).decode("utf-8")


async def screenshot_sequence(
    html_content: str,
    steps: list[dict],
    width: int = 1280,
    height: int = 800,
    init_wait_ms: int = 2000,
    between_steps_wait_ms: int = 1500,
) -> list[tuple[bytes, str]]:
    """Render an MCP App, capture the initial state, then dispatch each step and screenshot.

    Each step is dispatched via ``window.postMessage`` — matching how
    ``@modelcontextprotocol/ext-apps`` delivers tool calls to the app.

    Args:
        html_content: Full HTML string of the MCP App resource.
        steps: Ordered list of step dicts, each containing:
            - ``tool_name`` (str): Tool name for the postMessage envelope.
            - ``tool_args`` (dict): Arguments to include in the message payload.
            - ``description`` (str): Human-readable label for what should change.
        width: Viewport width in pixels.
        height: Viewport height in pixels.
        init_wait_ms: Time (ms) to wait after load before capturing the initial screenshot.
        between_steps_wait_ms: Time (ms) to wait after each postMessage before screenshotting.

    Returns:
        List of ``(png_bytes, label)`` tuples, one per state:
        - First entry is the initial state: ``(screenshot, "initial state")``.
        - Each subsequent entry is the post-step state: ``(screenshot, step description)``.
    """
    _require_playwright()

    results: list[tuple[bytes, str]] = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(args=_DEFAULT_CHROMIUM_ARGS)
        context = await browser.new_context(viewport={"width": width, "height": height})
        page = await context.new_page()

        await page.set_content(html_content, wait_until="domcontentloaded")
        await page.wait_for_timeout(init_wait_ms)

        # Initial state
        initial_bytes = await page.screenshot(type="png")
        results.append((initial_bytes, "initial state"))

        for step in steps:
            payload = json.dumps({"arguments": step.get("tool_args", {})})
            await page.evaluate(f"window.postMessage({payload}, '*')")
            await page.wait_for_timeout(between_steps_wait_ms)
            step_bytes = await page.screenshot(type="png")
            label = step.get("description") or step.get("tool_name") or f"step {len(results)}"
            results.append((step_bytes, label))

        await browser.close()

    return results


async def screenshot_before_and_after(
    html_content: str,
    tool_name: str,
    tool_args: dict[str, Any],
    width: int = 1280,
    height: int = 800,
    init_wait_ms: int = 2000,
    after_input_wait_ms: int = 2000,
) -> tuple[bytes, bytes]:
    """Render an MCP App, capture a before screenshot, simulate a tool-input, capture after.

    The tool-input is dispatched via ``window.postMessage`` directly to the page —
    matching how ``@modelcontextprotocol/ext-apps`` delivers tool calls to the app.
    No iframe wrapper is used; the app HTML runs as the top-level page so the
    postMessage reaches ``window`` directly.

    Args:
        html_content: Full HTML string of the MCP App resource.
        tool_name: Tool name passed in the message envelope (informational).
        tool_args: Dict of tool arguments (matches the tool's inputSchema).
        width: Viewport width in pixels.
        height: Viewport height in pixels.
        init_wait_ms: Time (ms) to let the app initialise before the before screenshot.
        after_input_wait_ms: Time (ms) to wait for the app to react after the message.

    Returns:
        (before_bytes, after_bytes) — PNG image bytes for each state.
    """
    _require_playwright()

    async with async_playwright() as p:
        browser = await p.chromium.launch(args=_DEFAULT_CHROMIUM_ARGS)
        context = await browser.new_context(viewport={"width": width, "height": height})
        page = await context.new_page()

        await page.set_content(html_content, wait_until="domcontentloaded")
        await page.wait_for_timeout(init_wait_ms)

        before_bytes = await page.screenshot(type="png")

        payload = json.dumps({"arguments": tool_args})
        await page.evaluate(f"window.postMessage({payload}, '*')")

        await page.wait_for_timeout(after_input_wait_ms)
        after_bytes = await page.screenshot(type="png")

        await browser.close()

    return before_bytes, after_bytes


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _parse_vision_response(content: str) -> tuple[str | None, str | None]:
    """Extract answer and explanation from a vision model response.

    Expects the model to use::

        <answer>True</answer>
        <explanation>One or two sentences.</explanation>

    Returns:
        (answer, explanation) — either may be None if the tag is absent.
    """
    answer_match = re.search(r"<answer>(.*?)</answer>", content, re.DOTALL)
    explanation_match = re.search(r"<explanation>(.*?)</explanation>", content, re.DOTALL)
    answer = answer_match.group(1).strip() if answer_match else None
    explanation = explanation_match.group(1).strip() if explanation_match else None
    return answer, explanation


def _require_playwright() -> None:
    if not HAS_PLAYWRIGHT:
        raise RuntimeError(
            "playwright is required for visual evaluation.\n"
            "Install it with:\n"
            "  pip install playwright\n"
            "  playwright install chromium"
        )
