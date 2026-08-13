import { cn } from '@/lib/cn'

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-card border border-ink-300/30 bg-surface p-5 shadow-card', className)}
      {...props}
    />
  )
}
