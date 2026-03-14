# 💬 Discourse MCP Integration Guide for community.cesium.com

## 📖 Overview

[Discourse MCP](https://github.com/discourse/discourse-mcp) is an MCP (Model Context Protocol) server that exposes Discourse forum capabilities as tools and resources for AI assistants.

This guide documents how to connect it to the Cesium community forum at:

- **Forum**: https://community.cesium.com
- **Repository**: https://github.com/discourse/discourse-mcp

## 💡 Why use Discourse MCP for Cesium

It gives agents direct access to real forum content (topics, posts, tags, categories, and user context) instead of relying on stale snapshots. That helps with:

- finding current community answers
- checking prior discussions before posting
- drafting/supporting moderator and community workflows

## ⚙️ Setup Instructions

<details>
<summary>VS Code Configuration (.vscode/mcp.json)</summary>

Read-only (recommended to start):

```json
{
  "mcp": {
    "servers": {
      "discourse": {
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "@discourse/mcp@latest", "--site", "https://community.cesium.com"]
      }
    }
  }
}
```

Writes enabled (admin API key example):

```json
{
  "mcp": {
    "servers": {
      "discourse": {
        "type": "stdio",
        "command": "npx",
        "args": [
          "-y",
          "@discourse/mcp@latest",
          "--site",
          "https://community.cesium.com",
          "--allow_writes",
          "--read_only=false",
          "--auth_pairs",
          "[{\"site\":\"https://community.cesium.com\",\"api_key\":\"YOUR_DISCOURSE_API_KEY\",\"api_username\":\"system\"}]"
        ]
      }
    }
  }
}
```

</details>

<details>
<summary>Claude Code / Claude Desktop Configuration</summary>

Read-only:

```bash
claude mcp add discourse -- npx -y @discourse/mcp@latest --site https://community.cesium.com
```

Writes enabled (admin API key):

```bash
claude mcp add discourse -- npx -y @discourse/mcp@latest --site https://community.cesium.com --allow_writes --read_only=false --auth_pairs '[{"site":"https://community.cesium.com","api_key":"YOUR_DISCOURSE_API_KEY","api_username":"system"}]'
```

</details>

## 🔐 Authentication Notes

- **Read-only mode is default** and safest for discovery/search workflows.
- For writes, use `--allow_writes --read_only=false` and provide `--auth_pairs` for the selected site.
- Supported auth modes in upstream server:
  - admin API key (`api_key` + `api_username`)
  - user API key (`user_api_key` + optional `user_api_client_id`)

## 🚀 Usage Examples

After startup, ask your assistant to:

- "Search community.cesium.com for discussions about 3D Tiles metadata best practices."
- "Read topic 12345 and summarize open questions from the thread."
- "List categories and tags relevant to Cesium for Unreal troubleshooting."

If you do **not** pass `--site`, first call:

```json
{ "site": "https://community.cesium.com" }
```

with the `discourse_select_site` tool.

## 🧰 Common Built-in Tools

Some commonly used built-ins:

- `discourse_search`
- `discourse_read_topic`
- `discourse_read_post`
- `discourse_filter_topics`
- `discourse_get_user`

Write tools (for example `discourse_create_post` and `discourse_create_topic`) are only available when writes are explicitly enabled.

## 🔗 Resources

- Discourse MCP repo: https://github.com/discourse/discourse-mcp
- Package: https://www.npmjs.com/package/@discourse/mcp
- Cesium community forum: https://community.cesium.com
- Discourse user API key spec: https://meta.discourse.org/t/user-api-keys-specification/48536
