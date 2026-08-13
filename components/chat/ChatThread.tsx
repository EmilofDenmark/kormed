'use client'

import { useEffect, useRef, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { sendMessage } from '@/lib/actions/chat'
import type { ActionResult } from '@/lib/actions/auth'
import { Textarea } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

export interface ChatMessage {
  id: string
  sender_id: string
  body: string
  created_at: string
}

const initialState: ActionResult = { success: false }

export function ChatThread({
  conversationId,
  currentUserId,
  initialMessages,
}: {
  conversationId: string
  currentUserId: string
  initialMessages: ChatMessage[]
}) {
  const [messages, setMessages] = useState(initialMessages)
  const [state, formAction] = useFormState(sendMessage, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const msg = payload.new as ChatMessage
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  useEffect(() => {
    if (state.success) formRef.current?.reset()
  }, [state])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  return (
    <div className="flex h-[70vh] flex-col rounded-card border border-ink-300/20 bg-surface">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && <p className="text-center text-sm text-ink-500">Skriv den første besked.</p>}
        {messages.map((m) => (
          <div key={m.id} className={cn('flex', m.sender_id === currentUserId ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'max-w-[75%] rounded-2xl px-4 py-2 text-sm',
                m.sender_id === currentUserId ? 'bg-brand-dark text-white' : 'bg-brand-neutral text-brand-dark'
              )}
            >
              <p className="whitespace-pre-line">{m.body}</p>
              <p className={cn('mt-1 text-[11px]', m.sender_id === currentUserId ? 'text-white/60' : 'text-ink-500')}>
                {new Date(m.created_at).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form ref={formRef} action={formAction} className="flex items-end gap-2 border-t border-ink-300/20 p-3">
        <input type="hidden" name="conversationId" value={conversationId} />
        <Textarea name="body" maxLength={2000} placeholder="Skriv en besked…" required className="min-h-[44px] flex-1" />
        <SendButton />
      </form>
      {state.error && <p className="px-3 pb-2 text-sm text-danger" role="alert">{state.error}</p>}
    </div>
  )
}

function SendButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? '…' : 'Send'}
    </Button>
  )
}
