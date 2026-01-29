/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * OpenCode integration types for AionUi
 */

export interface Plugin {
  name: string;
  version: string;
  description: string;
  author?: string;
  initialize(): Promise<void>;
  destroy(): Promise<void>;
  getCommands(): Command[];
  getTools(): Tool[];
}

export interface Command {
  name: string;
  description: string;
  usage: string;
  execute(args: string[]): Promise<CommandResult>;
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute(params: Record<string, unknown>): Promise<ToolResult>;
}

export interface Agent {
  id: string;
  name: string;
  type: 'orchestrator' | 'debugger' | 'specialist' | 'researcher';
  capabilities: string[];
  models: string[];
  settings: AgentSettings;
}

export interface AgentSettings {
  maxConcurrentTasks: number;
  timeout: number;
  retryAttempts: number;
}

export interface Task {
  id: string;
  type: string;
  description: string;
  agentId?: string;
  parameters: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: unknown;
  error?: string;
}

export interface CommandResult {
  success: boolean;
  output?: string;
  error?: string;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface OpenCodeConfig {
  version: string;
  name: string;
  description: string;
  plugins: {
    enabled: boolean;
    autoLoad: boolean;
    directory: string;
  };
  agents: {
    enabled: boolean;
    defaultAgent: string;
    directory: string;
  };
  commands: {
    enabled: boolean;
    directory: string;
  };
  skills: {
    enabled: boolean;
    directory: string;
  };
  tools: {
    enabled: boolean;
    directory: string;
  };
  authentication: {
    providers: string[];
    antigravity: {
      enabled: boolean;
      clientId: string;
      clientSecret: string;
      redirectUri: string;
    };
  };
  models: {
    premium: {
      [key: string]: {
        provider: string;
        enabled: boolean;
      };
    };
  };
}

export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  provider: string;
}

export interface Account {
  id: string;
  email: string;
  provider: string;
  tokens: AuthToken;
  isActive: boolean;
}
