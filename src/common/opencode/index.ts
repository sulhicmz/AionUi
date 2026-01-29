/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

export * from './types';
export * from './PluginManager';
export * from './AgentManager';
export * from './AuthService';

import { PluginManager } from './PluginManager';
import { AgentManager } from './AgentManager';
import { AuthService } from './AuthService';
import type { OpenCodeConfig } from './types';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '@common/monitoring';

export class OpenCodeIntegration {
  private pluginManager: PluginManager;
  private agentManager: AgentManager;
  private authService: AuthService;
  private config: OpenCodeConfig | null = null;
  private configPath: string;

  constructor(configPath: string = '.opencode/config/config.json') {
    this.configPath = configPath;
    this.pluginManager = new PluginManager();
    this.agentManager = new AgentManager();
    this.authService = new AuthService();
  }

  async initialize(): Promise<void> {
    try {
      // Load configuration
      await this.loadConfig();

      if (!this.config) {
        throw new Error('Failed to load OpenCode configuration');
      }

      // Initialize components based on configuration
      if (this.config.plugins.enabled) {
        await this.pluginManager.loadAllPlugins();
      }

      if (this.config.agents.enabled) {
        await this.agentManager.loadAgents();
      }

      logger.info("Log message");
    } catch (error) {
      logger.error("Error message");
      throw error;
    }
  }

  private async loadConfig(): Promise<void> {
    try {
      if (fs.existsSync(this.configPath)) {
        const configContent = fs.readFileSync(this.configPath, 'utf-8');
        this.config = JSON.parse(configContent);
      } else {
        logger.warn("Warning message");
        this.config = this.getDefaultConfig();
      }
    } catch (error) {
      logger.error("Error message");
      this.config = this.getDefaultConfig();
    }
  }

  private getDefaultConfig(): OpenCodeConfig {
    return {
      version: '1.0.0',
      name: 'AionUi OpenCode Integration',
      description: 'OpenCode CLI integration configuration for AionUi',
      plugins: {
        enabled: true,
        autoLoad: true,
        directory: '.opencode/plugin',
      },
      agents: {
        enabled: true,
        defaultAgent: 'sisyphus',
        directory: '.opencode/agent',
      },
      commands: {
        enabled: true,
        directory: '.opencode/command',
      },
      skills: {
        enabled: true,
        directory: '.opencode/skill',
      },
      tools: {
        enabled: true,
        directory: '.opencode/tool',
      },
      authentication: {
        providers: ['google', 'github'],
        antigravity: {
          enabled: false,
          clientId: '',
          clientSecret: '',
          redirectUri: 'http://localhost:3000/auth/callback',
        },
      },
      models: {
        premium: {
          claudeOpus45: {
            provider: 'antigravity',
            enabled: false,
          },
          gemini3Pro: {
            provider: 'antigravity',
            enabled: false,
          },
          gemini3Flash: {
            provider: 'antigravity',
            enabled: false,
          },
        },
      },
    };
  }

  getPluginManager(): PluginManager {
    return this.pluginManager;
  }

  getAgentManager(): AgentManager {
    return this.agentManager;
  }

  getAuthService(): AuthService {
    return this.authService;
  }

  getConfig(): OpenCodeConfig | null {
    return this.config;
  }

  async updateConfig(updates: Partial<OpenCodeConfig>): Promise<void> {
    if (this.config) {
      this.config = { ...this.config, ...updates };
      await this.saveConfig();
    }
  }

  private async saveConfig(): Promise<void> {
    if (this.config) {
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    }
  }

  async destroy(): Promise<void> {
    try {
      await this.pluginManager.destroy();
      logger.info("Log message");
    } catch (error) {
      logger.error("Error message");
    }
  }
}

// Singleton instance
let openCodeInstance: OpenCodeIntegration | null = null;

export function getOpenCodeInstance(configPath?: string): OpenCodeIntegration {
  if (!openCodeInstance) {
    openCodeInstance = new OpenCodeIntegration(configPath);
  }
  return openCodeInstance;
}
