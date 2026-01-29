# Knowledge Base

## System Architecture

### OpenCode Integration

- **Version**: 1.1.41
- **Configuration**: Multi-file JSON structure
- **MCP Servers**: memory, github, context7, playwright
- **Skills**: 11 total (7 SkillHub + 4 builtin)

### Agent Ecosystem

1. **Sisyphus** - Autonomous orchestrator (Claude Opus 4.5 Thinking)
2. **Oracle** - Debugging/Architecture specialist (GPT-5.2)
3. **Frontend UI/UX** - UI/UX development (Gemini 3 Pro)
4. **Librarian** - Documentation/exploration (Claude Sonnet 4.5)
5. **Explore** - Codebase search (Grok Code)
6. **Document Writer** - Documentation (Gemini 3 Flash)

### Background Tasks

- **Max Concurrent**: 8
- **Timeout**: 10 minutes
- **Auto-Retry**: 3 attempts
- **Learning**: Enabled

### MCP Integration Status

- ✅ Memory Server - Active
- ✅ GitHub Server - Active
- ✅ Context7 Server - Active
- ✅ Playwright Server - Active

## Best Practices

### Autonomous Operations

1. Always verify environment before task execution
2. Use background tasks for long-running operations
3. Leverage specialized agents for domain-specific tasks
4. Maintain evolution logs for continuous improvement

### Error Handling

1. Self-healing triggers after 3 errors
2. Retry with exponential backoff
3. Fallback strategies always available
4. Track patterns for learning

### Performance Optimization

1. Parallel agent execution when possible
2. Background task queuing for efficiency
3. Skill mapping optimization
4. Knowledge base continuous updates
