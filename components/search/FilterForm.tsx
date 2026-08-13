import { PlaceAutocomplete } from './PlaceAutocomplete'
import { Label, Input, Select } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'

export interface FerryRouteOption {
  id: string
  operator: string
  departure_port: string
  arrival_port: string
}

export function FilterForm({
  defaultFrom,
  defaultTo,
  defaultDate,
  defaultPassengers,
  defaultFerry,
  defaultFerryRouteId,
  ferryRoutes,
}: {
  defaultFrom?: string
  defaultTo?: string
  defaultDate?: string
  defaultPassengers?: number
  defaultFerry?: boolean
  defaultFerryRouteId?: string
  ferryRoutes: FerryRouteOption[]
}) {
  return (
    <form method="GET" action="/find-lift" className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <PlaceAutocomplete label="Fra" name="fra" defaultValue={defaultFrom ? { name: defaultFrom, lat: 0, lng: 0 } : null} />
        <PlaceAutocomplete label="Til" name="til" defaultValue={defaultTo ? { name: defaultTo, lat: 0, lng: 0 } : null} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="dato">Dato</Label>
          <Input id="dato" name="dato" type="date" defaultValue={defaultDate} />
        </div>
        <div>
          <Label htmlFor="passagerer">Antal passagerer</Label>
          <Select id="passagerer" name="passagerer" defaultValue={String(defaultPassengers ?? 1)}>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex min-h-[44px] items-center gap-2 text-sm text-ink-700">
          <input type="checkbox" name="faerge" value="1" defaultChecked={defaultFerry} className="h-4 w-4" />
          Via færge
        </label>
        <div>
          <Label htmlFor="faergeRuteId">Færgerute</Label>
          <Select id="faergeRuteId" name="faergeRuteId" defaultValue={defaultFerryRouteId ?? ''}>
            <option value="">Alle</option>
            {ferryRoutes.map((f) => (
              <option key={f.id} value={f.id}>
                {f.operator}: {f.departure_port} → {f.arrival_port}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Button type="submit" fullWidth>Søg</Button>
    </form>
  )
}
