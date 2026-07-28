import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { Puck } from '@puckeditor/core'
import type { Data } from '@puckeditor/core'
import '@puckeditor/core/puck.css'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { reportConfig } from '#/components/puck.config'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function reportPath(reportId: string) {
    // Resolve path relative to the project root (two levels above src/)
    return path.resolve(
        path.dirname(new URL(import.meta.url).pathname),
        '../../../../..',
        'shared/reports/configs',
        reportId,
        'index.json',
    )
}

// ---------------------------------------------------------------------------
// Server functions
// ---------------------------------------------------------------------------

const loadReport = createServerFn({ method: 'GET' })
    .validator((reportId: string) => reportId)
    .handler(async ({ data: reportId }) => {
        try {
            const raw = await fs.readFile(reportPath(reportId), 'utf-8')
            return JSON.parse(raw) as Data
        } catch {
            // Return empty Puck data if file does not exist yet
            return { content: [], root: { props: {} } } satisfies Data
        }
    })

const saveReport = createServerFn({ method: 'POST' })
    .validator((input: { reportId: string; data: Data }) => input)
    .handler(async ({ data: { reportId, data } }) => {
        const filePath = reportPath(reportId)
        await fs.mkdir(path.dirname(filePath), { recursive: true })
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
        return { ok: true }
    })

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const Route = createFileRoute('/reportCreator/$reportId')({
    loader: ({ params }) => loadReport({ data: params.reportId }),
    component: ReportCreatorPage,
})

function ReportCreatorPage() {
    const { reportId } = Route.useParams()
    const initialData = Route.useLoaderData()

    const handlePublish = async (data: Data) => {
        await saveReport({ data: { reportId, data } })
    }

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Puck
                config={reportConfig}
                data={initialData}
                onPublish={handlePublish}
            />
        </div>
    )
}
