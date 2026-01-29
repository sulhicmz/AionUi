import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ipcBridge } from '@/common';
import { useConversationTabs } from '@/renderer/pages/conversation/context/ConversationTabsContext';
import { emitter } from '@/renderer/utils/emitter';
import { logger } from '@common/monitoring';

export const useAutoTitle = () => {
  const { t } = useTranslation();
  const { updateTabName } = useConversationTabs();

  const checkAndUpdateTitle = useCallback(
    async (conversationId: string, messageContent: string) => {
      const defaultTitle = t('conversation.welcome.newConversation');
      try {
        const conversation = await ipcBridge.conversation.get.invoke({ id: conversationId });
        // Only update if current name matches the default "New Chat" name
        if (conversation && conversation.name === defaultTitle) {
          // Create title from message: take first 50 chars, remove newlines
          const newTitle = messageContent.split('\n')[0].substring(0, 50).trim();
          if (!newTitle) return; // Don't update if empty

          await ipcBridge.conversation.update.invoke({
            id: conversationId,
            updates: { name: newTitle },
          });

          updateTabName(conversationId, newTitle);
          emitter.emit('chat.history.refresh');
        }
      } catch (error) {
        logger.error("Error message");
      }
    },
    [t, updateTabName]
  );

  return { checkAndUpdateTitle };
};
