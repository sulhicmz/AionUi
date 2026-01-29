/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MetricConfig {
  enabled: boolean;
  intervalMs: number;
  maxAge: number; // milliseconds
  aggregationWindow: number; // milliseconds for aggregation
}

export interface MetricValue {
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface AggregatedMetric {
  key: string;
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface PerformanceMetric {
  key: string;
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  metadata?: Record<string, any>;
  tags?: Record<string, string>;
}

export interface PerformanceMetrics {
  totalOperations: number;
  successRate: number;
  averageDuration: number;
  slowestOperation: { operation: string; duration: number } | null;
  errorCount: number;
  cpuUsage: number;
  loadAverage: number;
  heapUsed: number;
  heapTotal: number;
  responseTime: number;
  apiCalls: number;
  errorRate: number;
  timestamp: number;
  systemInfo?: {
    platform: string;
    arch: string;
    nodeVersion: string;
    electronVersion: string;
  };
  uptime?: number;
}

/**
 * Performance monitoring system for tracking key operations
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private config: MetricConfig;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private aggregations: Map<string, AggregatedMetric> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  private constructor(config: MetricConfig) {
    this.config = config;

    // Start aggregation cleanup
    if (this.config.enabled) {
      setInterval(() => this.cleanupAggregations(), this.config.intervalMs);
    }
  }

  public static getInstance(config?: MetricConfig): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      const defaultConfig: MetricConfig = {
        enabled: true,
        intervalMs: 60000, // 1 minute
        maxAge: 300000, // 5 minutes
        aggregationWindow: 10000, // 10 seconds
      };
      PerformanceMonitor.instance = new PerformanceMonitor(defaultConfig);
      return PerformanceMonitor.instance;
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start timing a performance metric
   */
  public startTimer(key: string, operation: string, tags?: Record<string, string>): string {
    if (!this.config.enabled) return '';

    const timerId = crypto.randomUUID();
    const now = performance.now();
    const metric: PerformanceMetric = {
      key,
      operation,
      startTime: now,
      endTime: undefined,
      duration: undefined,
      success: true,
      metadata: { timerId },
      tags,
    };

    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    this.metrics.get(key)!.push(metric);

    // Auto-end timer after maxAge to prevent leaks
    const timer = setTimeout(() => {
      this.endTimer(timerId, false, 'timeout');
    }, this.config.maxAge);

    this.timers.set(timerId, timer);
    return timerId;
  }

  /**
   * End timing a performance metric and record it
   */
  public endTimer(timerId: string, success: boolean = true, reason?: string): number {
    if (!this.config.enabled) return 0;

    // Find the metric by timerId
    for (const [key, metrics] of this.metrics.entries()) {
      for (let i = metrics.length - 1; i >= 0; i--) {
        // Check if this metric is still running
        if (metrics[i].endTime !== undefined) continue;

        // Find the timer for this metric
        if (this.timers.has(timerId)) {
          clearTimeout(this.timers.get(timerId)!);
          this.timers.delete(timerId);

          const metric = metrics[i];
          metric.endTime = performance.now();
          metric.duration = metric.endTime - metric.startTime;
          metric.success = success;

          // Add reason if provided
          if (reason && metric.metadata) {
            metric.metadata.reason = reason;
          }

          return metric.duration;
        }
      }
    }

    return 0;
  }

  /**
   * Record a simple metric value
   */
  public recordMetric(key: string, value: number, tags?: Record<string, string>): void {
    if (!this.config.enabled) return;

    const now = performance.now();
    this.updateAggregation(key, value, now, tags);

    // Keep raw metrics for detailed analysis (limited count)
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
      // Clean old metrics
      this.cleanOldMetrics(key);
    }

    this.metrics.get(key)!.push({
      key,
      operation: 'record',
      startTime: now,
      endTime: now,
      duration: 0,
      success: true,
      metadata: { value },
      tags,
    });
  }

  private updateAggregation(key: string, value: number, timestamp: number, tags?: Record<string, string>): void {
    const aggregationKey = this.getAggregationKey(key, tags);
    const now = timestamp;

    let agg = this.aggregations.get(aggregationKey);

    if (!agg || now - agg.timestamp > this.config.aggregationWindow) {
      agg = {
        key: aggregationKey,
        count: 0,
        sum: 0,
        min: value,
        max: value,
        avg: value,
        timestamp: now,
        tags,
      };
      this.aggregations.set(aggregationKey, agg);
    }

    agg.count++;
    agg.sum += value;
    agg.min = Math.min(agg.min, value);
    agg.max = Math.max(agg.max, value);
    agg.avg = agg.sum / agg.count;
    agg.timestamp = now;
  }

  private getAggregationKey(key: string, tags?: Record<string, string>): string {
    if (!tags) return key;

    const tagPairs = Object.entries(tags)
      .sort(([k, v], [k2, v2]) => {
        const keyCompare = k.localeCompare(k2);
        return keyCompare !== 0 ? keyCompare : String(v).localeCompare(String(v2));
      })
      .map(([k, v]) => `${k}=${String(v)}`)
      .join('&');

    return `${key}?${tagPairs}`;
  }

  private cleanOldMetrics(key: string): void {
    const metrics = this.metrics.get(key);
    if (!metrics) return;

    const cutoff = performance.now() - this.config.maxAge;
    const filtered = metrics.filter((m) => m.endTime && m.endTime > cutoff);

    this.metrics.set(key, filtered);
  }

