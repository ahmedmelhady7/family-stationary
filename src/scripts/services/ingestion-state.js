import { STORAGE_KEYS } from '../config.js';
import { safeJsonParse } from '../utils/dom.js';

export function getConversationState(sender) {
  const state = safeJsonParse(localStorage.getItem(STORAGE_KEYS.waConversations), {});
  return state[sender] || null;
}

export function setConversationState(sender, payload) {
  const state = safeJsonParse(localStorage.getItem(STORAGE_KEYS.waConversations), {});
  state[sender] = {
    ...payload,
    updated_at: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEYS.waConversations, JSON.stringify(state));
}

export function clearConversationState(sender) {
  const state = safeJsonParse(localStorage.getItem(STORAGE_KEYS.waConversations), {});
  delete state[sender];
  localStorage.setItem(STORAGE_KEYS.waConversations, JSON.stringify(state));
}
