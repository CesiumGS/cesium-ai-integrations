# Cesium MCP App — Evaluation Guide

## Overview

Evaluations test whether an LLM can effectively use your Cesium MCP App's tools to accomplish realistic geospatial tasks. Quality is measured not by how many tools you implement, but by how well the tool names, descriptions, and schemas enable an LLM — with no prior context — to produce correct answers.

---

## Quick Reference

- Create **10 scenario-based questions** per app
- Questions must be **read-only** and **independent** (no question depends on another)
- Answers must be **single, verifiable strings** (direct string comparison)
- Answers must be **stable** — not dependent on live data or time

### Output format

Text and visual QA pairs live in **separate XML files** — or in a single combined file if you prefer. The harness detects which types are present and asks which to run:

**`evaluation-text.xml`** — text tasks only:

```xml
<evaluation>
  <qa_pair>
    <question>Your question here</question>
    <answer>Single verifiable answer</answer>
  </qa_pair>
</evaluation>
```

**`evaluation-visual.xml`** — visual tasks only:

```xml
<evaluation>
  <!-- Single screenshot: no tool call (tests initial state) -->
  <qa_pair type="visual">
    <visual_question>Is the toolbar visible on the page?</visual_question>
    <answer>True</answer>
  </qa_pair>

  <!-- Single screenshot: call setup tool, then screenshot the result -->
  <qa_pair type="visual">
    <tool>isolate-category</tool>
    <tool_input>{"category": "Walls"}</tool_input>
    <visual_question>Does the viewer show only a subset of elements after isolating a category?</visual_question>
    <answer>True</answer>
  </qa_pair>

  <!-- Before/after comparison: capture state before AND after the tool call -->
  <qa_pair type="visual" workflow="before_after">
    <tool>set-category-color</tool>
    <tool_input>{"category": "Walls", "color": "#FF0000"}</tool_input>
    <visual_question>Does the color of any visible elements change after the tool is called?</visual_question>
    <answer>True</answer>
  </qa_pair>

  <!-- Multi-step sequence: dispatch tools in order, verify cumulative result -->
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
</evaluation>
```

Both files are combined at runtime.

---

## Question Design for Cesium MCP Apps

### Visual question workflows

Visual QA pairs support three modes set via the `workflow` attribute.

#### Single screenshot (default)

Optionally calls a setup tool via MCP, then takes **one screenshot** and asks the vision model.

```xml
<!-- No tool: tests initial page state -->
<qa_pair type="visual">
  <visual_question>Is a dark-themed 3D viewer visible on the page?</visual_question>
  <answer>True</answer>
</qa_pair>

<!-- With setup tool: screenshot taken after the call -->
<qa_pair type="visual">
  <tool>isolate-category</tool>
  <tool_input>{"category": "Walls"}</tool_input>
  <visual_question>Does the viewer show only a subset of architectural elements?</visual_question>
  <answer>True</answer>
</qa_pair>
```

#### Before/after comparison (`workflow="before_after"`)

Captures a **before** screenshot, dispatches the tool via `window.postMessage`, captures an **after** screenshot, then sends **both** to the vision model labelled "Image 1 (BEFORE)" and "Image 2 (AFTER)". Use to verify that a single tool visually changes the scene. `<tool>` is required; the tool is NOT called via MCP — it is simulated client-side.

```xml
<qa_pair type="visual" workflow="before_after">
  <tool>set-category-color</tool>
  <tool_input>{"category": "Walls", "color": "#FF0000"}</tool_input>
  <visual_question>Does the color of any visible elements change after the tool is called?</visual_question>
  <answer>True</answer>
</qa_pair>
```

#### Multi-step sequence (`workflow="sequence"`)

Dispatches each `<step>` via `window.postMessage` in order, capturing a screenshot after each. All screenshots are sent to the vision model together with step labels. Use for **cumulative effects** of multiple tools.

```xml
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
```

When `workflow="before_after"` suffices (single tool, no ordering concern), prefer it — it's simpler.

---



Cesium MCP App tools typically fall into these categories — design questions that exercise each:

| Tool Category | Example Question Type |
|---|---|
| **Layer visibility** | "What layers are visible in the initial scene state?" |
| **Camera navigation** | "What is the default camera heading (in degrees) for the 'Overview' preset?" |
| **Feature picking** | "Is feature picking enabled by default?" |
| **Scene state queries** | "How many tileset layers does the scene expose?" |
| **Entity properties** | "What color is the entity named 'BuildingA' by default?" |
| **Time/animation** | "What is the clock multiplier when animation mode is 'fast'?" |

### Writing good questions

