import { Badge } from '@/components/ui/Badge'
import { CheckIcon } from '@/components/ui/icons'

/**
 * Spec §6: never call this "identity verified" — only email/phone
 * verification actually happens, no government ID check in the MVP.
 */
export function VerificationStatus({ emailVerified, phoneVerified }: { emailVerified: boolean; phoneVerified: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge tone={emailVerified ? 'green' : 'neutral'}>
        {emailVerified && <CheckIcon width={14} height={14} />}
        E-mail {emailVerified ? 'verificeret' : 'ikke verificeret'}
      </Badge>
      {phoneVerified && (
        <Badge tone="green">
          <CheckIcon width={14} height={14} />
          Telefon verificeret
        </Badge>
      )}
    </div>
  )
}
