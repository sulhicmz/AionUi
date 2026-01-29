/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Plugin, Command, Tool } from './types';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '@common/monitoring';

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private pluginDirectory: string;

  constructor(pluginDirectory: string = '.opencode/plugin') {
    this.pluginDirectory = pluginDirectory;
  }

  async loadPlugin(pluginName: string): Promise<void> {
    try {
      const pluginPath = path.join(this.pluginDirectory, pluginName);
      const packageJsonPath = path.join(pluginPath, 'package.json');

      if (!fs.existsSync(packageJsonPath)) {
        throw new Error(`Plugin ${pluginName} not found`);
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const mainFile = packageJson.main || 'index.ts';
      const mainPath = path.join(pluginPath, mainFile);

      // Dynamic import for plugin
      const pluginModule = await import(mainPath);
      const plugin: Plugin = new pluginModule.default();

      plugin.initialize();
      this.plugins.set(pluginName, plugin);

      logger.info(`Plugin ${pluginName} loaded successfully`);
    } catch (error) {
      logger.error(`Failed to load plugin ${pluginName}:`);
      throw error;
    }
  }

  unloadPlugin(pluginName: string): void {
    const plugin = this.plugins.get(pluginName);
    if (plugin) {
      try {
        plugin.destroy();
        this.plugins.delete(pluginName);
        logger.info(`Plugin ${pluginName} unloaded successfully`);
      } catch (error) {
        logger.error(`Failed to unload plugin ${pluginName}:`);
        throw error;
      }
    }
  }

  loadAllPlugins(): void {
    if (!fs.existsSync(this.pluginDirectory)) {
      logger.info("Log message");
      return;
    }

    const pluginDirs = fs
      .readdirSync(this.pluginDirectory, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    for (const pluginDir of pluginDirs) {
      try {
        void this.loadPlugin(pluginDir);
      } catch (error) {
        logger.error(`Skipping plugin ${pluginDir} due to error:`);
      }
    }
  }

  getLoadedPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  getAllCommands(): Command[] {
    const commands: Command[] = [];
    for (const plugin of this.plugins.values()) {
      commands.push(...plugin.getCommands());
    }
    return commands;
  }

  getAllTools(): Tool[] {
    const tools: Tool[] = [];
    for (const plugin of this.plugins.values()) {
      tools.push(...plugin.getTools());
    }
    return tools;
  }

  executeCommand(commandName: string, args: string[]): unknown {
    for (const plugin of this.plugins.values()) {
      const commands = plugin.getCommands();
      const command = commands.find((cmd) => cmd.name === commandName);
      if (command) {
        return command.execute(args);
      }
    }
    throw new Error(`Command ${commandName} not found`);
  }

  executeTool(toolName: string, params: Record<string, unknown>): unknown {
    for (const plugin of this.plugins.values()) {
      const tools = plugin.getTools();
      const tool = tools.find((t) => t.name === toolName);
      if (tool) {
        return tool.execute(params);
      }
    }
    throw new Error(`Tool ${toolName} not found`);
  }

  destroy(): void {
    const destroyPromises = Array.from(this.plugins.values()).map((plugin) => {
      try {
        plugin.destroy();
      } catch (error) {
        logger.error("Error message");
      }
    });
    this.plugins.clear();
  }
}
