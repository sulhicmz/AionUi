# OpenCode Plugins

This directory contains plugins for the OpenCode integration with AionUi.

## Plugin Structure

Each plugin should follow this structure:
```
plugin-name/
├── package.json
├── index.ts
├── README.md
└── assets/ (optional)
```

## Available Plugins

### Core Plugins
- **agent-orchestrator**: Multi-agent orchestration system
- **auth-antigravity**: Google OAuth authentication for premium models
- **lsp-integration**: Language Server Protocol integration
- **mcp-websearch**: Web search capabilities via MCP

## Plugin Development

To create a new plugin:

1. Create a directory for your plugin
2. Add a package.json with plugin metadata
3. Implement the plugin interface in index.ts
4. Add documentation in README.md

## Plugin Interface

```typescript
interface Plugin {
  name: string;
  version: string;
  description: string;
  initialize(): Promise<void>;
  destroy(): Promise<void>;
  getCommands(): Command[];
  getTools(): Tool[];
}