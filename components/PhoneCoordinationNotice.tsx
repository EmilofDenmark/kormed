/**
 * Vises dér, hvor chauffør og passager skal aftale en tur. Telefonnumre
 * verificeres ikke på siden (der er ikke tilsluttet en SMS-udbyder), så vi
 * opfordrer i stedet brugerne til selv at koordinere via mobil.
 */
export function PhoneCoordinationNotice({ className = '' }: { className?: string }) {
  return (
    <p className={`rounded-xl bg-brand-neutral p-3 text-sm text-brand-dark ${className}`}>
      <strong>Tip:</strong> Vi opfordrer til, at I koordinerer turen via mobil (opkald eller SMS) og ikke kun her
      på siden. Det gør det nemmere at sikre, at I begge er trygge ved aftalen. Telefonnumre bliver ikke
      verificeret af siden — del selv dit nummer i chatten, når I har aftalt turen.
    </p>
  )
}
