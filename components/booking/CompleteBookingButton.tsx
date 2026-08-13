'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { completeBooking } from '@/lib/actions/bookings'
import { Button } from '@/components/ui/Button'

export function CompleteBookingButton({ bookingId }: { bookingId: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={() => startTransition(async () => { await completeBooking(bookingId); router.refresh() })}
    >
      Turen er gennemført
    </Button>
  )
}
