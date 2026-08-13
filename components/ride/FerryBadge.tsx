import { FerryIcon } from '@/components/ui/icons'

export function FerryBadge({ operator, departurePort, arrivalPort }: { operator?: string; departurePort: string; arrivalPort: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill bg-brand-green/10 px-2.5 py-1 text-xs font-medium text-brand-green">
      <FerryIcon width={14} height={14} />
      Via {departurePort}–{arrivalPort}
    </span>
  )
}
