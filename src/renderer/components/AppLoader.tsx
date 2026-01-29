import { Spin } from '@arco-design/web-react';
import React from 'react';
import { logger } from '@common/monitoring';

const AppLoader: React.FC = () => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <Spin dot />
    </div>
  );
};

export default AppLoader;
