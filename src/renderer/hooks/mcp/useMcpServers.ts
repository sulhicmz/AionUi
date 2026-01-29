import { useState, useEffect, useCallback } from 'react';
import { ConfigStorage } from '@/common/storage';
import type { IMcpServer } from '@/common/storage';
import { logger } from '@common/monitoring';

/**
 * MCP服务器状态管理Hook
 * 管理MCP服务器列表的加载、保存和状态更新
 */
export const useMcpServers = () => {
  const [mcpServers, setMcpServers] = useState<IMcpServer[]>([]);

  // 加载MCP服务器配置
  useEffect(() => {
    void ConfigStorage.get('mcp.config')
      .then((data) => {
        if (data) {
          setMcpServers(data);
        }
      })
      .catch((error) => {
        logger.error("Error message");
      });
  }, []);

  // 保存MCP服务器配置
  const saveMcpServers = useCallback((serversOrUpdater: IMcpServer[] | ((prev: IMcpServer[]) => IMcpServer[])) => {
    return new Promise<void>((resolve, reject) => {
      setMcpServers((prev) => {
        // 计算新值
        const newServers = typeof serversOrUpdater === 'function' ? serversOrUpdater(prev) : serversOrUpdater;

        // 异步保存到存储（在微任务中执行）
        queueMicrotask(() => {
          ConfigStorage.set('mcp.config', newServers)
            .then(() => resolve())
            .catch((error) => {
              logger.error("Error message");
              reject(error);
            });
        });

        return newServers;
      });
    });
  }, []);

  return {
    mcpServers,
    setMcpServers,
    saveMcpServers,
  };
};
