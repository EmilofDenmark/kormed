import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/cn'

const base =
  'inline-flex items-center justify-center gap-2 rounded-pill font-medium transition-colors min-h-[44px] px-5 py-2.5 text-[15px] disabled:opacity-50 disabled:pointer-events-none'

const variants = {
  primary: 'bg-brand-dark text-white hover:bg-ink-700',
  secondary: 'bg-brand-green text-white hover:opacity-90',
  outline: 'border border-ink-300 text-brand-dark bg-transparent hover:bg-brand-neutral',
  ghost: 'text-brand-dark hover:bg-brand-neutral',
  danger: 'bg-danger text-white hover:opacity-90',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', fullWidth, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], fullWidth && 'w-full', className)}
      {...props}
    />
  )
})

export function LinkButton({
  href,
  variant = 'primary',
  fullWidth,
  className,
  children,
}: {
  href: string
  variant?: keyof typeof variants
  fullWidth?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <Link href={href} className={cn(base, variants[variant], fullWidth && 'w-full', className)}>
      {children}
    </Link>
  )
}
