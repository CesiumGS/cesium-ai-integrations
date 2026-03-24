"""Core evaluation logic for the Cesium MCP App evaluation harness."""

import json
import re
import time
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any


def parse_evaluation_file(file_path: Path) -> list[dict[str, Any]]:
    """Parse XML evaluation file with qa_pair elements.

    Supports two qa_pair types:

    Text tasks (default, ``type`` attribute absent or ``type="text"``):

    .. code-block:: xml

        <qa_pair>
          <question>What is the default camera heading?</question>
          <answer>270</answer>
        </qa_pair>

    Visual tasks (``type="visual"``) — two workflow modes:

    **Single screenshot** (default, ``workflow`` absent or ``workflow="single"``):

    .. code-block:: xml

        <qa_pair type="visual">
          <!-- Optional: call a tool first to set server state -->
          <tool>isolate-category</tool>
          <tool_input>{"category": "Walls"}</tool_input>
          <!-- Question sent to a vision model with the screenshot -->
          <visual_question>Does the UI show a dark-themed 3D viewer container?</visual_question>
          <answer>True</answer>
        </qa_pair>

    **Before/after comparison** (``workflow="before_after"``):
    Captures a screenshot before the tool-input message is sent and one after,
    then asks the vision model to compare both images.

    .. code-block:: xml

        <qa_pair type="visual" workflow="before_after">
          <!-- Required: the tool whose effect is being compared -->
          <tool>set-category-color</tool>
          <tool_input>{"category": "Walls", "color": "#FF0000"}</tool_input>
          <visual_question>Does the color of any visible elements change after the tool call?</visual_question>
          <answer>True</answer>
        </qa_pair>

    **Multi-step sequence** (``workflow="sequence"``):
    Renders the initial state, dispatches each ``<step>`` in order via
    ``window.postMessage``, screenshots after each step, then sends all images
    (labelled with the step descriptions) to the vision model.
    Use this to test cumulative effects and ordering that cannot be captured by
    a single before/after pair.

    .. code-block:: xml

        <qa_pair type="visual" workflow="sequence">
          <step>
            <tool>set-category-color</tool>
            <tool_input>{"category": "Walls", "color": "#FF0000"}</tool_input>
            <description>Walls should turn red</description>
          </step>
          <step>
            <tool>isolate-category</tool>
            <tool_input>{"category": "Walls"}</tool_input>
            <description>Only walls should remain visible</description>
          </step>
          <visual_question>Are only red walls visible in the final scene?</visual_question>
          <answer>True</answer>
        </qa_pair>
    """
    try:
        tree = ET.parse(file_path)
        root = tree.getroot()
        evaluations = []

        for qa_pair in root.findall(".//qa_pair"):
            pair_type = (qa_pair.get("type") or "text").strip().lower()
            answer_elem = qa_pair.find("answer")
            if answer_elem is None:
                continue
            answer = (answer_elem.text or "").strip()

            if pair_type == "visual":
                visual_q_elem = qa_pair.find("visual_question")
                tool_elem = qa_pair.find("tool")
                tool_input_elem = qa_pair.find("tool_input")
                if visual_q_elem is not None:
                    tool_input_raw = (tool_input_elem.text or "").strip() if tool_input_elem is not None else None
                    tool_args: dict[str, Any] | None = None
                    if tool_input_raw:
                        try:
                            tool_args = json.loads(tool_input_raw)
                        except json.JSONDecodeError:
                            pass
                    pair_workflow = (qa_pair.get("workflow") or "single").strip().lower()

                    # Parse ordered <step> elements for sequence workflow
                    steps: list[dict[str, Any]] = []
                    for step_elem in qa_pair.findall("step"):
                        step_tool_elem = step_elem.find("tool")
                        step_input_elem = step_elem.find("tool_input")
                        step_desc_elem = step_elem.find("description")
                        step_args: dict[str, Any] = {}
                        if step_input_elem is not None and step_input_elem.text:
                            try:
                                step_args = json.loads(step_input_elem.text.strip())
                            except json.JSONDecodeError:
                                pass
                        steps.append({
                            "tool_name": (step_tool_elem.text or "").strip() if step_tool_elem is not None else "",
                            "tool_args": step_args,
                            "description": (step_desc_elem.text or "").strip() if step_desc_elem is not None else "",
                        })

                    evaluations.append({
                        "type": "visual",
                        "workflow": pair_workflow,
                        "visual_question": (visual_q_elem.text or "").strip(),
                        "setup_tool": (tool_elem.text or "").strip() if tool_elem is not None else None,
                        "setup_tool_args": tool_args,
                        "steps": steps,
                        "answer": answer,
                    })
            else:
                question_elem = qa_pair.find("question")
                if question_elem is not None:
                    evaluations.append({
                        "type": "text",
                        "question": (question_elem.text or "").strip(),
                        "answer": answer,
                    })

        return evaluations
    except Exception as e:
        print(f"Error parsing evaluation file {file_path}: {e}")
        return []


