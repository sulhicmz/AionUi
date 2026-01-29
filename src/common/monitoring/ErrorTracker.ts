/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ErrorContext {
  userAgent?: string;
  conversationId?: string;
  agentType?: string;
  operation?: string;
  component?: string;
  stackTrace?: string;
  additionalData?: Record<string, any>;
}

export interface ErrorReport {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  context?: ErrorContext;
  stack?: string;
  fingerprint: string;
  count: number;
  resolved: boolean;
  resolvedAt?: string;
}

export interface ErrorStats {
  totalErrors: number;
  errorRateTrend: number;
  topErrors: ErrorReport[];
  recentErrors: ErrorReport[];
  resolvedErrors: number;
  critical: number;
  warning: number;
  info: number;
  total: number;
  warnings: number;
}

export interface ErrorTrackingConfig {
  enabled: boolean;
  maxErrors: number;
  retentionDays: number;
  autoReport: boolean;
  aggregationWindow: number; // milliseconds
}

/**
 * Error tracking and reporting system
 */
export class ErrorTracker {
  private static instance: ErrorTracker;
  private config: ErrorTrackingConfig;
  private errors: Map<string, ErrorReport> = new Map();
  private errorCounts: Map<string, number> = new Map();

  private constructor(config: ErrorTrackingConfig) {
    this.config = config;

    // Start cleanup process
    if (this.config.enabled) {
      setInterval(() => this.cleanupOldErrors(), this.config.aggregationWindow * 10);
    }
  }

  public static getInstance(config?: ErrorTrackingConfig): ErrorTracker {
    if (!ErrorTracker.instance) {
      const defaultConfig: ErrorTrackingConfig = {
        enabled: true,
        maxErrors: 1000,
        retentionDays: 30,
        autoReport: false,
        aggregationWindow: 60000, // 1 minute
      };
      ErrorTracker.instance = new ErrorTracker(defaultConfig);
      return ErrorTracker.instance;
    }
    return ErrorTracker.instance;
  }

  /**
   * Generate a fingerprint for an error to deduplicate
   */
  private generateFingerprint(message: string, stack?: string, context?: ErrorContext): string {
    const normalizedMessage = message.trim().toLowerCase();
    const normalizedStack = (stack || '').split('\n')[0]?.trim() || '';

    const contextString = context
      ? JSON.stringify({
          component: context.component,
          operation: context.operation,
          agentType: context.agentType,
        })
      : '';

    // Create fingerprint from stack trace context
    const stackContext = normalizedStack.substring(0, 100);

    return btoa(`${normalizedMessage}|${stackContext}|${contextString}`).substring(0, 32);
  }

  /**
   * Track an error occurrence
   */
  public trackError(level: 'error' | 'warning' | 'info', message: string, error?: Error, context?: ErrorContext): string {
    if (!this.config.enabled) return '';

    const fingerprint = this.generateFingerprint(message, error?.stack, context);
    const timestamp = new Date().toISOString();

    // Update error count
    const currentCount = this.errorCounts.get(fingerprint) || 0;
    this.errorCounts.set(fingerprint, currentCount + 1);

    let errorReport = this.errors.get(fingerprint);

    if (!errorReport) {
      errorReport = {
        id: crypto.randomUUID(),
        timestamp,
        level,
        message,
        fingerprint,
        count: 0,
        resolved: false,
      };
      this.errors.set(fingerprint, errorReport);
    }

    // Update error report
    errorReport.level = level;
    errorReport.count = currentCount + 1;
    errorReport.timestamp = timestamp;
    errorReport.context = context;
    errorReport.stack = error?.stack;

    // Auto-report if enabled
    if (this.config.autoReport && level === 'error') {
      this.reportError(errorReport);
    }

    return errorReport.id;
  }

  /**
   * Mark an error as resolved
   */
  public resolveError(errorId: string, resolution?: string): void {
    if (!this.config.enabled) return;

    const error = this.errors.get(errorId);
    if (error) {
      error.resolved = true;
      error.resolvedAt = new Date().toISOString();

      if (resolution) {
        error.message += `\n\nResolution: ${resolution}`;
      }
    }
  }

