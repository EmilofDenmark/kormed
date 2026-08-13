'use client'

import { useState, useTransition } from 'react'
import { viewNoticeMessages } from '@/lib/actions/admin'
import { Button } from '@/components/ui/Button'

interface Message {
  id: string
  sender_id: string
  body: string
  created_at: string
}

export function NoticeMessagesViewer({ noticeId }: { noticeId: string }) {
  const [messages, setMessages] = useState<Message[] | null>(null)
  const [pending, startTransition] = useTransition()

  if (messages) {
    return (
      <div className="space-y-2 rounded-xl bg-brand-neutral/40 p-3">
        <p className="text-xs text-ink-500">Denne visning er logget som en administrativ handling.</p>
        {messages.length === 0 ? (
          <p className="text-sm text-ink-500">Ingen beskeder fundet.</p>
        ) : (
          messages.map((m) => (
            <p key={m.id} className="text-sm text-brand-dark">
              <span className="text-ink-500">{new Date(m.created_at).toLocaleString('da-DK')}: </span>
              {m.body}
            </p>
          ))
        )}
      </div>
    )
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={() => startTransition(async () => setMessages((await viewNoticeMessages(noticeId)).messages))}
    >
      Se beskeder i sagen
    </Button>
  )
}
