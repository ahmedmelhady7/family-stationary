import { restPatch, restSelect, restUpsert } from './rest.ts';

export type ConversationState = {
  sender_phone: string;
  state: 'idle' | 'awaiting_name' | 'awaiting_price' | 'awaiting_image' | 'collecting';
  pending_payload: Record<string, unknown>;
  updated_at?: string;
};

export async function getConversationState(senderPhone: string): Promise<ConversationState | null> {
  const rows = await restSelect(
    'wa_conversations',
    `?sender_phone=eq.${encodeURIComponent(senderPhone)}&select=sender_phone,state,pending_payload,updated_at&limit=1`,
  );

  return rows?.[0] || null;
}

export async function setConversationState(state: ConversationState) {
  const rows = await restUpsert('wa_conversations', state, 'sender_phone');
  return rows?.[0] || null;
}

export async function clearConversationState(senderPhone: string) {
  await restPatch(
    'wa_conversations',
    `?sender_phone=eq.${encodeURIComponent(senderPhone)}`,
    {
      state: 'idle',
      pending_payload: {},
    },
  );
}
