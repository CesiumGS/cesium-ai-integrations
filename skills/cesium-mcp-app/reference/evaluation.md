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

```xml
<evaluation>
  <qa_pair>
    <question>Your question here</question>
    <answer>Single verifiable answer</answer>
  </qa_pair>
</evaluation>
```

---

## Question Design for Cesium MCP Apps

### What to test

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

See [../scripts/evaluation.xml](../scripts/evaluation.xml) for a worked example.

---

## Running Evaluations

The evaluation harness lives in [../scripts/evaluation/](../scripts/evaluation/). It automatically connects to your running Cesium MCP App via HTTP and scores each question by exact string match.

### Prerequisites

```bash
# Install dependencies (Python 3.11+ required)
cd .github/skills/cesium-mcp-app/scripts

# Create and activate a virtual environment (recommended)
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\Activate.ps1
```

**Step 1 — Choose your provider and create a `.env` file**

Before installing, decide which provider you want to use and add only that key to a `.env` file in the `scripts/` directory:

```env
# For OpenAI (default):
OPENAI_API_KEY=sk-...

# For Anthropic Claude:
ANTHROPIC_API_KEY=sk-ant-...
```

> Only one key is required. Do not add both unless you intend to run evaluations with both providers.

**Step 2 — Install provider-specific dependencies**

Install only the requirements for the provider you chose:

```bash
# OpenAI (default):
pip install -r requirements-openai.txt

# Anthropic Claude:
pip install -r requirements-anthropic.txt
```

### Where to put evaluation.xml and report.md

Create these files in an **`eval/`** subfolder at the root of your MCP app:

```
my-cesium-app/
├── eval/
│   ├── evaluation.xml   ← your evaluation questions
│   └── report.md        ← written by the harness (gitignore this)
├── src/
└── ...
```

### Run against the default local app

Build and start your app first:

```bash
pnpm run build
pnpm run start   # runs on http://localhost:3003/mcp by default
```

Then run the harness for your chosen provider (replace `<APP_ROOT>` with the absolute path to your app):

**OpenAI (default)**
```bash
python -m evaluation <APP_ROOT>/eval/evaluation.xml --output <APP_ROOT>/eval/report.md
```

**Anthropic Claude**
```bash
python -m evaluation <APP_ROOT>/eval/evaluation.xml --model-provider anthropic --output <APP_ROOT>/eval/report.md
```

> Example (Windows): `python -m evaluation D:\CesiumGS\testing\mcp\mcp-apps\my-app\eval\evaluation.xml --output D:\CesiumGS\testing\mcp\mcp-apps\my-app\eval\report.md`

### Common options

**OpenAI**
```bash
# Point at a different port or host
python -m evaluation evaluation.xml --url http://localhost:4000/mcp

# Use SSE transport instead of HTTP
python -m evaluation evaluation.xml --transport sse --url http://localhost:3003/mcp

# Save the report to a file (use absolute paths)
python -m evaluation <APP_ROOT>/eval/evaluation.xml --output <APP_ROOT>/eval/report.md

# Use a specific model
python -m evaluation evaluation.xml --model gpt-4o-mini

# Pass custom headers (e.g. auth)
python -m evaluation evaluation.xml --header "Authorization: Bearer token"
```

**Anthropic Claude**
```bash
# Point at a different port or host
python -m evaluation evaluation.xml --model-provider anthropic --url http://localhost:4000/mcp

# Use SSE transport instead of HTTP
python -m evaluation evaluation.xml --model-provider anthropic --transport sse --url http://localhost:3003/mcp

# Save the report to a file (use absolute paths)
python -m evaluation <APP_ROOT>/eval/evaluation.xml --model-provider anthropic --output <APP_ROOT>/eval/report.md

# Use a specific model
python -m evaluation evaluation.xml --model-provider anthropic --model claude-3-5-sonnet-20241022

# Pass custom headers (e.g. auth)
python -m evaluation evaluation.xml --model-provider anthropic --header "Authorization: Bearer token"
```

### What the harness does

1. Connects to the running app via Streamable HTTP (or SSE)
2. Lists all available MCP tools
3. For each `qa_pair` in the XML file, runs an LLM agent (OpenAI by default, or Anthropic with `--model-provider anthropic`) that uses the tools to answer the question
4. Extracts the `<response>` tag from the agent's output
5. Compares it to the expected `<answer>` via exact string match

### Harness structure

| File | Purpose |
|---|---|
| `evaluation/__main__.py` | CLI entry point — argument parsing, provider routing |
| `evaluation/runner.py` | Shared orchestration logic and report generation |
| `evaluation/openai_eval.py` | OpenAI agent loop; exports `REQUIRED_ENV_KEY` |
| `evaluation/anthropic_eval.py` | Anthropic agent loop; exports `REQUIRED_ENV_KEY` |
| `evaluation/prompt.py` | Shared system prompt used by both providers |
| `requirements.txt` | Common dependencies (`mcp`, `python-dotenv`) |
| `requirements-openai.txt` | OpenAI-only dependencies (includes `requirements.txt`) |
| `requirements-anthropic.txt` | Anthropic-only dependencies (includes `requirements.txt`) |
6. Prints pass/fail per question, then writes a full Markdown report

**Sample output:**

```
🚀 Starting Cesium MCP App Evaluation
📋 Loaded 5 tools from MCP server
📋 Loaded 10 evaluation tasks

Processing task 1/10
  ✅ Expected: Station,SurroundingArea | Got: Station,SurroundingArea
Processing task 2/10
  ❌ Expected: Overview | Got: overview

# Cesium MCP App Evaluation Report
## Summary
- Accuracy: 9/10 (90.0%)
- Average Task Duration: 4.23s
- Average Tool Calls per Task: 2.40
- Total Tool Calls: 24
```

### Interpreting results

| Score | Action |
|---|---|
| 9–10 / 10 | Tool descriptions and schemas are well-designed |
| 7–8 / 10 | Review failing questions — tune descriptions or add enum hints |
| < 7 / 10 | Systematic problem — revisit tool naming, input schema descriptions, or `get-scene-state` coverage |

> The `<feedback>` section in the report contains per-task LLM commentary on each tool. Use this to prioritize improvements to tool names, descriptions, and parameter schemas.
