import { cn } from '@/lib/cn'

const inputBase =
  'w-full min-h-[44px] rounded-xl border border-ink-300/50 bg-surface px-4 py-2.5 text-[15px] text-brand-dark placeholder:text-ink-500 focus:border-brand-green'

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('mb-1.5 block text-sm font-medium text-ink-700', className)} {...props} />
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputBase, className)} {...props} />
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputBase, 'min-h-[96px] resize-y', className)} {...props} />
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(inputBase, 'appearance-none bg-no-repeat', className)} {...props} />
}

export function FieldError({ children }: { children?: string | null }) {
  if (!children) return null
  return <p className="mt-1.5 text-sm text-danger">{children}</p>
}

export function HelpText({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-sm text-ink-500">{children}</p>
}
