/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { logger, LogLevel } from '../logging/Logger';
import { performanceMonitor } from './PerformanceMonitor';
import { errorTracker } from './ErrorTracker';
import { userAnalytics as analytics } from './UserAnalytics';
import { logger } from '@common/monitoring';

// Re-exports for convenience
export { logger, LogLevel };
export { performanceMonitor };
export { errorTracker };
export { analytics };
export type { LogEntry, LoggerConfig } from '../logging/Logger';
export type { PerformanceMetric, AggregatedMetric } from './PerformanceMonitor';
export type { ErrorReport, ErrorContext, ErrorTrackingConfig } from './ErrorTracker';
export type { UserEvent, AnalyticsConfig, AnalyticsData, SessionData } from './UserAnalytics';

/**
 * Initialize monitoring system with default configuration
 */
export function initializeMonitoring(): void {
  // Configure logging
  logger.setLogLevel(LogLevel.INFO);

  // Start performance monitoring
  performanceMonitor.setEnabled(true);

  // Start error tracking
  errorTracker.setEnabled(true);

  logger.info('Monitoring system initialized', 'monitoring');
}

/**
 * Get comprehensive system health status
 */
export function getSystemHealth() {
  const perfSummary = performanceMonitor.getPerformanceSummary();
  const errorStats = errorTracker.getErrorStats();
  const recentLogs = logger.getRecentLogs(50);

  const healthStatus = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    performance: {
      totalOperations: perfSummary.totalMetrics,
      successRate: Math.round(perfSummary.successRate * 100) / 100,
      averageDuration: Math.round(perfSummary.averageDuration * 100) / 100,
      slowestOperation: perfSummary.slowestOperation ? `${perfSummary.slowestOperation.operation} (${perfSummary.slowestOperation.duration}ms)` : 'N/A',
      errorCount: perfSummary.errorCount,
    },
    errors: {
      totalErrors: errorStats.totalErrors,
      errorRateTrend: Math.round(errorStats.errorRateTrend * 100) / 100,
      topErrors: errorStats.topErrors.map((e) => ({
        id: e.id,
        message: e.message,
        count: e.count,
        level: e.level,
        timestamp: e.timestamp,
        resolved: e.resolved,
      })),
      recentErrors: errorStats.recentErrors.map((e) => ({
        id: e.id,
        message: e.message,
        timestamp: e.timestamp,
        count: e.count,
        resolved: e.resolved,
      })),
      resolvedCount: errorStats.resolvedErrors,
    },
    logs: {
      recentCount: recentLogs.length,
      latest: recentLogs[0]?.timestamp || 'N/A',
      levels: {
        error: recentLogs.filter((l) => l.level === LogLevel.ERROR).length,
        warn: recentLogs.filter((l) => l.level === LogLevel.WARN).length,
        info: recentLogs.filter((l) => l.level === LogLevel.INFO).length,
        debug: recentLogs.filter((l) => l.level === LogLevel.DEBUG).length,
      },
    },
  };

  return healthStatus;
}

/**
 * Create a performance timer for a specific operation
 */
export function createTimer(
  operation: string,
  key?: string,
  tags?: Record<string, string>
): {
  timerId: string;
  end: (success?: boolean, reason?: string) => number;
} {
  const timerId = performanceMonitor.startTimer(key || operation, operation, tags);

  return {
    timerId,
    end: (success = true, reason?: string) => {
      return performanceMonitor.endTimer(timerId, success, reason);
    },
  };
}

/**
 * Wrap a function with performance tracking
 */
export async function withPerformanceTracking<T extends any[], R>(fn: (...args: T) => Promise<R>, ...args: T): Promise<R> {
  const timer = createTimer(fn.name, 'function');

  try {
    const start = performance.now();

    const result = await fn(...args);

    timer.end(true);

    return result;
  } catch (error) {
    timer.end(false, error instanceof Error ? error.message : String(error));
    throw error;
  }
}
