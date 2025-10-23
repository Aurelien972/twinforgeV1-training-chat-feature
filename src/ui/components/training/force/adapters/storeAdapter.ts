/**
 * Store Adapter
 * Adapter for Zustand stores to isolate external dependencies
 */

import { useGlobalChatStore } from '../../../../../system/store/globalChatStore';

/**
 * Chat store adapter interface
 */
export interface ChatStoreAdapter {
  openChat: () => void;
  closeChat: () => void;
  isOpen: () => boolean;
}

/**
 * Hook to access chat store adapter
 */
export const useChatStoreAdapter = (): ChatStoreAdapter => {
  const { open, close, isOpen } = useGlobalChatStore();

  return {
    openChat: open,
    closeChat: close,
    isOpen,
  };
};

/**
 * Direct chat store adapter (non-hook version)
 */
export const chatStoreAdapter = {
  openChat: () => {
    useGlobalChatStore.getState().open();
  },
  closeChat: () => {
    useGlobalChatStore.getState().close();
  },
  isOpen: () => {
    return useGlobalChatStore.getState().isOpen;
  },
};
