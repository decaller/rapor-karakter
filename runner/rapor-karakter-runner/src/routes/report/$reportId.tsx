import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { Render } from '@puckeditor/core'
import type { Data } from '@puckeditor/core'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { reportConfig } from '#/components/puck.config'

// ---------------------------------------------------------------------------
// Server function — load report JSON from shared directory
// ---------------------------------------------------------------------------

function reportPath(reportId: string) {
    return path.resolve(
        path.dirname(new URL(import.meta.url).pathname),
        '../../../../..',
        'shared/reports/configs',
        `${reportId}.json`
    )
}

const loadReport = createServerFn({ method: 'GET' })
    .validator((reportId: string) => reportId)
    .handler(async ({ data: reportId }) => {
        try {
            const raw = await fs.readFile(reportPath(reportId), 'utf-8')
            return JSON.parse(raw) as Data
        } catch {
            return null
        }
    })

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const Route = createFileRoute('/report/$reportId')({
    loader: ({ params }) => loadReport({ data: params.reportId }),
    component: ReportPage,
})

function ReportPage() {
    const data = Route.useLoaderData()

    if (!data) {
        return (
            <main className="page-wrap px-4 pt-14 pb-8">
                <p className="text-[var(--sea-ink-soft)]">Report not found.</p>
            </main>
        )
    }

    return (
        <main className="page-wrap px-4 pt-14 pb-8">
            <Render config={reportConfig} data={data} />
        </main>
    )
}
