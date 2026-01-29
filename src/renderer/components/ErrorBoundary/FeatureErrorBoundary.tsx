import React, { ReactNode } from 'react';
import { ErrorBoundary } from './index';
import { logger } from '@common/monitoring';

interface FeatureErrorBoundaryProps {
  children: ReactNode;
  featureName: string;
  operation?: string;
}

/**
 * Error boundary for specific features (preview, file viewing, etc.)
 */
export const FeatureErrorBoundary: React.FC<FeatureErrorBoundaryProps> = ({ children, featureName, operation }) => {
  return (
    <ErrorBoundary
      context={{
        component: featureName,
        operation,
      }}
      onError={(error: Error, errorInfo: React.ErrorInfo, errorId: string) => {
        logger.warn(`Error in feature ${featureName}:`);
        logger.warn(`Error ID: ${errorId}`);
      }}
      onRetry={() => {
        logger.info(`Retrying feature ${featureName}`);
      }}
      maxRetries={2}
    >
      {children}
    </ErrorBoundary>
  );
};

export default FeatureErrorBoundary;
