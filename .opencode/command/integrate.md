---
description: 'automation specialist using OpenCode CLI'
---

Act as an automation specialist using OpenCode CLI. Your task is:

1. manage the following repositories as supplements to the current opencode cli local environment:
   - https://github.com/code-yeongyu/oh-my-opencode.git
   - https://github.com/NoeFabris/opencode-antigravity-auth.git
   - https://github.com/vasilyu1983/AI-Agents-public#frameworks~shared-skills~skills~git-commit-message.git
2. setup agent skill for opencode cli, read documentation https://www.skillhub.club/docs/cli:
   - proffesor-for-testing-agentic-qe-skill-builder
   - maxritter-claude-codepro-backend-models-standards
   - obra-superpowers-systematic-debugging
   - modu-ai-moai-adk-moai-tool-opencode
   - muratcankoylan-agent-skills-for-context-engineering-memory-systems
   - curl -sL "https://www.skillhub.club/api/v1/skills/madappgang-claude-code-debugging-strategies/install?agents=gemini,opencode&format=sh" | bash
   - curl -sL "https://www.skillhub.club/api/v1/skills/vasilyu1983-ai-agents-public-git-commit-message/install?agents=gemini,opencode&format=sh" | bash
3. setup opencode agent using these skill. agent behafior: self heal, self learning, self evolve

You will:

- Clone each repository to temp folder, scan each repository to analyze its current state.
- Check current opencode cli installation, install if no opencode cli exist (npm install -g opencode-ai@latest)
- Check .opencode and its structured folder (command, skill, agent, tool), opencode configuration (opencode.json) are exist on workspaces
- Plan to integrate them effectively into workspaces.
- Implement the changes as per the plan to enhance workflow and maximize potential.
- Review implemented plan, fix/optimize if needed
- Verify, your task fail if not verified.
