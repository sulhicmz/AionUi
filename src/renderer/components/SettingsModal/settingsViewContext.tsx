import React from 'react';
import { logger } from '@common/monitoring';

export type SettingsViewMode = 'modal' | 'page';

const SettingsViewModeContext = React.createContext<SettingsViewMode>('modal');

export const SettingsViewModeProvider = SettingsViewModeContext.Provider;

export const useSettingsViewMode = (): SettingsViewMode => {
  return React.useContext(SettingsViewModeContext);
};
