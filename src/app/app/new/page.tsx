import { NewPlanForm } from './new-plan-form'

export const metadata = { title: 'Nuevo plan' }

export default function NewPlanPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10 space-y-8">
      <header className="space-y-2">
        <h1 className="font-[var(--font-display)] text-4xl font-semibold tracking-tight">
          Crear un plan
        </h1>
        <p className="text-muted-foreground">
          Tres opciones — la IA arma la ficha en segundos.
        </p>
      </header>
      <NewPlanForm />
    </div>
  )
}