  /**
   * Send error report to external service
   */
  private async reportError(error: ErrorReport): Promise<void> {
    try {
      // In a real implementation, this would send to an error tracking service
      // For now, we'll just log it
      logger.error('[Error Report]', {
        id: error.id,
        level: error.level,
        message: error.message,
        context: error.context,
        fingerprint: error.fingerprint,
        count: error.count,
      });

      // Could integrate with services like Sentry, LogRocket, etc.
      // await fetch('https://api.error-tracking.com/report', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(error),
      // });
    } catch (reportingError) {
      logger.error("Error message");
    }
  }

  /**
   * Get error statistics
   */
  public getErrorStats(): ErrorStats {
    const allErrors = Array.from(this.errors.values());
    const resolvedErrors = allErrors.filter((e) => e.resolved);
    const recentErrors = allErrors
      .filter((e) => !e.resolved)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    const topErrors = allErrors.sort((a, b) => b.count - a.count).slice(0, 20);

    // Simple trend calculation (last 24 hours vs previous 24 hours)
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const recentErrors24h = allErrors.filter((e) => new Date(e.timestamp).getTime() > oneDayAgo && !e.resolved).length;
    const olderErrors24h = allErrors.filter((e) => new Date(e.timestamp).getTime() <= oneDayAgo && !e.resolved).length;

    const critical = allErrors.filter((e) => e.level === 'error').length;
    const warning = allErrors.filter((e) => e.level === 'warning').length;
    const info = allErrors.filter((e) => e.level === 'info').length;

    return {
      totalErrors: allErrors.length,
      errorRateTrend: olderErrors24h > 0 ? recentErrors24h / olderErrors24h : 0,
      topErrors,
      recentErrors,
      resolvedErrors: resolvedErrors.length,
      critical,
      warning,
      info,
      total: allErrors.length,
      warnings: warning,
    };
  }

  /**
   * Get error reports for a specific criteria
   */
  public getErrors(criteria?: { level?: 'error' | 'warning' | 'info'; resolved?: boolean; context?: string; component?: string; limit?: number }): ErrorReport[] {
    let errors = Array.from(this.errors.values());

    // Apply filters
    if (criteria?.level) {
      errors = errors.filter((e) => e.level === criteria.level);
    }
    if (criteria?.resolved !== undefined) {
      errors = errors.filter((e) => e.resolved === criteria.resolved);
    }
    if (criteria?.context) {
      errors = errors.filter((e) => e.context?.operation === criteria.context || e.context?.component === criteria.context);
    }
    if (criteria?.component) {
      errors = errors.filter((e) => e.context?.component === criteria.component);
    }

    // Sort by count descending
    errors = errors.sort((a, b) => b.count - a.count);

    if (criteria?.limit) {
      errors = errors.slice(0, criteria.limit);
    }

    return errors;
  }

  /**
   * Clear old errors beyond retention period
   */
  private cleanupOldErrors(): void {
    if (!this.config.enabled) return;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    for (const [id, error] of this.errors.entries()) {
      if (new Date(error.timestamp) < cutoffDate && error.resolved) {
        this.errors.delete(id);
        this.errorCounts.delete(id);
      }
    }

    // Enforce max errors limit
    if (this.errors.size > this.config.maxErrors) {
      const entries = Array.from(this.errors.entries()).sort((a, b) => new Date(b[1].timestamp).getTime() - new Date(a[1].timestamp).getTime());

      // Remove oldest errors beyond limit
      const toRemove = entries.slice(this.config.maxErrors);
      for (const [id] of toRemove) {
        this.errors.delete(id);
        this.errorCounts.delete(id);
      }
    }
  }

  /**
   * Enable or disable error tracking
   */
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Clear all error data
   */
  public clearErrors(): void {
    this.errors.clear();
    this.errorCounts.clear();
  }

  /**
   * Get error details by ID
   */
  public getErrorById(errorId: string): ErrorReport | undefined {
    return this.errors.get(errorId);
  }
}

// Export singleton instance
export const errorTracker = ErrorTracker.getInstance();