def extract_xml_content(text: str, tag: str) -> str | None:
    """Extract content from XML tags."""
    pattern = rf"<{tag}>(.*?)</{tag}>"
    matches = re.findall(pattern, text, re.DOTALL)
    return matches[-1].strip() if matches else None


async def evaluate_single_task(
    client: Any,
    model: str,
    qa_pair: dict[str, Any],
    tools: list[dict[str, Any]],
    connection: Any,
    task_index: int,
    loop_fn: Any,
) -> dict[str, Any]:
    """Evaluate a single text QA pair with the given tools."""
    start_time = time.time()

    question = qa_pair.get("question", "")
    print(f"Task {task_index + 1}: {question}")
    response, tool_metrics = await loop_fn(client, model, question, tools, connection)

    response_value = extract_xml_content(response, "response") if response is not None else None
    summary = extract_xml_content(response, "summary") if response is not None else None
    feedback = extract_xml_content(response, "feedback") if response is not None else None

    duration_seconds = time.time() - start_time

    return {
        "type": "text",
        "question": question,
        "expected": qa_pair["answer"],
        "actual": response_value,
        "score": int(response_value is not None and response_value.strip().lower() == qa_pair["answer"].strip().lower()),
        "total_duration": duration_seconds,
        "tool_calls": tool_metrics,
        "num_tool_calls": sum(len(metrics["durations"]) for metrics in tool_metrics.values()),
        "summary": summary,
        "feedback": feedback,
    }


