/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  metadata?: Record<string, any>;
  error?: {
    name?: string;
    message?: string;
    stack?: string;
  };
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  maxFileSize: number;
  maxFiles: number;
  logDirectory: string;
}

/**
 * Structured logging system for AionUi
 */
export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private bufferSize = 1000;

  private constructor(config: LoggerConfig) {
    this.config = config;
  }

  public static getInstance(config?: LoggerConfig): Logger {
    if (!Logger.instance) {
      const defaultConfig: LoggerConfig = {
        level: LogLevel.INFO,
        enableConsole: true,
        enableFile: false,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        logDirectory: './logs',
        ...config,
      };
      Logger.instance = new Logger(defaultConfig);
    }
    return Logger.instance;
  }

  private createLogEntry(level: LogLevel, message: string, context?: string, metadata?: Record<string, any>, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (context) entry.context = context;
    if (metadata) entry.metadata = metadata;
    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  private formatLogEntry(entry: LogEntry): string {
    const { timestamp, level, message, context, metadata, error } = entry;

    const levelStr = LogLevel[level];
    const contextStr = context ? `[${context}] ` : '';
    const metaStr = metadata ? ` ${JSON.stringify(metadata)}` : '';
    const errorStr = error ? `\n${error.stack || error.message}` : '';

    return `${contextStr}${levelStr}: ${message}${metaStr}${errorStr}`;
  }

  private log(entry: LogEntry): void {
    // Add to buffer
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.bufferSize) {
      this.logBuffer.shift();
    }

    // Console output
    if (this.config.enableConsole) {
      const formattedMessage = this.formatLogEntry(entry);
      switch (entry.level) {
        case LogLevel.ERROR:
          logger.error("Error message");
          break;
        case LogLevel.WARN:
          logger.warn("Warning message");
          break;
        case LogLevel.INFO:
          console.info(formattedMessage);
          break;
        case LogLevel.DEBUG:
          console.debug(formattedMessage);
          break;
      }
    }

    // File output (simplified for now)
    if (this.config.enableFile) {
      // In a real implementation, you would write to a rotating log file
      // For now, we'll keep it in memory
    }
  }

  public error(message: string, context?: string, metadata?: Record<string, any>, error?: Error): void {
    if (this.config.level >= LogLevel.ERROR) {
      this.log(this.createLogEntry(LogLevel.ERROR, message, context, metadata, error));
    }
  }

  public warn(message: string, context?: string, metadata?: Record<string, any>): void {
    if (this.config.level >= LogLevel.WARN) {
      this.log(this.createLogEntry(LogLevel.WARN, message, context, metadata));
    }
  }

  public info(message: string, context?: string, metadata?: Record<string, any>): void {
    if (this.config.level >= LogLevel.INFO) {
      this.log(this.createLogEntry(LogLevel.INFO, message, context, metadata));
    }
  }

  public debug(message: string, context?: string, metadata?: Record<string, any>): void {
    if (this.config.level >= LogLevel.DEBUG) {
      this.log(this.createLogEntry(LogLevel.DEBUG, message, context, metadata));
    }
  }

  public getRecentLogs(count: number = 100): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  public clearLogs(): void {
    this.logBuffer = [];
  }

  public setLogLevel(level: LogLevel): void {
    this.config.level = level;
  }
}

// Export singleton instance
export const logger = Logger.getInstance();
