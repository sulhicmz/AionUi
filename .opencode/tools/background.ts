import { tool } from '@opencode-ai/plugin';

export default tool({
  name: 'background_exec',
  description: 'Execute long-running shell commands (install, build, serve) in background.',
  parameters: { command: { type: 'string' } },
  execute: async ({ command }, { $ }) => {
    const proc = $`${command} &`.quiet().nothrow();
    return `Started background process. PID: ${proc.pid}`;
  },
});
