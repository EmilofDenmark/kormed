export function RatingStars({ value, count, size = 'md' }: { value: number; count?: number; size?: 'sm' | 'md' }) {
  const textSize = size === 'sm' ? 'text-sm' : 'text-base'

  if (!count) {
    return <span className={`${textSize} text-ink-500`}>Ingen bedømmelser endnu</span>
  }

  return (
    <span className={`inline-flex items-center gap-1 ${textSize} text-brand-dark`} aria-label={`${value} ud af 5 stjerner, ${count} bedømmelser`}>
      <span aria-hidden="true" className="text-warning">★</span>
      <span className="font-medium">{value.toFixed(1).replace('.', ',')}</span>
      {typeof count === 'number' && <span className="text-ink-500">({count})</span>}
    </span>
  )
}
