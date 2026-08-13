import { PlaceAutocomplete } from './PlaceAutocomplete'
import { Label, Input } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'

export function SearchForm({
  defaultFrom,
  defaultTo,
  defaultDate,
}: {
  defaultFrom?: string
  defaultTo?: string
  defaultDate?: string
}) {
  return (
    <form method="GET" action="/find-lift" className="grid gap-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
      <PlaceAutocomplete label="Fra" name="fra" placeholder="Fx København" defaultValue={defaultFrom ? { name: defaultFrom, lat: 0, lng: 0 } : null} />
      <PlaceAutocomplete label="Til" name="til" placeholder="Fx Aarhus" defaultValue={defaultTo ? { name: defaultTo, lat: 0, lng: 0 } : null} />
      <div>
        <Label htmlFor="dato">Dato</Label>
        <Input id="dato" name="dato" type="date" defaultValue={defaultDate} />
      </div>
      <Button type="submit" fullWidth className="sm:w-auto">Find lift</Button>
    </form>
  )
}
