import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { markAllNotificationsRead } from '@/lib/actions/notifications'
import { BellIcon } from '@/components/ui/icons'

export async function NotificationsMenu({ userId }: { userId: string }) {
  const supabase = await createClient()
  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, type, title, body, link, read_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)

  const hasUnread = (notifications ?? []).some((n) => !n.read_at)

  return (
    <details className="group relative">
      <summary className="relative flex min-h-[44px] cursor-pointer list-none items-center justify-center rounded-full p-2.5 hover:bg-brand-neutral [&::-webkit-details-marker]:hidden">
        <BellIcon />
        {hasUnread && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger" aria-hidden="true" />}
        <span className="sr-only">Notifikationer</span>
      </summary>

      <div className="absolute right-0 z-50 mt-2 w-80 rounded-card border border-ink-300/30 bg-surface p-2 shadow-card">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-sm font-semibold text-brand-dark">Notifikationer</span>
          {hasUnread && (
            <form action={markAllNotificationsRead}>
              <button type="submit" className="text-xs text-brand-green underline">Marker alle som læst</button>
            </form>
          )}
        </div>
        {!notifications || notifications.length === 0 ? (
          <p className="px-2 py-4 text-sm text-ink-500">Ingen notifikationer endnu.</p>
        ) : (
          <ul className="max-h-96 divide-y divide-ink-300/15 overflow-auto">
            {notifications.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.link || '#'}
                  className={`block rounded-lg px-2 py-2.5 text-sm hover:bg-brand-neutral ${!n.read_at ? 'bg-brand-neutral/40' : ''}`}
                >
                  <span className="block font-medium text-brand-dark">{n.title}</span>
                  {n.body && <span className="block text-ink-500">{n.body}</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  )
}
