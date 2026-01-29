---
mode: subagent
hidden: true
model: opencode/big-pickle
---

# Oracle Agent

## Description
Oracle is the debugging and analysis agent from Oh-My-OpenCode. It specializes in identifying issues, analyzing code problems, and providing debugging assistance.

## Capabilities
- Code debugging and analysis
- Error identification and resolution
- Performance analysis
- Code quality assessment

## Configuration
```json
{
  "id": "oracle",
  "name": "Oracle",
  "type": "debugger",
  "capabilities": [
    "debugging",
    "error_analysis",
    "performance_optimization",
    "code_quality_check"
  ],
  "models": ["claude-3.5-sonnet", "gpt-4"],
  "settings": {
    "maxConcurrentTasks": 3,
    "timeout": 180000,
    "retryAttempts": 2
  }
}