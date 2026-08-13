'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { acceptBooking, rejectBooking } from '@/lib/actions/bookings'
import { Button } from '@/components/ui/Button'

export function BookingRequestActions({ bookingId }: { bookingId: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        onClick={() => startTransition(async () => { await acceptBooking(bookingId); router.refresh() })}
      >
        Accepter
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() => startTransition(async () => { await rejectBooking(bookingId); router.refresh() })}
      >
        Afvis
      </Button>
    </div>
  )
}
