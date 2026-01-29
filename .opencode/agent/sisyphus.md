# Sisyphus Agent

## Description
Sisyphus is the main orchestrator agent from Oh-My-OpenCode. It coordinates tasks between other agents and manages the overall workflow.

## Capabilities
- Task orchestration and delegation
- Multi-agent coordination
- Workflow management
- Result synthesis

## Configuration
```json
{
  "id": "sisyphus",
  "name": "Sisyphus",
  "type": "orchestrator",
  "capabilities": [
    "task_delegation",
    "workflow_management",
    "agent_coordination",
    "result_synthesis"
  ],
  "models": ["claude-3.5-sonnet", "gpt-4"],
  "settings": {
    "maxConcurrentTasks": 5,
    "timeout": 300000,
    "retryAttempts": 3
  }
}