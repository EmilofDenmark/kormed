import { cn } from '@/lib/cn'

const tones = {
  neutral: 'bg-brand-neutral text-brand-dark',
  green: 'bg-brand-green/10 text-brand-green',
  dark: 'bg-brand-dark text-white',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
}

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: keyof typeof tones
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-xs font-medium',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  )
}
