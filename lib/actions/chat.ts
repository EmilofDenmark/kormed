'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sanitizePlainText } from '@/lib/sanitize'
import { checkRateLimit } from '@/lib/rateLimit'
import { sendMessageSchema } from '@/lib/validation/chat'
import type { ActionResult } from './auth'

export async function sendMessage(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = sendMessageSchema.safeParse({
    conversationId: formData.get('conversationId'),
    body: formData.get('body'),
  })
  if (!parsed.success) {
    return { success: false, error: 'Skriv venligst en besked.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Du skal være logget ind.' }

  const allowed = await checkRateLimit(`chat-message:${user.id}`, 30, 60)
  if (!allowed) return { success: false, error: 'Du sender beskeder for hurtigt. Vent lidt og prøv igen.' }

  const { data: conversation } = await supabase
    .from('conversations')
    .select('driver_id, passenger_id')
    .eq('id', parsed.data.conversationId)
    .single()
  if (!conversation) return { success: false, error: 'Samtalen blev ikke fundet.' }

  const { error } = await supabase.from('messages').insert({
    conversation_id: parsed.data.conversationId,
    sender_id: user.id,
    body: sanitizePlainText(parsed.data.body, 2000),
  })
  if (error) return { success: false, error: 'Beskeden kunne ikke sendes. Prøv igen.' }

  const recipientId = conversation.driver_id === user.id ? conversation.passenger_id : conversation.driver_id
  await supabase.rpc('notify', {
    p_user_id: recipientId,
    p_type: 'new_message',
    p_title: 'Ny besked',
    p_body: null,
    p_link: `/beskeder/${parsed.data.conversationId}`,
  })

  revalidatePath(`/beskeder/${parsed.data.conversationId}`)
  return { success: true }
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', user.id)
    .is('read_at', null)
}
