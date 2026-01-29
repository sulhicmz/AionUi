import React, { useEffect, useState } from 'react';
import { performanceMonitor, errorTracker, analytics, logger } from '@/common/monitoring';
import type { PerformanceMetrics } from '@/common/monitoring/PerformanceMonitor';
import type { ErrorReport } from '@/common/monitoring/ErrorTracker';
import type { UserEvent } from '@/common/monitoring/UserAnalytics';
import { logger } from '@common/monitoring';

// Type aliases for the dashboard
interface ErrorStats {
  totalErrors: number;
  errorRateTrend: number;
  topErrors: ErrorReport[];
  recentErrors: ErrorReport[];
  resolvedErrors: number;
  total: number;
  critical: number;
  warning: number;
  info: number;
  warnings: number;
}

interface AnalyticsData {
  events: UserEvent[];
  config: any;
  sessionStats?: {
    totalSessions: number;
    totalEvents: number;
    uniquePages: number;
    averageSessionDuration: number;
    errorRate: number;
    featureUsage: Record<string, number>;
  };
  totalSessions: number;
  sessionDuration: number;
  analyticsEnabled: boolean;
}

interface HealthScore {
  score: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  issues: string[];
}

export const SystemHealthDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [errors, setErrors] = useState<ErrorStats | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(5000);

  useEffect(() => {
    const updateDashboard = () => {
      // Get current data from monitoring systems
      setMetrics(performanceMonitor.getCurrentMetrics());
      setErrors(errorTracker.getErrorStats());
      setAnalyticsData(analytics.getStats());

      // Calculate overall health score
      setHealthScore(calculateHealthScore());
    };

    // Initial load
    updateDashboard();

    // Set up auto-refresh
    const interval = setInterval(updateDashboard, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const calculateHealthScore = (): HealthScore => {
    const currentMetrics = performanceMonitor.getCurrentMetrics();
    const errorStats = errorTracker.getErrorStats();

    let score = 100;
    const issues: string[] = [];

    // CPU usage penalty
    if (currentMetrics.cpuUsage > 90) {
      score -= 30;
      issues.push('Very high CPU usage');
    } else if (currentMetrics.cpuUsage > 80) {
      score -= 20;
      issues.push('High CPU usage');
    } else if (currentMetrics.cpuUsage > 70) {
      score -= 10;
      issues.push('Elevated CPU usage');
    }

    // Memory usage penalty
    const memoryUsagePercentage = (currentMetrics.heapUsed / currentMetrics.heapTotal) * 100;
    if (memoryUsagePercentage > 90) {
      score -= 30;
      issues.push('Very high memory usage');
    } else if (memoryUsagePercentage > 80) {
      score -= 20;
      issues.push('High memory usage');
    } else if (memoryUsagePercentage > 70) {
      score -= 10;
      issues.push('Elevated memory usage');
    }

    // API response time penalty
    if (currentMetrics.responseTime > 2000) {
      score -= 25;
      issues.push('Very slow API response');
    } else if (currentMetrics.responseTime > 1000) {
      score -= 15;
      issues.push('Slow API response');
    } else if (currentMetrics.responseTime > 500) {
      score -= 5;
      issues.push('Elevated API response time');
    }

    // Error rate penalty
    if (currentMetrics.errorRate > 10) {
      score -= 40;
      issues.push('Very high error rate');
    } else if (currentMetrics.errorRate > 5) {
      score -= 25;
      issues.push('High error rate');
    } else if (currentMetrics.errorRate > 1) {
      score -= 10;
      issues.push('Elevated error rate');
    }

    // Critical errors penalty
    if (errorStats.critical > 0) {
      score -= 50 * errorStats.critical;
      issues.push(`${errorStats.critical} critical error(s)`);
    }

    let status: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent';
    if (score < 50) {
      status = 'critical';
    } else if (score < 70) {
      status = 'warning';
    } else if (score < 85) {
      status = 'good';
    }

    return {
      score: Math.max(0, score),
      status,
      issues: issues.length > 0 ? issues : ['All systems nominal'],
    };
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 bg-green-100';
      case 'good':
        return 'text-blue-600 bg-blue-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getMetricColor = (value: number, thresholds: { good: number; warning: number; critical: number }): string => {
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const clearErrors = () => {
    errorTracker.clearErrors();
    logger.info('Errors cleared from dashboard');
  };

  const exportMetrics = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      metrics,
      errors,
      analytics: analyticsData,
      healthScore,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-metrics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    logger.info('Metrics exported from dashboard');
  };

  if (!metrics || !errors || !analyticsData || !healthScore) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-gray-500'>Loading system health data...</div>
      </div>
    );
  }

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <h2 className='text-2xl font-bold'>System Health Dashboard</h2>
        <div className='flex items-center space-x-4'>
          <div className='flex items-center space-x-2'>
            <label className='text-sm text-gray-600'>Refresh:</label>
            <select value={refreshInterval} onChange={(e) => setRefreshInterval(Number(e.target.value))} className='border rounded px-2 py-1 text-sm'>
              <option value={1000}>1s</option>
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
            </select>
          </div>
          <button onClick={clearErrors} className='px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600'>
            Clear Errors
          </button>
          <button onClick={exportMetrics} className='px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600'>
            Export
          </button>
        </div>
      </div>

      {/* Overall Health Score */}
      <div className='bg-white rounded-lg shadow p-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='text-lg font-semibold mb-2'>Overall Health Score</h3>
            <div className='flex items-center space-x-4'>
              <div className={`text-3xl font-bold ${getStatusColor(healthScore.status).split(' ')[0]}`}>{healthScore.score}/100</div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthScore.status)}`}>{healthScore.status.toUpperCase()}</div>
            </div>
          </div>
          <div className='text-right'>
            <div className='text-sm text-gray-600 mb-1'>Issues:</div>
            <div className='max-w-xs'>
              {healthScore.issues.slice(0, 3).map((issue, index) => (
                <div key={index} className='text-sm text-gray-800'>
                  {issue}
                </div>
              ))}
              {healthScore.issues.length > 3 && <div className='text-sm text-gray-500'>+{healthScore.issues.length - 3} more...</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {/* CPU Usage */}
        <div className='bg-white rounded-lg shadow p-4'>
          <div className='text-sm text-gray-600 mb-1'>CPU Usage</div>
          <div className={`text-2xl font-bold ${getMetricColor(metrics.cpuUsage, { good: 50, warning: 80, critical: 90 })}`}>{metrics.cpuUsage.toFixed(1)}%</div>
          <div className='text-xs text-gray-500 mt-1'>Load average: {metrics.loadAverage.toFixed(2)}</div>
        </div>

        {/* Memory Usage */}
        <div className='bg-white rounded-lg shadow p-4'>
          <div className='text-sm text-gray-600 mb-1'>Memory Usage</div>
          <div className={`text-2xl font-bold ${getMetricColor((metrics.heapUsed / metrics.heapTotal) * 100, { good: 70, warning: 85, critical: 95 })}`}>{((metrics.heapUsed / metrics.heapTotal) * 100).toFixed(1)}%</div>
          <div className='text-xs text-gray-500 mt-1'>
            {(metrics.heapUsed / 1024 / 1024).toFixed(1)}MB / {(metrics.heapTotal / 1024 / 1024).toFixed(1)}MB
          </div>
        </div>

        {/* API Response Time */}
        <div className='bg-white rounded-lg shadow p-4'>
          <div className='text-sm text-gray-600 mb-1'>API Response Time</div>
          <div className={`text-2xl font-bold ${getMetricColor(metrics.responseTime, { good: 300, warning: 1000, critical: 2000 })}`}>{metrics.responseTime.toFixed(0)}ms</div>
          <div className='text-xs text-gray-500 mt-1'>{metrics.apiCalls} calls</div>
        </div>

        {/* Error Rate */}
        <div className='bg-white rounded-lg shadow p-4'>
          <div className='text-sm text-gray-600 mb-1'>Error Rate</div>
          <div className={`text-2xl font-bold ${getMetricColor(metrics.errorRate, { good: 0, warning: 5, critical: 10 })}`}>{metrics.errorRate.toFixed(1)}%</div>
          <div className='text-xs text-gray-500 mt-1'>{errors.total} total errors</div>
        </div>
      </div>

      {/* Detailed Sections */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Error Breakdown */}
        <div className='bg-white rounded-lg shadow p-6'>
          <h3 className='text-lg font-semibold mb-4'>Error Breakdown</h3>
          <div className='space-y-3'>
            <div className='flex justify-between items-center'>
              <span className='text-gray-600'>Critical Errors:</span>
              <span className='font-bold text-red-600'>{errors.critical}</span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-gray-600'>Warnings:</span>
              <span className='font-bold text-yellow-600'>{errors.warnings}</span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-gray-600'>Info Messages:</span>
              <span className='font-bold text-blue-600'>{errors.info}</span>
            </div>
          </div>

          {errors.recentErrors.length > 0 && (
            <div className='mt-4'>
              <h4 className='font-medium text-gray-700 mb-2'>Recent Errors:</h4>
              <div className='space-y-2 max-h-32 overflow-y-auto'>
                {errors.recentErrors.slice(0, 5).map((error, index) => (
                  <div key={index} className='text-xs bg-gray-50 p-2 rounded'>
                    <div className='font-medium text-gray-800'>{error.context?.operation || 'Unknown'}</div>
                    <div className='text-gray-600 truncate'>{error.message}</div>
                    <div className='text-gray-500'>{new Date(error.timestamp).toLocaleTimeString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Analytics Data */}
        <div className='bg-white rounded-lg shadow p-6'>
          <h3 className='text-lg font-semibold mb-4'>Usage Analytics (Local)</h3>
          <div className='space-y-3'>
            <div className='flex justify-between items-center'>
              <span className='text-gray-600'>Total Sessions:</span>
              <span className='font-bold'>{analyticsData.totalSessions}</span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-gray-600'>Current Session Duration:</span>
              <span className='font-bold'>{Math.round(analyticsData.sessionDuration / 1000)}s</span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-gray-600'>Actions Tracked:</span>
              <span className='font-bold'>{Array.isArray(analyticsData.events) ? analyticsData.events.length : 0}</span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-gray-600'>Data Collection:</span>
              <span className='font-bold text-green-600'>{analyticsData.analyticsEnabled ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>

          {analyticsData.events.length > 0 && (
            <div className='mt-4'>
              <h4 className='font-medium text-gray-700 mb-2'>Recent Actions:</h4>
              <div className='space-y-1 max-h-32 overflow-y-auto'>
                {analyticsData.events
                  .slice(-5)
                  .reverse()
                  .map((event, index) => (
                    <div key={index} className='text-xs bg-gray-50 p-2 rounded'>
                      <div className='font-medium text-gray-800'>{event.action}</div>
                      <div className='text-gray-600'>{event.category}</div>
                      <div className='text-gray-500'>{new Date(event.timestamp).toLocaleTimeString()}</div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* System Info */}
      <div className='bg-white rounded-lg shadow p-6'>
        <h3 className='text-lg font-semibold mb-4'>System Information</h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div>
            <div className='text-sm text-gray-600'>Platform:</div>
            <div className='font-medium'>{metrics.systemInfo.platform}</div>
          </div>
          <div>
            <div className='text-sm text-gray-600'>Architecture:</div>
            <div className='font-medium'>{metrics.systemInfo.arch}</div>
          </div>
          <div>
            <div className='text-sm text-gray-600'>Uptime:</div>
            <div className='font-medium'>{Math.round(metrics.uptime / 1000)}s</div>
          </div>
        </div>
      </div>
    </div>
  );
};