async def evaluate_single_visual_task(
    client: Any,
    vision_model: str,
    qa_pair: dict[str, Any],
    connection: Any,
    task_index: int,
    vision_analyze_fn: Any,
    resource_uri: str,
    screenshot_width: int = 1280,
    screenshot_height: int = 800,
    screenshot_dir: Path | None = None,
    vision_compare_fn: Any | None = None,
    vision_sequence_fn: Any | None = None,
) -> dict[str, Any]:
    """Evaluate a single visual QA pair by rendering the MCP App UI and analyzing it.

    Supports three workflow modes controlled by ``qa_pair["workflow"]``:

    ``"single"`` (default):
      1. Optionally call a setup tool to place the server in the desired state.
      2. Fetch the HTML resource from the MCP server.
      3. Render in a headless browser and capture one screenshot.
      4. Ask the vision model a question about that screenshot.
      5. Compare the answer to the expected answer.

    ``"before_after"``:
      1. Fetch the HTML resource from the MCP server.
      2. Render the app and capture a *before* screenshot (initial state).
      3. Dispatch the tool-input via ``window.postMessage`` and capture an *after* screenshot.
      4. Ask the vision model to compare both images.
      5. Compare the answer to the expected answer.

    ``"sequence"``:
      1. Fetch the HTML resource from the MCP server.
      2. Render and capture an *initial* screenshot.
      3. Dispatch each ``<step>``\'s tool-input via ``window.postMessage`` in order,
         capturing a screenshot after each.
      4. Send all labeled screenshots to the vision model.
      5. Compare the answer to the expected answer.

    Args:
        client: Vision API client (AsyncOpenAI or AsyncAnthropic).
        vision_model: Model name to use for image analysis.
        qa_pair: Visual QA pair dict (type, workflow, visual_question, setup_tool,
            setup_tool_args, steps, answer).
        connection: Active MCPConnection instance.
        task_index: 0-based index for display purposes.
        vision_analyze_fn: Single-image analyze function.
        resource_uri: MCP resource URI to read the app HTML from.
        screenshot_width: Browser viewport width.
        screenshot_height: Browser viewport height.
        screenshot_dir: Optional directory to save screenshots for manual review.
        vision_compare_fn: Before/after compare function. Required for ``workflow="before_after"``.
        vision_sequence_fn: Multi-image sequence function. Required for ``workflow="sequence"``.
    """
    from evaluation.visual_eval import (
        screenshot_before_and_after,
        screenshot_mcp_resource,
        screenshot_sequence,
        screenshot_with_tool_input,
    )

    question_label = qa_pair.get("visual_question", "")
    workflow = (qa_pair.get("workflow") or "single").strip().lower()
    print(f"Visual Task {task_index + 1} [{workflow}]: {question_label}")
    start_time = time.time()

    explanation: str | None = None
    actual: str | None = None
    setup_error: str | None = None
    setup_tool_metrics: dict[str, Any] = {}
    screenshot_path: Path | None = None

    try:
        setup_tool = qa_pair.get("setup_tool")
        setup_args = qa_pair.get("setup_tool_args") or {}

        # Fetch the app HTML from the MCP server (required for all workflows)
        html_content = await _read_resource_html(connection, resource_uri)

        if workflow == "sequence":
            # ------------------------------------------------------------------
            # Multi-step sequence workflow
            # ------------------------------------------------------------------
            steps = qa_pair.get("steps") or []
            if not steps:
                raise ValueError(
                    "workflow='sequence' requires at least one <step> element in the qa_pair."
                )
            if vision_sequence_fn is None:
                raise ValueError(
                    "workflow='sequence' requires vision_sequence_fn. "
                    "Make sure --visual is enabled."
                )

            seq = await screenshot_sequence(
                html_content,
                steps=steps,
                width=screenshot_width,
                height=screenshot_height,
            )

            if screenshot_dir is not None:
                screenshot_dir.mkdir(parents=True, exist_ok=True)
                for s_idx, (s_bytes, s_label) in enumerate(seq):
                    safe_label = re.sub(r"[^\w\-]", "_", s_label)[:40]
                    s_path = screenshot_dir / f"screenshot_{task_index + 1}_seq{s_idx}_{safe_label}.png"
                    s_path.write_bytes(s_bytes)
                screenshot_path = screenshot_dir / f"screenshot_{task_index + 1}_seq{len(seq) - 1}_{re.sub(r'[^\w\-]', '_', seq[-1][1])[:40]}.png"
                print(f"  📷 {len(seq)} screenshots saved for sequence task")

            actual, explanation = await vision_sequence_fn(
                client, seq, question_label, vision_model
            )

        elif workflow == "before_after":
            # Capture before/after screenshots around a client-side postMessage.
            # The tool is NOT called via MCP; it is dispatched via window.postMessage
            # so we can observe the visual state both before and after.
            if not setup_tool:
                raise ValueError(
                    "workflow='before_after' requires a <tool> element in the qa_pair."
                )
            if vision_compare_fn is None:
                raise ValueError(
                    "workflow='before_after' requires vision_compare_fn. "
                    "Make sure --visual is enabled and the provider supports multi-image analysis."
                )

            before_bytes, after_bytes = await screenshot_before_and_after(
                html_content,
                tool_name=setup_tool,
                tool_args=setup_args,
                width=screenshot_width,
                height=screenshot_height,
            )

            if screenshot_dir is not None:
                screenshot_dir.mkdir(parents=True, exist_ok=True)
                before_path = screenshot_dir / f"screenshot_{task_index + 1}_before.png"
                after_path = screenshot_dir / f"screenshot_{task_index + 1}_after.png"
                before_path.write_bytes(before_bytes)
                after_path.write_bytes(after_bytes)
                print(f"  📷 Screenshots saved: {before_path.name}, {after_path.name}")
                screenshot_path = after_path

            actual, explanation = await vision_compare_fn(
                client, before_bytes, after_bytes, question_label, vision_model
            )

        else:
            # ------------------------------------------------------------------
            # Single-screenshot workflow (default)
            # ------------------------------------------------------------------
            # Step 1 (optional): call a setup tool via MCP to set server state
            if setup_tool:
                t0 = time.time()
                try:
                    await connection.call_tool(setup_tool, setup_args)
                    setup_tool_metrics[setup_tool] = {"count": 1, "durations": [time.time() - t0]}
                except Exception as exc:
                    setup_error = f"Setup tool '{setup_tool}' failed: {exc}"
                    print(f"  ⚠️  {setup_error}")

            # Step 2: render and screenshot
            if setup_tool and not setup_error:
                screenshot_bytes = await screenshot_with_tool_input(
                    html_content,
                    tool_name=setup_tool,
                    tool_args=setup_args,
                    width=screenshot_width,
                    height=screenshot_height,
                )
            else:
                screenshot_bytes = await screenshot_mcp_resource(
                    html_content,
                    width=screenshot_width,
                    height=screenshot_height,
                )

            # Step 3: save screenshot for manual review
            if screenshot_dir is not None:
                screenshot_dir.mkdir(parents=True, exist_ok=True)
                screenshot_path = screenshot_dir / f"screenshot_{task_index + 1}.png"
                screenshot_path.write_bytes(screenshot_bytes)
                print(f"  📷 Screenshot saved: {screenshot_path.name}")

            # Step 4: analyze with vision model
            actual, explanation = await vision_analyze_fn(
                client, screenshot_bytes, question_label, vision_model
            )

    except Exception as exc:
        actual = None
        explanation = f"Error during visual evaluation: {exc}"
        print(f"  ❌ {explanation}")

    expected = qa_pair["answer"]
    score = int(
        actual is not None
        and actual.strip().lower() == expected.strip().lower()
    )
    duration_seconds = time.time() - start_time

    return {
        "type": "visual",
        "question": question_label,
        "expected": expected,
        "actual": actual,
        "score": score,
        "total_duration": duration_seconds,
        "tool_calls": setup_tool_metrics,
        "num_tool_calls": sum(len(m["durations"]) for m in setup_tool_metrics.values()),
        "summary": explanation,
        "feedback": setup_error,
        "screenshot_path": screenshot_path,
    }


