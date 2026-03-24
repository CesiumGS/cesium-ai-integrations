# cesium-mcp-app Skill

An agent skill for building **Cesium MCP Apps** — CesiumJS visualizations exposed to LLMs as MCP tool suites.

## What This Skill Does

When activated, this skill guides an AI agent through all phases of creating a production-ready MCP App:

1. **Input extraction** — pull scene code from a Sandcastle URL, a GitHub raw link, or a plain-language description, including related HTML/CSS dependencies (e.g., `@import`ed Sandcastle styles)
2. **API verification** — look up the latest CesiumJS APIs via Context7 (prevents stale Sandcastle patterns from making it into production code)
3. **Tool design** — map interactive scene elements to minimal, high-value MCP tools (avoid one-tool-per-button duplication)
4. **Implementation** — scaffold the server entry point, tool registration, scene state, and browser client
5. **CSP & build configuration** — identify all required domains upfront (cannot be debugged after sandboxing)
6. **Evaluation** — generate 10 scenario-based questions and run them against the finished app

## Valid Inputs

| Input type | Example |
|---|---|
| Sandcastle URL | `https://sandcastle.cesium.com/?id=aec-architectural-design` |
| GitHub raw link | `https://raw.githubusercontent.com/...` |
| Plain description | _"Build an app that lets the LLM toggle terrain layers and fly to named cities"_ |
| Existing MCP App | Provide the `src/` directory path to modify rather than recreate |

## Skill Files

| File | Purpose |
|---|---|
| [SKILL.md](./SKILL.md) | Full step-by-step workflow loaded at skill activation |
| [reference/project-structure.md](./reference/project-structure.md) | Canonical directory layout and all code patterns |
| [reference/csp-config.md](./reference/csp-config.md) | CSP domain table, vite/tsconfig/package.json templates |
| [reference/evaluation.md](./reference/evaluation.md) | How to write and run evaluations |
| [scripts/evaluation-text.xml](./scripts/evaluation-text.xml) | Example text evaluation questions |
| [scripts/evaluation-visual.xml](./scripts/evaluation-visual.xml) | Example visual evaluation questions |

## Prerequisites

- **Context7 MCP** must be configured — the skill will not proceed without it (library ID `/cesiumgs/cesium`)
- A `.env` file only for APIs/assets that require credentials (for Sandcastle examples using public/default ion assets, `CESIUM_ION_TOKEN` is not required) before running evaluations

## Related Skills

- [cesium-context7](../cesium-context7/) — fetches up-to-date CesiumJS documentation on demand

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for full guidelines.

## License

Apache 2.0 — see [LICENSE](../../LICENSE).
