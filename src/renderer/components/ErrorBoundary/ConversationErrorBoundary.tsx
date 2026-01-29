import React, { ReactNode } from 'react';
import { ErrorBoundary } from './index';
import { logger } from '@common/monitoring';

interface ConversationErrorBoundaryProps {
  children: ReactNode;
  conversationId?: string;
}

/**
 * Error boundary specifically for conversation components
 * Provides conversation-specific error isolation and recovery
 */
export const ConversationErrorBoundary: React.FC<ConversationErrorBoundaryProps> = ({ children, conversationId }) => {
  return (
    <ErrorBoundary
      context={{
        component: 'Conversation',
        operation: 'chat-interaction',
        conversationId,
      }}
      onError={(error: Error, errorInfo: React.ErrorInfo, errorId: string) => {
        logger.warn(`Error in conversation ${conversationId || 'unknown'}:`);
        logger.warn(`Error ID: ${errorId}`);
      }}
      onRetry={() => {
        logger.info(`Retrying conversation ${conversationId || 'unknown'}`);
      }}
      maxRetries={3}
    >
      {children}
    </ErrorBoundary>
  );
};

export default ConversationErrorBoundary;
