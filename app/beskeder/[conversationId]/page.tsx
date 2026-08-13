import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireProfile } from '@/lib/session'
import { createClient } from '@/lib/supabase/server'
import { markConversationRead } from '@/lib/actions/chat'
import { ChatThread } from '@/components/chat/ChatThread'

export const metadata: Metadata = { title: 'Samtale', robots: { index: false } }

export default async function ConversationPage({ params }: { params: { conversationId: string } }) {
  const profile = await requireProfile('/log-ind')
  const supabase = await createClient()

  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, driver_id, passenger_id, booking_id')
    .eq('id', params.conversationId)
    .single()
  if (!conversation) notFound()

  const counterpartId = conversation.driver_id === profile.id ? conversation.passenger_id : conversation.driver_id
  const { data: counterpart } = await supabase.from('public_profiles').select('first_name, public_id').eq('id', counterpartId).single()

  const { data: messages } = await supabase
    .from('messages')
    .select('id, sender_id, body, created_at')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: true })

  await markConversationRead(conversation.id)

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-brand-dark">{counterpart?.first_name ?? 'Samtale'}</h1>
        <Link href="/beskeder" className="text-sm text-ink-500 underline">Alle samtaler</Link>
      </div>
      <p className="mb-4 text-xs text-ink-500">
        Del aldrig kodeord, kortoplysninger eller andre følsomme oplysninger her. I aftaler selv præcist mødested.
      </p>
      <ChatThread conversationId={conversation.id} currentUserId={profile.id} initialMessages={messages ?? []} />
    </div>
  )
}
