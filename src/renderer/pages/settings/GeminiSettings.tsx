/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import GeminiModalContent from '@/renderer/components/SettingsModal/contents/GeminiModalContent';
import SettingsPageWrapper from './components/SettingsPageWrapper';
import { logger } from '@common/monitoring';

const GeminiSettings: React.FC = () => {
  return (
    <SettingsPageWrapper>
      <GeminiModalContent />
    </SettingsPageWrapper>
  );
};

export default GeminiSettings;
