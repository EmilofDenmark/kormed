import { LinkButton } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
      <h1 className="mb-2 text-2xl font-semibold text-brand-dark">Siden blev ikke fundet</h1>
      <p className="mb-6 text-ink-500">Siden findes ikke, eller også er den blevet fjernet.</p>
      <LinkButton href="/">Til forsiden</LinkButton>
    </div>
  )
}
