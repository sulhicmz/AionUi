/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Card, Typography } from '@arco-design/web-react';
import { IconRefresh, IconBug } from '@arco-design/web-react/icon';
import { errorTracker } from '@/common/monitoring/ErrorTracker';
import { logger } from '@/common/logging/Logger';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  onRetry?: () => void;
  maxRetries?: number;
  context?: {
    component?: string;
    operation?: string;
    conversationId?: string;
    agentType?: string;
  };
}

/**
 * Base Error Boundary component with comprehensive error handling
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static defaultProps: Partial<ErrorBoundaryProps> = {
    maxRetries: 3,
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = errorTracker.trackError('error', error.message, error, {
      component: this.props.context?.component || 'Unknown',
      operation: this.props.context?.operation,
      conversationId: this.props.context?.conversationId,
      agentType: this.props.context?.agentType,
      stackTrace: errorInfo.componentStack,
    });

    logger.error('React error boundary caught an error', {
      errorId,
      errorMessage: error.message,
      component: this.props.context?.component,
      stackTrace: error.stack,
      componentStack: errorInfo.componentStack,
    });

    this.setState({
      error,
      errorInfo,
      errorId,
    });

    this.props.onError?.(error, errorInfo, errorId);
  }

  handleRetry = () => {
    if (this.state.retryCount < (this.props.maxRetries || 3)) {
      this.setState((prevState) => ({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        errorId: undefined,
        retryCount: prevState.retryCount + 1,
      }));

      this.props.onRetry?.();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className='m-4 p-6 max-w-2xl mx-auto'>
          <div className='text-center'>
            <IconBug className='text-6xl text-red-500 mb-4 mx-auto' />

            <Typography.Title heading={4} className='mb-4'>
              Something went wrong
            </Typography.Title>

            <Typography.Text className='block mb-4 text-gray-600'>
              {this.props.context?.component && (
                <>
                  Component: <strong>{this.props.context.component}</strong>
                  <br />
                </>
              )}
              {this.state.error?.message || 'An unexpected error occurred'}
            </Typography.Text>

            {process.env.NODE_ENV === 'development' && (
              <details className='mb-4 text-left'>
                <summary className='cursor-pointer text-sm text-gray-500 mb-2'>Error Details (Development Mode)</summary>
                <div className='bg-gray-100 p-3 rounded text-xs font-mono overflow-auto max-h-48'>
                  <div className='mb-2'>
                    <strong>Error:</strong> {this.state.error?.message}
                  </div>
                  <div className='mb-2'>
                    <strong>Stack:</strong>
                    <pre className='whitespace-pre-wrap'>{this.state.error?.stack}</pre>
                  </div>
                  <div className='mb-2'>
                    <strong>Component Stack:</strong>
                    <pre className='whitespace-pre-wrap'>{this.state.errorInfo?.componentStack}</pre>
                  </div>
                  <div className='mb-2'>
                    <strong>Error ID:</strong> {this.state.errorId}
                  </div>
                  <div className='mb-2'>
                    <strong>Retry Count:</strong> {this.state.retryCount} / {this.props.maxRetries}
                  </div>
                </div>
              </details>
            )}

            <div className='flex justify-center gap-3'>
              <Button type='primary' icon={<IconRefresh />} onClick={this.handleRetry} disabled={this.state.retryCount >= (this.props.maxRetries || 3)}>
                {this.state.retryCount >= (this.props.maxRetries || 3) ? 'Max Retries Reached' : 'Try Again'}
              </Button>

              <Button onClick={() => window.location.reload()}>Reload Application</Button>
            </div>

            {this.state.retryCount >= (this.props.maxRetries || 3) && <Typography.Text className='block mt-4 text-sm text-orange-600'>Maximum retry attempts reached. Please reload the application or contact support if the problem persists.</Typography.Text>}

            {this.state.errorId && <Typography.Text className='block mt-2 text-xs text-gray-500'>Error ID: {this.state.errorId}</Typography.Text>}
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
