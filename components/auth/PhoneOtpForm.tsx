'use client'

import { useEffect, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { requestPhoneOtp, verifyPhoneOtp, type ActionResult } from '@/lib/actions/auth'
import { Label, Input, HelpText } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'

const initialState: ActionResult = { success: false }

export function PhoneOtpForm({ currentPhone }: { currentPhone: string | null }) {
  const [phone, setPhone] = useState(currentPhone ?? '')
  const [otpSent, setOtpSent] = useState(false)
  const [requestState, requestAction] = useFormState(requestPhoneOtp, initialState)
  const [verifyState, verifyAction] = useFormState(verifyPhoneOtp, initialState)

  useEffect(() => {
    if (requestState.success) setOtpSent(true)
  }, [requestState])

  if (!otpSent) {
    return (
      <form action={requestAction} className="space-y-4">
        <div>
          <Label htmlFor="phone">Mobilnummer</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+4512345678"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <HelpText>Vi sender dig en 6-cifret kode via SMS.</HelpText>
        </div>
        {requestState.error && <p className="text-sm text-danger" role="alert">{requestState.error}</p>}
        <RequestSubmit />
      </form>
    )
  }

  return (
    <form action={verifyAction} className="space-y-4">
      <input type="hidden" name="phone" value={phone} />
      <div>
        <Label htmlFor="token">Kode fra SMS</Label>
        <Input id="token" name="token" inputMode="numeric" maxLength={6} required autoFocus />
      </div>
      {verifyState.error && <p className="text-sm text-danger" role="alert">{verifyState.error}</p>}
      <VerifySubmit />
      <button
        type="button"
        onClick={() => setOtpSent(false)}
        className="block w-full text-center text-sm text-ink-500 underline"
      >
        Send en ny kode
      </button>
    </form>
  )
}

function RequestSubmit() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" fullWidth disabled={pending}>
      {pending ? 'Sender kode…' : 'Send kode'}
    </Button>
  )
}

function VerifySubmit() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" fullWidth disabled={pending}>
      {pending ? 'Bekræfter…' : 'Bekræft telefonnummer'}
    </Button>
  )
}
