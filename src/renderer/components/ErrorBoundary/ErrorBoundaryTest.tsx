import React from 'react';
import { Button, Card, Space, Typography } from '@arco-design/web-react';
import { ErrorBoundary, ConversationErrorBoundary, FeatureErrorBoundary } from './index';
import { logger } from '@common/monitoring';

/**
 * Component that intentionally throws an error for testing
 */
const ErrorComponent: React.FC<{ shouldError?: boolean; errorType?: 'render' | 'callback' }> = ({ shouldError = false, errorType = 'render' }) => {
  const [throwError, setThrowError] = React.useState(false);

  if (shouldError || throwError) {
    if (errorType === 'render') {
      throw new Error('Intentional render error for testing');
    }
  }

  if (errorType === 'callback') {
    return (
      <Button onClick={() => setThrowError(true)} type='primary' status='danger'>
        Trigger Callback Error
      </Button>
    );
  }

  return <div>Normal Component</div>;
};

/**
 * Async error component for testing promise rejections
 */
const AsyncErrorComponent: React.FC = () => {
  const [error, setError] = React.useState<string | null>(null);

  const triggerAsyncError = async () => {
    try {
      await new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Async error')), 100);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown async error');
    }
  };

  if (error) {
    throw new Error(error);
  }

  return (
    <Button onClick={triggerAsyncError} status='warning'>
      Trigger Async Error
    </Button>
  );
};

/**
 * Nested error components for testing error boundary isolation
 */
const NestedErrorComponent: React.FC = () => {
  return (
    <div>
      <h3>Nested Components</h3>
      <ConversationErrorBoundary conversationId='test-conv-1'>
        <div>
          <h4>Conversation Boundary</h4>
          <ErrorComponent shouldError={false} />
          <FeatureErrorBoundary featureName='TestFeature' operation='test-operation'>
            <div>
              <h5>Feature Boundary</h5>
              <ErrorComponent shouldError={false} errorType='callback' />
            </div>
          </FeatureErrorBoundary>
        </div>
      </ConversationErrorBoundary>

      <div style={{ marginTop: '20px' }}>
        <h4>Outside any boundary (should bubble to root)</h4>
        <ErrorComponent shouldError={false} />
      </div>
    </div>
  );
};

/**
 * Error Boundary Test Component
 */
export const ErrorBoundaryTest: React.FC = () => {
  const [testScenarios, setTestScenarios] = React.useState<Record<string, boolean>>({});

  const toggleScenario = (scenario: string) => {
    setTestScenarios((prev) => ({
      ...prev,
      [scenario]: !prev[scenario],
    }));
  };

  return (
    <div className='p-6 max-w-6xl mx-auto'>
      <Typography.Title heading={2}>Error Boundary Test Suite</Typography.Title>

      <Space direction='vertical' size='large' className='w-full'>
        {/* Test 1: Basic Error Boundary */}
        <Card title='1. Basic Error Boundary Test'>
          <Space>
            <Button onClick={() => toggleScenario('basic')}>{testScenarios.basic ? 'Reset' : 'Trigger Render Error'}</Button>
            <ErrorBoundary>
              <ErrorComponent shouldError={testScenarios.basic} />
            </ErrorBoundary>
          </Space>
        </Card>

        {/* Test 2: Conversation Error Boundary */}
        <Card title='2. Conversation Error Boundary Test'>
          <Space>
            <Button onClick={() => toggleScenario('conversation')}>{testScenarios.conversation ? 'Reset' : 'Trigger Conversation Error'}</Button>
            <ConversationErrorBoundary conversationId='test-conversation'>
              <ErrorComponent shouldError={testScenarios.conversation} />
            </ConversationErrorBoundary>
          </Space>
        </Card>

        {/* Test 3: Feature Error Boundary */}
        <Card title='3. Feature Error Boundary Test'>
          <Space>
            <Button onClick={() => toggleScenario('feature')}>{testScenarios.feature ? 'Reset' : 'Trigger Feature Error'}</Button>
            <FeatureErrorBoundary featureName='TestFeature' operation='test-operation'>
              <ErrorComponent shouldError={testScenarios.feature} />
            </FeatureErrorBoundary>
          </Space>
        </Card>

        {/* Test 4: Async Error Handling */}
        <Card title='4. Async Error Test'>
          <FeatureErrorBoundary featureName='AsyncTest'>
            <AsyncErrorComponent />
          </FeatureErrorBoundary>
        </Card>

        {/* Test 5: Nested Boundaries */}
        <Card title='5. Nested Error Boundaries'>
          <NestedErrorComponent />
        </Card>

        {/* Test 6: Error Recovery */}
        <Card title='6. Error Recovery Test (Max Retries)'>
          <ErrorBoundary maxRetries={3}>
            <div>
              <Typography.Text>This error boundary allows 3 retries. Try triggering an error multiple times.</Typography.Text>
              <div className='mt-2'>
                <ErrorComponent errorType='callback' />
              </div>
            </div>
          </ErrorBoundary>
        </Card>
      </Space>
    </div>
  );
};

export default ErrorBoundaryTest;
