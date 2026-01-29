/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Agent, Task, Account, Plugin } from '@/common/opencode';
import { getOpenCodeInstance } from '@/common/opencode';
import { logger } from '@common/monitoring';

interface OpenCodeContextValue {
  // Agents
  agents: Agent[];
  activeAgent: Agent | null;
  setActiveAgent: (agent: Agent) => void;
  executeAgentTask: (agentId: string, task: Omit<Task, 'id' | 'status'>) => Promise<Task>;

  // Tasks
  tasks: Task[];
  activeTasks: Task[];

  // Authentication
  accounts: Account[];
  activeAccount: Account | null;
  authenticate: (provider: string, options?: unknown) => Promise<void>;
  setActiveAccount: (accountId: string) => void;

  // Plugins
  plugins: Plugin[];

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Configuration
  isAntigravityEnabled: boolean;
  toggleAntigravity: (enabled: boolean) => Promise<void>;
}

const OpenCodeContext = createContext<OpenCodeContextValue | undefined>(undefined);

interface OpenCodeProviderProps {
  children: ReactNode;
}

export const OpenCodeProvider: React.FC<OpenCodeProviderProps> = ({ children }) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeAgent, setActiveAgentState] = useState<Agent | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccount, setActiveAccountState] = useState<Account | null>(null);
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAntigravityEnabled, setIsAntigravityEnabled] = useState(false);

  const openCode = getOpenCodeInstance();

  useEffect(() => {
    void initializeOpenCode();
  }, []);

  const initializeOpenCode = () => {
    try {
      setIsLoading(true);
      setError(null);

      void openCode.initialize();

      // Load agents
      const agentManager = openCode.getAgentManager();
      const loadedAgents = agentManager.getAvailableAgents();
      setAgents(loadedAgents);

      // Set default agent
      const defaultAgent = agentManager.getDefaultAgent();
      if (defaultAgent) {
        setActiveAgentState(defaultAgent);
      }

      // Load accounts
      const authService = openCode.getAuthService();
      const loadedAccounts = authService.getAccounts();
      setAccounts(loadedAccounts);

      const activeAcc = authService.getActiveAccount();
      setActiveAccountState(activeAcc);

      // Load plugins
      const pluginManager = openCode.getPluginManager();
      const loadedPlugins = pluginManager.getLoadedPlugins();
      setPlugins(loadedPlugins);

      // Check antigravity status
      const config = openCode.getConfig();
      if (config) {
        setIsAntigravityEnabled(config.authentication.antigravity.enabled);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize OpenCode');
    } finally {
      setIsLoading(false);
    }
  };

  const setActiveAgent = (agent: Agent) => {
    setActiveAgentState(agent);
  };

  const executeAgentTask = async (agentId: string, task: Omit<Task, 'id' | 'status'>): Promise<Task> => {
    try {
      const agentManager = openCode.getAgentManager();
      const executedTask = await agentManager.executeAgent(agentId, task);

      // Update tasks list
      setTasks((prev) => {
        const filtered = prev.filter((t) => t.id !== executedTask.id);
        return [...filtered, executedTask];
      });

      return executedTask;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to execute agent task');
    }
  };

  const authenticate = async (provider: string, options?: unknown) => {
    try {
      const authService = openCode.getAuthService();
      await authService.authenticate(provider, options);

      // Reload accounts
      const updatedAccounts = authService.getAccounts();
      setAccounts(updatedAccounts);

      const activeAcc = authService.getActiveAccount();
      setActiveAccountState(activeAcc);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Authentication failed');
    }
  };

  const setActiveAccount = (accountId: string) => {
    try {
      const authService = openCode.getAuthService();
      authService.setActiveAccount(accountId);

      const activeAcc = authService.getActiveAccount();
      setActiveAccountState(activeAcc);

      // Reload accounts to update active status
      const updatedAccounts = authService.getAccounts();
      setAccounts(updatedAccounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set active account');
    }
  };

  const toggleAntigravity = async (enabled: boolean) => {
    try {
      await openCode.updateConfig({
        authentication: {
          ...openCode.getConfig()?.authentication,
          antigravity: {
            ...openCode.getConfig()?.authentication.antigravity,
            enabled,
          },
        },
      });

      setIsAntigravityEnabled(enabled);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle Antigravity');
    }
  };

  const activeTasks = tasks.filter((task) => task.status === 'pending' || task.status === 'running');

  const value: OpenCodeContextValue = {
    agents,
    activeAgent,
    setActiveAgent,
    executeAgentTask,
    tasks,
    activeTasks,
    accounts,
    activeAccount,
    authenticate,
    setActiveAccount,
    plugins,
    isLoading,
    error,
    isAntigravityEnabled,
    toggleAntigravity,
  };

  return <OpenCodeContext.Provider value={value}>{children}</OpenCodeContext.Provider>;
};

export const useOpenCode = (): OpenCodeContextValue => {
  const context = useContext(OpenCodeContext);
  if (!context) {
    throw new Error('useOpenCode must be used within an OpenCodeProvider');
  }
  return context;
};
