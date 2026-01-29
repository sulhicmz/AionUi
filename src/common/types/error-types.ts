/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Error handling types and utilities
 * Replaces `any` types in catch blocks with proper error types
 */

// Standard error interface for caught exceptions
export interface CaughtError {
  message?: string;
  code?: string | number;
  stack?: string;
  [key: string]: unknown;
}

// Database operation error
export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly operation?: string,
    public readonly code?: string | number,
    public readonly originalError?: CaughtError
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// File system operation error
export class FileOperationError extends Error {
  constructor(
    message: string,
    public readonly operation?: string,
    public readonly filePath?: string,
    public readonly originalError?: CaughtError
  ) {
    super(message);
    this.name = 'FileOperationError';
  }
}

// Type guard for caught errors
export function isCaughtError(error: unknown): error is CaughtError {
  return error !== null && typeof error === 'object';
}

// Safe error parsing utility
export function parseError(error: unknown): CaughtError {
  if (isCaughtError(error)) {
    return {
      message: error.message || String(error),
      code: error.code,
      stack: error.stack,
      ...error,
    };
  }

  return {
    message: String(error),
  };
}

// Safe error logging utility
export function logError(error: unknown, context?: string): void {
  const parsed = parseError(error);

  logger.error(`${context || 'Unknown'} Error:`);

  if (parsed.code) {
    logger.error(`Code:`);
  }

  if (parsed.stack) {
    logger.error(`Stack:`);
  }
}

// Error handler wrapper for async operations
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(operation: T, context: string): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await operation(...args);
    } catch (error) {
      const parsed = parseError(error);
      logError(error, context);
      throw new DatabaseError(`Operation failed in ${context}: ${parsed.message}`, context, parsed.code, parsed);
    }
  }) as T;
}

// Result type for operations that might fail
export interface OperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string | number;
    originalError?: CaughtError;
  };
}

// Safe operation wrapper
export async function safeOperation<T>(operation: () => Promise<T>, context: string): Promise<OperationResult<T>> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const parsed = parseError(error);
    logError(error, context);

    return {
      success: false,
      error: {
        message: parsed.message,
        code: parsed.code,
        originalError: parsed,
      },
    };
  }
}