  private cleanupAggregations(): void {
    const now = performance.now();

    for (const [key, agg] of this.aggregations.entries()) {
      if (now - agg.timestamp > this.config.maxAge) {
        this.aggregations.delete(key);
      }
    }
  }

  /**
   * Get aggregated metrics for a time period
   */
  public getAggregatedMetrics(key?: string): AggregatedMetric[] {
    if (!this.config.enabled) return [];

    const aggregations = Array.from(this.aggregations.values());

    if (key) {
      return aggregations.filter((agg) => agg.key.startsWith(key));
    }

    return aggregations;
  }

  /**
   * Get raw performance metrics
   */
  public getMetrics(key?: string, limit = 100): PerformanceMetric[] {
    if (!this.config.enabled) return [];

    const allMetrics: PerformanceMetric[] = [];

    if (key) {
      const metrics = this.metrics.get(key);
      if (metrics) allMetrics.push(...metrics);
    } else {
      for (const metrics of this.metrics.values()) {
        allMetrics.push(...metrics);
      }
    }

    // Sort by timestamp descending and limit
    return allMetrics.sort((a, b) => b.startTime - a.startTime).slice(0, limit);
  }

  /**
   * Helper methods for getCurrentMetrics
   */
  private calculateSuccessRate(): number {
    let total = 0;
    let successful = 0;

    for (const metricArray of this.metrics.values()) {
      total += metricArray.length;
      successful += metricArray.filter((m) => m.success).length;
    }

    return total > 0 ? successful / total : 1.0;
  }

  private calculateAverageDuration(): number {
    const durations: number[] = [];

    for (const metricArray of this.metrics.values()) {
      for (const metric of metricArray) {
        if (metric.duration !== undefined) {
          durations.push(metric.duration);
        }
      }
    }

    return durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0;
  }

  private findSlowestOperation(): { operation: string; duration: number } | null {
    let slowest: { operation: string; duration: number } | null = null;

    for (const metricArray of this.metrics.values()) {
      for (const metric of metricArray) {
        if (metric.duration !== undefined) {
          if (!slowest || metric.duration > slowest.duration) {
            slowest = {
              operation: metric.operation,
              duration: metric.duration,
            };
          }
        }
      }
    }

    return slowest;
  }

  private countErrors(): number {
    let errors = 0;

    for (const metricArray of this.metrics.values()) {
      errors += metricArray.filter((m) => !m.success).length;
    }

    return errors;
  }

  /**
   * Get performance summary
   */
  public getPerformanceSummary(): {
    totalMetrics: number;
    successRate: number;
    averageDuration: number;
    slowestOperation: { operation: string; duration: number } | null;
    errorCount: number;
  } {
    if (!this.config.enabled) {
      return {
        totalMetrics: 0,
        successRate: 1.0,
        averageDuration: 0,
        slowestOperation: null,
        errorCount: 0,
      };
    }

    const allMetrics: PerformanceMetric[] = [];
    for (const metrics of this.metrics.values()) {
      allMetrics.push(...metrics.filter((m) => m.endTime !== undefined));
    }

    const completedMetrics = allMetrics.filter((m) => m.endTime !== undefined);
    const successfulMetrics = completedMetrics.filter((m) => m.success);
    const durations = completedMetrics.map((m) => m.duration!).sort((a, b) => b - a);

    const slowestMetric = durations.length > 0 ? allMetrics.find((m) => m.duration === durations[durations.length - 1]) || null : null;
    const slowest =
      slowestMetric && slowestMetric.duration
        ? {
            operation: slowestMetric.operation,
            duration: slowestMetric.duration,
          }
        : null;

    return {
      totalMetrics: allMetrics.length,
      successRate: allMetrics.length > 0 ? successfulMetrics.length / allMetrics.length : 1.0,
      averageDuration: durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0,
      slowestOperation: slowest,
      errorCount: allMetrics.length - successfulMetrics.length,
    };
  }

  /**
   * Enable or disable performance monitoring
   */
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Clear all performance data
   */
  public clearData(): void {
    this.metrics.clear();
    this.aggregations.clear();
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
  }

  public getCurrentMetrics(): PerformanceMetrics {
    const memUsage = process.memoryUsage();

    return {
      totalOperations: this.getTotalOperations(),
      successRate: this.calculateSuccessRate(),
      averageDuration: this.calculateAverageDuration(),
      slowestOperation: this.findSlowestOperation(),
      errorCount: this.getErrorCount(),
      cpuUsage: 0,
      loadAverage: 0,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      responseTime: this.calculateAverageDuration(),
      apiCalls: this.getTotalOperations(),
      errorRate: this.getErrorCount() / Math.max(1, this.getTotalOperations()),
      timestamp: Date.now(),
      systemInfo: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.versions.node,
        electronVersion: process.versions.electron || 'N/A',
      },
      uptime: process.uptime(),
    };
  }

  private getTotalOperations(): number {
    let total = 0;
    for (const metricArray of this.metrics.values()) {
      total += metricArray.length;
    }
    return total;
  }

  private getErrorCount(): number {
    let errors = 0;
    for (const metricArray of this.metrics.values()) {
      errors += metricArray.filter((m) => !m.success).length;
    }
    return errors;
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();
