'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { updateSetting } from '@/lib/actions/admin'
import type { ActionResult } from '@/lib/actions/auth'
import { Input, Select } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'

const initialState: ActionResult = { success: false }

export function SettingField({
  settingKey,
  label,
  description,
  type,
  value,
  options,
}: {
  settingKey: string
  label: string
  description?: string
  type: 'number' | 'boolean' | 'string' | 'number_array'
  value: number | string | boolean | number[]
  options?: { value: string; label: string }[]
}) {
  const [state, formAction] = useFormState(updateSetting, initialState)

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 border-b border-ink-300/15 py-4 last:border-none">
      <input type="hidden" name="key" value={settingKey} />
      <input type="hidden" name="type" value={type} />
      <div className="flex-1">
        <p className="text-sm font-medium text-brand-dark">{label}</p>
        {description && <p className="text-xs text-ink-500">{description}</p>}
      </div>

      {type === 'boolean' ? (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="value" defaultChecked={Boolean(value)} className="h-4 w-4" />
          Aktiveret
        </label>
      ) : options ? (
        <Select name="value" defaultValue={String(value)} className="w-48">
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      ) : type === 'number_array' ? (
        <Input
          name="value"
          type="text"
          placeholder="25, 50, 100"
          defaultValue={Array.isArray(value) ? value.join(', ') : String(value)}
          className="w-48"
        />
      ) : (
        <Input name="value" type={type === 'number' ? 'number' : 'text'} step="any" defaultValue={String(value)} className="w-32" />
      )}

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <SubmitButton />
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return <Button type="submit" variant="outline" disabled={pending}>{pending ? 'Gemmer…' : 'Gem'}</Button>
}