async def _read_resource_html(connection: Any, resource_uri: str) -> str:
    """Read an MCP resource and return its HTML text content."""
    result = await connection.session.read_resource(resource_uri)
    for item in result.contents:
        if hasattr(item, "text") and item.text:
            return item.text
    raise ValueError(f"Resource '{resource_uri}' returned no text content")


REPORT_HEADER = """
# Cesium MCP App Evaluation Report

## Summary

- **Accuracy**: {correct}/{total} ({accuracy:.1f}%)
- **Average Task Duration**: {average_duration_s:.2f}s
- **Average Tool Calls per Task**: {average_tool_calls:.2f}
- **Total Tool Calls**: {total_tool_calls}
- **Text Tasks**: {text_total} | **Visual Tasks**: {visual_total}

---
"""

TASK_TEMPLATE = """
### Task {task_num} [{task_type}]

**Question**: {question}
**Ground Truth Answer**: `{expected_answer}`
**Actual Answer**: `{actual_answer}`
**Correct**: {correct_indicator}
**Duration**: {total_duration:.2f}s
**Tool Calls**: {tool_calls}
{screenshot_line}
**Summary**
{summary}

**Feedback**
{feedback}

---
"""


async def run_evaluation(
    eval_path: Path,
    connection: Any,
    model: str,
    loop_fn: Any,
    client: Any,
    visual_client: Any | None = None,
    visual_model: str | None = None,
    vision_analyze_fn: Any | None = None,
    vision_compare_fn: Any | None = None,
    vision_sequence_fn: Any | None = None,
    resource_uri: str | None = None,
    screenshot_width: int = 1280,
    screenshot_height: int = 800,
    screenshot_dir: Path | None = None,
    eval_type: str = "both",
    extra_visual_file: Path | None = None,
) -> str:
    """Run evaluation against a Cesium MCP App.

    Args:
        eval_path: Path to the primary evaluation XML file (text tasks, or combined).
        eval_type: Which task types to run — ``"text"``, ``"visual"``, or ``"both"``.
        extra_visual_file: Optional path to a separate visual-only XML file whose
            ``type="visual"`` tasks are merged with those in ``eval_path``.

    Pass ``visual_client``, ``visual_model``, ``vision_analyze_fn``, and ``resource_uri``
    to enable visual evaluation of ``type="visual"`` QA pairs.  If these are omitted,
    visual tasks are skipped with a warning.

    Pass ``vision_compare_fn`` to enable ``workflow="before_after"`` QA pairs that
    capture before/after screenshots and compare them with a vision model.

    Pass ``vision_sequence_fn`` to enable ``workflow="sequence"`` QA pairs that
    dispatch multiple tool calls in order and send all labeled screenshots to a vision model.
    """
    tools = await connection.list_tools()
    print(f"📋 Loaded {len(tools)} tools from MCP server")

    qa_pairs = parse_evaluation_file(eval_path)
    if extra_visual_file is not None:
        qa_pairs += [p for p in parse_evaluation_file(extra_visual_file) if p.get("type") == "visual"]

    # Filter by requested eval_type
    if eval_type == "text":
        qa_pairs = [p for p in qa_pairs if p.get("type", "text") == "text"]
    elif eval_type == "visual":
        qa_pairs = [p for p in qa_pairs if p.get("type") == "visual"]

    text_pairs = [p for p in qa_pairs if p.get("type", "text") == "text"]
    visual_pairs = [p for p in qa_pairs if p.get("type") == "visual"]
    print(f"📋 Loaded {len(qa_pairs)} evaluation tasks ({len(text_pairs)} text, {len(visual_pairs)} visual)")

    if visual_pairs and not (visual_client and visual_model and vision_analyze_fn and resource_uri):
        print(
            f"⚠️  {len(visual_pairs)} visual task(s) found but --visual flags not configured — skipping visual tasks."
        )
        qa_pairs = text_pairs

    results = []
    for i, qa_pair in enumerate(qa_pairs):
        print(f"\nProcessing task {i + 1}/{len(qa_pairs)}")
        if qa_pair.get("type") == "visual":
            result = await evaluate_single_visual_task(
                visual_client,
                visual_model,
                qa_pair,
                connection,
                i,
                vision_analyze_fn,
                resource_uri,
                screenshot_width=screenshot_width,
                screenshot_height=screenshot_height,
                screenshot_dir=screenshot_dir,
                vision_compare_fn=vision_compare_fn,
                vision_sequence_fn=vision_sequence_fn,
            )
        else:
            result = await evaluate_single_task(client, model, qa_pair, tools, connection, i, loop_fn)
        results.append(result)
        status = "✅" if result["score"] else "❌"
        print(f"  {status} Expected: {result['expected']} | Got: {result['actual']}")

    correct = sum(r["score"] for r in results)
    accuracy = (correct / len(results)) * 100 if results else 0
    average_duration_s = sum(r["total_duration"] for r in results) / len(results) if results else 0
    average_tool_calls = sum(r["num_tool_calls"] for r in results) / len(results) if results else 0
    total_tool_calls = sum(r["num_tool_calls"] for r in results)
    text_total = sum(1 for r in results if r.get("type", "text") == "text")
    visual_total = sum(1 for r in results if r.get("type") == "visual")

    report = REPORT_HEADER.format(
        correct=correct,
        total=len(results),
        accuracy=accuracy,
        average_duration_s=average_duration_s,
        average_tool_calls=average_tool_calls,
        total_tool_calls=total_tool_calls,
        text_total=text_total,
        visual_total=visual_total,
    )

    report += "".join([
        TASK_TEMPLATE.format(
            task_num=i + 1,
            task_type=result.get("type", "text").upper(),
            question=result["question"],
            expected_answer=result["expected"],
            actual_answer=result["actual"] or "N/A",
            correct_indicator="✅" if result["score"] else "❌",
            total_duration=result["total_duration"],
            tool_calls=json.dumps(result["tool_calls"], indent=2),
            screenshot_line=(
                f"\n**Screenshot**: ![Task {i + 1}]({result['screenshot_path'].name})\n"
                if result.get("screenshot_path") is not None
                else ""
            ),
            summary=result["summary"] or "N/A",
            feedback=result["feedback"] or "N/A",
        )
        for i, result in enumerate(results)
    ])

    return report
