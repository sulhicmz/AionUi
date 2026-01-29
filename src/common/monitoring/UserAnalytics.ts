/**
 * @license
 * Copyright 2025 AionUi (aionui.com) - Privacy-First Analytics
 * SPDX-License-Identifier: Apache-2.0
 */

const logger = {
  info: (message: string, ...args: any[]) => logger.info(`Analytics ${message}`),
  warn: (message: string, ...args: any[]) => logger.warn(`Analytics ${message}`),
  error: (message: string, ...args: any[]) => logger.error(`Analytics ${message}`),
  debug: (message: string, ...args: any[]) => console.debug(`[Analytics] ${message}`, ...args),
};

export interface UserEvent {
  type: 'pageview' | 'action' | 'error' | 'feature_used';
  category: string;
  action?: string;
  properties?: Record<string, any>;
  timestamp: string;
  sessionId?: string;
  userId?: string;
  userAgent?: string;
}

export interface AnalyticsConfig {
  enabled: boolean;
  retentionDays: number;
  maxEvents: number;
  anonymizeIPs: boolean;
  consentRequired?: boolean;
  privacyMode?: boolean;
  samplingRate?: number;
  maxEventsPerBatch?: number;
}

export interface AnalyticsData {
  events: UserEvent[];
  config: AnalyticsConfig;
  sessionStats?: {
    totalSessions: number;
    totalEvents: number;
    uniquePages: number;
    averageSessionDuration: number;
    errorRate: number;
    featureUsage: Record<string, number>;
  };
  totalSessions?: number;
  sessionDuration?: number;
  analyticsEnabled?: boolean;
}

export interface SessionData {
  sessionId: string;
  startTime: string;
  endTime?: string;
  pageViews: number;
  events: number;
  duration?: number;
}

export class UserAnalytics {
  private static instance: UserAnalytics;
  private config: AnalyticsConfig;
  private events: UserEvent[] = [];
  private sessions: Map<string, SessionData> = new Map();
  private consentGiven: boolean = false;

