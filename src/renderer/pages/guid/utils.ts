/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type { IProvider, TProviderWithModel } from '@/common/storage';
import { ConfigStorage } from '@/common/storage';
import { logger } from '@common/monitoring';
import { useSWR } from 'swr';
import type { AcpBackend } from '@/types/acpTypes';
import { availableModelsCache } from './constants';

/**
 * Get available models for a provider with caching
 */
export const getAvailableModels = (provider: IProvider): string[] => {
  const providerKey = typeof provider === 'string' ? provider : `${provider.id}.${provider.model}`;

  if (availableModelsCache.has(providerKey)) {
    return availableModelsCache.get(providerKey)!;
  }

  try {
    let models: string[] = [];

    // 对于字符串 Provider，使用全局 ConfigStorage
    if (typeof provider === 'string') {
      models = ConfigStorage.getModels(provider);
    } else {
      // 对于复杂对象 Provider，临时创建实例
      const tempProvider = new ConfigStorage({
        id: provider.id,
        model: provider.model,
      } as any);
      models = tempProvider.getModels();
    }

    availableModelsCache.set(providerKey, models);
    return models;
  } catch (error) {
    logger.error('Failed to get available models:', error);
    availableModelsCache.set(providerKey, []);
    return [];
  }
};

/**
 * Check if provider has available models
 */
export const hasAvailableModels = (provider: IProvider): boolean => {
  const models = getAvailableModels(provider);
  return models.length > 0;
};

/**
 * Custom hook for model list with SWR caching
 */
export const useModelList = () => {
  const {
    data: providers,
    error,
    isLoading,
  } = useSWR(
    'providers',
    async () => {
      try {
        const providers = await ipcBridge.config.getProviders.invoke();
        return providers;
      } catch (error) {
        logger.error('Failed to fetch providers:', error);
        return [];
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const modelOptions = useMemo(() => {
    if (!providers) return [];

    return providers.reduce<TProviderWithModel[]>((acc, provider) => {
      const models = getAvailableModels(provider);
      if (models.length > 0) {
        models.forEach((model) => {
          acc.push({
            id: provider.id,
            model,
            name: provider.name,
            description: provider.description,
            version: provider.version,
          });
        });
      }
      return acc;
    }, []);
  }, [providers]);

  const groupedOptions = useMemo(() => {
    const groups = modelOptions.reduce<Record<string, TProviderWithModel[]>>((acc, option) => {
      if (!acc[option.name]) {
        acc[option.name] = [];
      }
      acc[option.name].push(option);
      return acc;
    }, {});

    return Object.entries(groups).map(([name, options]) => ({
      name,
      options,
    }));
  }, [modelOptions]);

  return {
    providers,
    modelOptions,
    groupedOptions,
    isLoading,
    error,
  };
};