**Do:**
- Phrase questions in terms of observable effects, not tool names (`"Which data source displays infrastructure lines"` not `"What does toggle-layer do"`)
- Test default/initial state — these are always stable
- Chain implicit reasoning: `"If all layers are hidden except one, which layer is still visible?"`
- Ask about schema boundaries: `"What are the valid values for the view parameter of set-camera-view?"`

**Don't:**
- Ask about live external data (tile counts, API responses) — these change
- Make question N depend on answering question N-1
- Use the exact tool name as a keyword in the question
- Ask questions that require write operations to answer

### Complexity requirements

Each question must require the LLM to:
- Call at least 2–3 tools to arrive at the answer
- Interpret tool responses (not just echo them)
- Reason about scene state, tool schemas, or entity relationships

---

## Verification Process

Before publishing an evaluation, **solve every question yourself**:

1. Start the MCP app (`pnpm run start`)
2. Connect to it using MCP Inspector or a direct client
3. Walk through each question using only the available tools
4. Record the exact answer string (including casing, units, format)
5. Confirm the answer will not change if the question is asked again tomorrow

If you cannot answer a question using only the available tools, revise or replace it.

---

## Example Evaluation

See [../scripts/evaluation-text.xml](../scripts/evaluation-text.xml) for worked text examples and [../scripts/evaluation-visual.xml](../scripts/evaluation-visual.xml) for worked visual examples.

---

## Running Evaluations

The harness lives in [../scripts/evaluation/](../scripts/evaluation/). Keep text and visual tasks in separate XML files.

### One-time setup

```bash
cd .github/skills/cesium-mcp-app/scripts
python -m venv .venv
.venv\Scripts\Activate.ps1   # or: source .venv/bin/activate
```

Create a `.env` file in `scripts/`:

```env
# OpenAI (default):
OPENAI_API_KEY=sk-...

# Azure OpenAI (optional):
OPENAI_URL=https://your-endpoint.cognitiveservices.azure.com/openai/v1/
OPENAI_MODEL=gpt-4o

# Anthropic Claude:
ANTHROPIC_API_KEY=sk-ant-...
```

Install dependencies and Chromium for visual tasks:

```bash
# OpenAI (default):
pip install -r evaluation/openai/requirements.txt
playwright install chromium

# Anthropic Claude:
pip install -r evaluation/anthropic/requirements.txt
playwright install chromium
```

### Where to put evaluation files

```
my-cesium-app/
├── eval/
│   ├── evaluation-text.xml
│   ├── evaluation-visual.xml
│   └── report.md              ← written by the harness (gitignore this)
```

### Run against the local app

Build and start the app first:

```bash
pnpm run build && pnpm run start   # runs on http://localhost:3003/mcp
```

**OpenAI**
```bash
python -m evaluation <APP_ROOT>/eval/evaluation-text.xml \
  --visual-file <APP_ROOT>/eval/evaluation-visual.xml \
  --visual --resource-uri <RESOURCE_URI> \
  --output <APP_ROOT>/eval/report.md
```

**Anthropic**
```bash
python -m evaluation <APP_ROOT>/eval/evaluation-text.xml \
  --visual-file <APP_ROOT>/eval/evaluation-visual.xml \
  --model-provider anthropic \
  --visual --resource-uri <RESOURCE_URI> \
  --output <APP_ROOT>/eval/report.md
```

Text only (no visual setup required):
```bash
python -m evaluation <APP_ROOT>/eval/evaluation-text.xml --type text
```

### Options

| Flag | Default | Description |
|---|---|---|
| `--output` | — | Markdown report path |
| `--url` | `http://localhost:3003/mcp` | MCP server URL |
| `--type` | interactive | `text`, `visual`, or `both` |
| `--model-provider` | `openai` | `openai` or `anthropic` |
| `--model` | `gpt-4o` / `claude-opus-4-5` | LLM model |
| `--header` | — | Extra HTTP header |
| `--visual` | off | Enable visual evaluation |
| `--visual-file` | — | Path to visual XML file |
| `--resource-uri` | — | MCP resource URI (required for `--visual`) |
| `--visual-provider` | same as `--model-provider` | Vision model provider |
| `--visual-model` | `gpt-4o` / `claude-opus-4-5` | Vision model |
| `--screenshot-width` | `1280` | Viewport width |
| `--screenshot-height` | `800` | Viewport height |

### Interpreting results

| Score | Action |
|---|---|
| 9–10 / 10 | Tool descriptions and schemas are well-designed |
| 7–8 / 10 | Review failing questions — tune descriptions or add enum hints |
| < 7 / 10 | Systematic problem — revisit tool naming, input schema descriptions, or `get-scene-state` coverage |

> The `<feedback>` section in the report contains per-task LLM commentary. Use it to prioritize improvements to tool names, descriptions, and parameter schemas.
