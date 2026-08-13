'use client'

import { useEffect, useMemo, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { createRide } from '@/lib/actions/rides'
import type { ActionResult } from '@/lib/actions/auth'
import { computeMaxContribution, isSeatPriceWithinCap, type PricingSettings } from '@/lib/pricing/costSharing'
import { PlaceAutocomplete, type PlaceValue } from '@/components/search/PlaceAutocomplete'
import { Label, Input, Select, Textarea, HelpText } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { formatDkk, timeFlexibilityLabels, luggageLabels, petsLabels } from '@/lib/format'
import type { FerryRouteOption } from '@/components/search/FilterForm'

const initialState: ActionResult = { success: false }
const STEPS = ['Rute', 'Færge', 'Pladser og pris'] as const

export function CreateRideWizard({ ferryRoutes, pricingSettings }: { ferryRoutes: FerryRouteOption[]; pricingSettings: PricingSettings }) {
  const [step, setStep] = useState(0)
  const [state, formAction] = useFormState(createRide, initialState)

  const [origin, setOrigin] = useState<PlaceValue | null>(null)
  const [destination, setDestination] = useState<PlaceValue | null>(null)
  const [route, setRoute] = useState<{ distanceKm: number; durationMinutes: number } | null>(null)

  const [usesFerry, setUsesFerry] = useState(false)

  const [availableSeats, setAvailableSeats] = useState(3)
  const [directCostEstimateDkk, setDirectCostEstimateDkk] = useState('')
  const [ferryCostDkk, setFerryCostDkk] = useState('')
  const [tollCostDkk, setTollCostDkk] = useState('')
  const [seatPriceDkk, setSeatPriceDkk] = useState('')

  useEffect(() => {
    if (!origin || !destination) {
      setRoute(null)
      return
    }
    let cancelled = false
    fetch('/api/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin: { lat: origin.lat, lng: origin.lng }, destination: { lat: destination.lat, lng: destination.lng } }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && !data.error) setRoute(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [origin, destination])

  const maxContribution = useMemo(() => {
    if (!route) return null
    return computeMaxContribution({
      distanceKm: route.distanceKm,
      seatsOffered: availableSeats,
      directCostEstimateDkk: directCostEstimateDkk ? Number(directCostEstimateDkk) : null,
      ferryCostDkk: ferryCostDkk ? Number(ferryCostDkk) : null,
      tollCostDkk: tollCostDkk ? Number(tollCostDkk) : null,
      settings: pricingSettings,
    })
  }, [route, availableSeats, directCostEstimateDkk, ferryCostDkk, tollCostDkk, pricingSettings])

  const priceOverCap =
    maxContribution != null && seatPriceDkk !== '' && !isSeatPriceWithinCap(Number(seatPriceDkk), maxContribution.maxContributionPerPassengerDkk)

  const step1Complete = !!origin && !!destination

  return (
    <form action={formAction} className="space-y-6">
      <ol className="flex gap-2 text-sm">
        {STEPS.map((label, i) => (
          <li key={label} className={`flex-1 rounded-pill px-3 py-1.5 text-center font-medium ${i === step ? 'bg-brand-dark text-white' : 'bg-brand-neutral text-ink-500'}`}>
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {/* Step 1 — Rute */}
      <section className={step === 0 ? 'block space-y-4' : 'hidden'} aria-hidden={step !== 0}>
        <Card className="space-y-4">
          <PlaceAutocomplete label="Fra" name="origin" required onChange={setOrigin} />
          <PlaceAutocomplete label="Til" name="destination" required onChange={setDestination} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="departureDate">Afgangsdato</Label>
              <Input id="departureDate" name="departureDate" type="date" required />
            </div>
            <div>
              <Label htmlFor="departureTime">Ca. afgangstidspunkt</Label>
              <Input id="departureTime" name="departureTime" type="time" required />
            </div>
          </div>
          <div>
            <Label htmlFor="timeFlexibility">Fleksibilitet</Label>
            <Select id="timeFlexibility" name="timeFlexibility" defaultValue="exact">
              {Object.entries(timeFlexibilityLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </div>
          {route && (
            <p className="text-sm text-ink-500">
              Beregnet distance: ca. {route.distanceKm} km ({Math.round(route.durationMinutes / 60)} t {route.durationMinutes % 60} min)
            </p>
          )}
        </Card>
      </section>

      {/* Step 2 — Færge */}
      <section className={step === 1 ? 'block space-y-4' : 'hidden'} aria-hidden={step !== 1}>
        <Card className="space-y-4">
          <label className="flex min-h-[44px] items-center gap-3 text-sm font-medium text-brand-dark">
            <input type="checkbox" name="usesFerry" className="h-4 w-4" checked={usesFerry} onChange={(e) => setUsesFerry(e.target.checked)} />
            Sejler du med færge på turen?
          </label>

          {usesFerry && (
            <div className="space-y-4 border-l-2 border-brand-green/30 pl-4">
              <div>
                <Label htmlFor="ferryRouteId">Færgerute</Label>
                <Select id="ferryRouteId" name="ferryRouteId" required={usesFerry}>
                  <option value="">Vælg færgerute…</option>
                  {ferryRoutes.map((f) => (
                    <option key={f.id} value={f.id}>{f.operator}: {f.departure_port} → {f.arrival_port}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="ferryDepartureTime">Færgeafgang (valgfrit)</Label>
                <Input id="ferryDepartureTime" name="ferryDepartureTime" type="time" />
              </div>
              <div>
                <Label htmlFor="ferryNotes">Noter om færgen (valgfrit)</Label>
                <Textarea id="ferryNotes" name="ferryNotes" maxLength={300} placeholder="Fx: Kører direkte efter færgen." />
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* Step 3 — Pladser og pris */}
      <section className={step === 2 ? 'block space-y-4' : 'hidden'} aria-hidden={step !== 2}>
        <Card className="space-y-4">
          <div>
            <Label htmlFor="availableSeats">Ledige pladser</Label>
            <Select id="availableSeats" name="availableSeats" value={availableSeats} onChange={(e) => setAvailableSeats(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>{n}</option>)}
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="luggageOption">Bagage</Label>
              <Select id="luggageOption" name="luggageOption" defaultValue="almindelig">
                {Object.entries(luggageLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="petsOption">Kæledyr</Label>
              <Select id="petsOption" name="petsOption" defaultValue="nej">
                {Object.entries(petsLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </Select>
            </div>
          </div>
          <label className="flex min-h-[44px] items-center gap-3 text-sm text-brand-dark">
            <input type="checkbox" name="smoking" className="h-4 w-4" />
            Rygning tilladt i bilen
          </label>
          <div>
            <Label htmlFor="comment">Kommentar (valgfrit)</Label>
            <Textarea id="comment" name="comment" maxLength={500} placeholder="Fx hvor du kan samle op undervejs." />
          </div>
        </Card>

        <Card className="space-y-4">
          <h3 className="font-semibold text-brand-dark">Omkostninger og pris</h3>
          <p className="text-sm text-ink-500">
            Prisen må kun dække din passagers andel af omkostningerne ved den tur, du allerede skal køre.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="directCostEstimateDkk">Brændstof/el (kr., valgfrit)</Label>
              <Input id="directCostEstimateDkk" name="directCostEstimateDkk" type="number" min={0} step="1" value={directCostEstimateDkk} onChange={(e) => setDirectCostEstimateDkk(e.target.value)} />
              <HelpText>Angiv, eller lad stå tomt for et vejledende estimat ud fra distancen.</HelpText>
            </div>
            <div>
              <Label htmlFor="ferryCostDkk">Færgeudgift (kr., valgfrit)</Label>
              <Input id="ferryCostDkk" name="ferryCostDkk" type="number" min={0} step="1" value={ferryCostDkk} onChange={(e) => setFerryCostDkk(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="tollCostDkk">Bro/vejafgift (kr., valgfrit)</Label>
              <Input id="tollCostDkk" name="tollCostDkk" type="number" min={0} step="1" value={tollCostDkk} onChange={(e) => setTollCostDkk(e.target.value)} />
            </div>
          </div>

          {maxContribution && (
            <div className="rounded-xl bg-brand-neutral/60 p-4 text-sm text-brand-dark">
              Vejledende maksimalt bidrag pr. passager: <strong>{formatDkk(maxContribution.maxContributionPerPassengerDkk)}</strong>
              <span className="block text-ink-500">Baseret på {formatDkk(maxContribution.totalDirectCostDkk)} delt mellem {maxContribution.totalPeopleInCar} personer i bilen.</span>
            </div>
          )}

          <div>
            <Label htmlFor="seatPriceDkk">Pris pr. passager (kr.)</Label>
            <Input id="seatPriceDkk" name="seatPriceDkk" type="number" min={0} step="1" required value={seatPriceDkk} onChange={(e) => setSeatPriceDkk(e.target.value)} />
            {priceOverCap && (
              <p className="mt-1.5 text-sm text-danger" role="alert">
                Prisen er højere end det maksimale bidrag, der kan angives for denne tur.
              </p>
            )}
          </div>
        </Card>
      </section>

      {state.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}

      <div className="flex justify-between gap-3">
        {step > 0 ? (
          <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>Tilbage</Button>
        ) : <span />}

        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={() => setStep((s) => s + 1)} disabled={step === 0 && !step1Complete}>
            Næste
          </Button>
        ) : (
          <SubmitButton disabled={priceOverCap} />
        )}
      </div>
    </form>
  )
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending || disabled}>
      {pending ? 'Opretter tur…' : 'Opret tur'}
    </Button>
  )
}
