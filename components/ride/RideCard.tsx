import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { RatingStars } from '@/components/ui/RatingStars'
import { FerryBadge } from './FerryBadge'
import { formatApproxTime, formatDateDaLong, formatDkk } from '@/lib/format'
import type { RideCardData } from '@/lib/rides/enrich'

export function RideCard({ ride, matchNote }: { ride: RideCardData; matchNote?: string }) {
  return (
    <Card className="transition-colors hover:border-brand-green/40">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-brand-dark">
          {ride.origin_name} → {ride.destination_name}
        </h3>
        <span className="text-lg font-semibold text-brand-dark">{formatDkk(ride.seat_price)} <span className="text-sm font-normal text-ink-500">pr. person</span></span>
      </div>

      <p className="mt-1 text-sm text-ink-700">
        {formatDateDaLong(ride.departure_date)} · {formatApproxTime(ride.departure_time)}
      </p>

      {matchNote && <p className="mt-1 text-sm text-brand-green">{matchNote}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {ride.uses_ferry && ride.ferryRoute && (
          <FerryBadge operator={ride.ferryRoute.operator} departurePort={ride.ferryRoute.departure_port} arrivalPort={ride.ferryRoute.arrival_port} />
        )}
        <span className="text-sm text-ink-500">
          {ride.available_seats} {ride.available_seats === 1 ? 'ledig plads' : 'ledige pladser'}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-ink-700">
          <span className="font-medium">{ride.driver?.first_name ?? 'Chauffør'}</span>
          <RatingStars value={ride.driver?.rating_avg ?? 0} count={ride.driver?.rating_count ?? 0} size="sm" />
        </div>
        <Link
          href={`/tur/${ride.id}`}
          className="inline-flex min-h-[40px] items-center rounded-pill bg-brand-dark px-4 text-sm font-medium text-white hover:bg-ink-700"
        >
          Se tur
        </Link>
      </div>
    </Card>
  )
}
