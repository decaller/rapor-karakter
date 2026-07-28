import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/reportCreator/')({
    component: RouteComponent,
})

function RouteComponent() {
    return (
        <main className="page-wrap px-4 pt-14 pb-8">
            <h1 className="text-2xl font-bold mb-4">Report Templates</h1>
            <p className="mb-6 text-[var(--sea-ink-soft)]">
                Select a report to edit, or create a new one.
            </p>
            <div className="flex gap-3">
                <Link
                    to="/reportCreator/$reportId"
                    params={{ reportId: 'report1' }}
                    className="rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-5 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] no-underline transition hover:-translate-y-0.5"
                >
                    Edit report1
                </Link>
            </div>
        </main>
    )
}