  private constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = {
      enabled: true,
      retentionDays: 30,
      maxEvents: 10000,
      anonymizeIPs: true,
      consentRequired: true,
      privacyMode: true,
      samplingRate: 1,
      maxEventsPerBatch: 100,
      ...config,
    };
    this.loadStoredData();
    this.initializeSessionTracking();
  }

  public static getInstance(config?: Partial<AnalyticsConfig>): UserAnalytics {
    if (!UserAnalytics.instance) {
      UserAnalytics.instance = new UserAnalytics(config);
    }
    return UserAnalytics.instance;
  }

  private loadStoredData(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedEvents = window.localStorage.getItem('aion_ui_analytics_events');
        const storedConfig = window.localStorage.getItem('aion_ui_analytics_config');

        if (storedEvents) {
          this.events = JSON.parse(storedEvents);
        }

        if (storedConfig) {
          this.config = { ...this.config, ...JSON.parse(storedConfig) };
        }

        const consent = window.localStorage.getItem('aion_ui_analytics_consent');
        this.consentGiven = consent === 'granted';
      }
    } catch (error) {
      logger.warn('Failed to load stored analytics data:', error);
    }
  }

  private initializeSessionTracking(): void {
    if (this.isConsentRequired() && !this.consentGiven) {
      return;
    }

    const currentSession = this.getCurrentSession();
    if (!currentSession) {
      this.startNewSession();
    }

    this.flushEventsAsync();
  }

  private startNewSession(): void {
    const sessionId = this.generateSessionId();
    const session: SessionData = {
      sessionId,
      startTime: new Date().toISOString(),
      pageViews: 0,
      events: 0,
    };

    this.sessions.set(sessionId, session);
    this.persistData();
  }

  private getCurrentSession(): SessionData | undefined {
    const sessionArray = Array.from(this.sessions.values());
    for (const session of sessionArray) {
      if (!session.endTime) {
        return session;
      }
    }
    return undefined;
  }

  private getSessionId(): string {
    let sessionId = '';
    if (typeof localStorage !== 'undefined') {
      sessionId = localStorage.getItem('analytics_session_id') || '';

      if (!sessionId) {
        sessionId = this.generateSessionId();
        localStorage.setItem('analytics_session_id', sessionId);
      }
    }

    if (!sessionId) {
      sessionId = this.generateSessionId();
    }

    return sessionId;
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  public flushEventsAsync(): void {
    setTimeout(() => {
      this.flushEvents();
    }, 100);
  }

  private flushEvents(): void {
    logger.debug(`Events processed: ${this.events.length}`);
    this.cleanupOldEvents();
  }

  private cleanupOldEvents(): void {
    const retentionMs = this.config.retentionDays * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - retentionMs;

    this.events = this.events.filter((event) => new Date(event.timestamp).getTime() > cutoff);

    if (this.events.length > this.config.maxEvents) {
      this.events = this.events.slice(-this.config.maxEvents);
    }
  }

  public requestConsent(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.consentGiven) {
        resolve(true);
        return;
      }

      resolve(false);
    });
  }

  public grantConsent(): void {
    this.consentGiven = true;
    this.persistData();
    logger.info('Analytics consent granted');
  }

  public revokeConsent(): void {
    this.consentGiven = false;
    this.clearAllData();
    logger.info('Analytics consent revoked');
  }

  public isConsentRequired(): boolean {
    return this.config.consentRequired || false;
  }

  public hasConsent(): boolean {
    return this.consentGiven;
  }

  public trackPageView(page: string, title?: string): void {
    if (this.isCollectionDisabled()) return;

    this.trackEvent('pageview', 'navigation', undefined, {
      page,
      title: title || page,
      referrer: typeof window !== 'undefined' ? window.document.referrer : undefined,
    });
  }

  public trackAction(action: string, category: string, properties?: Record<string, any>): void {
    if (this.isCollectionDisabled()) return;

    this.trackEvent('action', category, action, properties);
  }

  public trackError(error: Error | string, context?: Record<string, any>): void {
    if (this.isCollectionDisabled()) return;

    const errorMessage = error instanceof Error ? error.message : error;
    const stackTrace = error instanceof Error ? error.stack : undefined;

    this.trackEvent('error', 'system', undefined, {
      error: errorMessage,
      stackTrace: this.config.privacyMode ? undefined : stackTrace,
      context,
    });
  }

  public trackFeature(feature: string, properties?: Record<string, any>): void {
    if (this.isCollectionDisabled()) return;

    this.trackEvent('feature_used', 'features', feature, properties);
  }

  private trackEvent(type: UserEvent['type'], category: string, action?: string, properties?: Record<string, any>): void {
    if (this.isCollectionDisabled()) return;

    if (this.config.samplingRate && this.config.samplingRate < 1) {
      if (Math.random() > this.config.samplingRate) {
        return;
      }
    }

    const event: UserEvent = {
      type,
      category,
      action,
      properties: this.sanitizeProperties(properties),
      timestamp: new Date().toISOString(),
      sessionId: this.getCurrentSession()?.sessionId || this.getSessionId(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };

    this.events.push(event);
    this.updateSessionMetrics(type);
    this.persistData();
  }

  private sanitizeProperties(properties?: Record<string, any>): Record<string, any> | undefined {
    if (!properties || !this.config.privacyMode) {
      return properties;
    }

    const sanitized: Record<string, any> = {};
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth', 'credential', 'email', 'phone'];

    for (const [key, value] of Object.entries(properties)) {
      if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string' && value.length > 500) {
        sanitized[key] = value.substring(0, 500) + '...';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private updateSessionMetrics(eventType: UserEvent['type']): void {
    const currentSession = this.getCurrentSession();
    if (!currentSession) return;

    currentSession.events++;

    if (eventType === 'pageview') {
      currentSession.pageViews++;
    }
  }

  private isCollectionDisabled(): boolean {
    return !this.config.enabled || (this.config.consentRequired && !this.consentGiven);
  }

  private persistData(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('aion_ui_analytics_events', JSON.stringify(this.events));
        window.localStorage.setItem('aion_ui_analytics_config', JSON.stringify(this.config));
        window.localStorage.setItem('aion_ui_analytics_consent', this.consentGiven ? 'granted' : 'denied');
      } catch (error) {
        logger.warn('Failed to persist analytics data:', error);
      }
    }
  }

  public endSession(): void {
    const currentSession = this.getCurrentSession();
    if (currentSession) {
      currentSession.endTime = new Date().toISOString();
      currentSession.duration = new Date(currentSession.endTime).getTime() - new Date(currentSession.startTime).getTime();
      this.persistData();
    }
  }

  public getAnalyticsData(): AnalyticsData {
    const sessionStats = {
      totalSessions: this.sessions.size,
      totalEvents: this.events.length,
      uniquePages: new Set(this.events.filter((e) => e.type === 'pageview').map((e) => e.properties?.page)).size,
      averageSessionDuration: this.calculateAverageSessionDuration(),
      errorRate: this.calculateErrorRate(),
      featureUsage: this.calculateFeatureUsage(),
    };

    return {
      events: this.events,
      config: this.config,
      sessionStats,
    };
  }

  private calculateAverageSessionDuration(): number {
    const sessionArray = Array.from(this.sessions.values());
    const completedSessions = sessionArray.filter((s) => s.duration);
    if (completedSessions.length === 0) return 0;

    const totalDuration = completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    return totalDuration / completedSessions.length;
  }

  private calculateErrorRate(): number {
    const totalEvents = this.events.length;
    const errorEvents = this.events.filter((e) => e.type === 'error').length;
    return totalEvents > 0 ? errorEvents / totalEvents : 0;
  }

  private calculateFeatureUsage(): Record<string, number> {
    const usage: Record<string, number> = {};
    this.events
      .filter((e) => e.type === 'feature_used')
      .forEach((e) => {
        const feature = e.action || 'unknown';
        usage[feature] = (usage[feature] || 0) + 1;
      });
    return usage;
  }

  public getRecentEvents(limit: number = 100): UserEvent[] {
    return this.events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
  }

  public getSessions(): SessionData[] {
    return Array.from(this.sessions.values());
  }

  public clearAllData(): void {
    this.events = [];
    this.sessions.clear();
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('aion_ui_analytics_events');
      window.localStorage.removeItem('aion_ui_analytics_config');
      window.localStorage.removeItem('aion_ui_analytics_consent');
      window.localStorage.removeItem('analytics_session_id');
    }
    logger.info('All analytics data cleared');
  }

  public exportAnalyticsData(): string {
    const data = this.getAnalyticsData();
    return JSON.stringify(data, null, 2);
  }

  public getStats(): AnalyticsData {
    const data = this.getAnalyticsData();
    const currentSession = this.getCurrentSession();

    return {
      ...data,
      totalSessions: this.sessions.size,
      sessionDuration: currentSession ? (Date.now() - new Date(currentSession.startTime).getTime()) / 1000 : 0,
      analyticsEnabled: this.config.enabled && this.consentGiven,
    };
  }

  public get sessionId(): string {
    return this.getCurrentSession()?.sessionId || this.getSessionId();
  }

  public async importAnalyticsData(data: string): Promise<void> {
    try {
      const analyticsData = JSON.parse(data);

      if (!analyticsData.events || !Array.isArray(analyticsData.events)) {
        throw new Error('Invalid analytics data format');
      }

      if (analyticsData.config) {
        this.config = { ...this.config, ...analyticsData.config };
      }

      this.events = analyticsData.events;

      if (analyticsData.sessionStats) {
        if (typeof localStorage !== 'undefined' && analyticsData.sessionStats.uniquePages > 0) {
          const latestSessionInfo = analyticsData.events.reverse().find((e: UserEvent) => e.type === 'pageview' && e.sessionId);

          if (latestSessionInfo && latestSessionInfo.sessionId) {
            localStorage.setItem('analytics_session_id', latestSessionInfo.sessionId);
          }
        }
      }

      logger.info(`Imported ${this.events.length} analytics events from backup`, 'analytics');
    } catch (error) {
      logger.error('Failed to import analytics data:', error);
      throw error;
    }
  }
}

export const userAnalytics = UserAnalytics.getInstance();
