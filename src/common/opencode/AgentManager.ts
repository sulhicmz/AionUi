/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Agent, Task } from './types';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '@common/monitoring';

export class AgentManager {
  private agents: Map<string, Agent> = new Map();
  private tasks: Map<string, Task> = new Map();
  private agentDirectory: string;
  private defaultAgent: string = 'sisyphus';

  constructor(agentDirectory: string = '.opencode/agent') {
    this.agentDirectory = agentDirectory;
  }

  loadAgents(): void {
    if (!fs.existsSync(this.agentDirectory)) {
      logger.info("Log message");
      return;
    }

    const agentFiles = fs.readdirSync(this.agentDirectory).filter((file) => file.endsWith('.md'));

    for (const agentFile of agentFiles) {
      try {
        const agentPath = path.join(this.agentDirectory, agentFile);
        const content = fs.readFileSync(agentPath, 'utf-8');
        const agent = this.parseAgentDefinition(content, agentFile);
        this.agents.set(agent.id, agent);
      } catch (error) {
        logger.error(`Failed to load agent from ${agentFile}:`);
      }
    }
  }

  private parseAgentDefinition(content: string, filename: string): Agent {
    const lines = content.split('\n');
    const agent: Partial<Agent> = {
      id: filename.replace('.md', ''),
      name: '',
      type: 'specialist',
      capabilities: [],
      models: [],
      settings: {
        maxConcurrentTasks: 3,
        timeout: 180000,
        retryAttempts: 2,
      },
    };

    let inConfig = false;
    let configContent = '';

    for (const line of lines) {
      if (line.startsWith('## Configuration')) {
        inConfig = true;
        continue;
      }

      if (inConfig && line.startsWith('```')) {
        try {
          const config = JSON.parse(configContent);
          Object.assign(agent, config);
        } catch (error) {
          logger.error("Error message");
        }
        break;
      }

      if (inConfig) {
        configContent += line;
      } else if (line.startsWith('# ')) {
        agent.name = line.substring(2).trim();
      } else if (line.startsWith('## Description')) {
        // Description is handled separately if needed
      }
    }

    return agent as Agent;
  }

  registerAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);
  }

  getAvailableAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  getDefaultAgent(): Agent | undefined {
    return this.agents.get(this.defaultAgent);
  }

  setDefaultAgent(agentId: string): void {
    if (this.agents.has(agentId)) {
      this.defaultAgent = agentId;
    } else {
      throw new Error(`Agent ${agentId} not found`);
    }
  }

  async executeAgent(agentId: string, task: Omit<Task, 'id' | 'status'>): Promise<Task> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const fullTask: Task = {
      ...task,
      id: this.generateTaskId(),
      status: 'pending',
      agentId,
    };

    this.tasks.set(fullTask.id, fullTask);

    try {
      fullTask.status = 'running';

      // Simulate agent execution
      // In a real implementation, this would call the actual agent
      const result = await this.simulateAgentExecution(agent, fullTask);

      fullTask.status = 'completed';
      fullTask.result = result;
    } catch (error) {
      fullTask.status = 'failed';
      fullTask.error = error instanceof Error ? error.message : String(error);
    }

    this.tasks.set(fullTask.id, fullTask);
    return fullTask;
  }

  private async simulateAgentExecution(agent: Agent, task: Task): Promise<unknown> {
    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      agent: agent.name,
      task: task.description,
      completedAt: new Date().toISOString(),
      output: `Task "${task.description}" completed by ${agent.name}`,
    };
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  getTasksByAgent(agentId: string): Task[] {
    return Array.from(this.tasks.values()).filter((task) => task.agentId === agentId);
  }

  getActiveTasks(): Task[] {
    return Array.from(this.tasks.values()).filter((task) => task.status === 'pending' || task.status === 'running');
  }

  cancelTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task && (task.status === 'pending' || task.status === 'running')) {
      task.status = 'failed';
      task.error = 'Task cancelled';
      this.tasks.set(taskId, task);
    }
  }

  clearCompletedTasks(): void {
    for (const [taskId, task] of this.tasks.entries()) {
      if (task.status === 'completed' || task.status === 'failed') {
        this.tasks.delete(taskId);
      }
    }
  }
}
