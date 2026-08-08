import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { createServerFn } from '@tanstack/react-start'
import { Render } from '@puckeditor/core'
import type { Data } from '@puckeditor/core'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { reportConfig } from '#/components/puck.config'
import { ReportContext } from '@shared/reports/components/ReportContext'
import { getSubmissionById } from '../../server/data'

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
    validateSearch: (search: Record<string, unknown>) => {
        return {
            submissionId: search.submissionId as string | undefined,
            ...search,
        }
    },
    loaderDeps: ({ search }) => ({ submissionId: search.submissionId }),
    loader: async ({ params, deps }) => {
        const config = await loadReport({ data: params.reportId })
        let submissionData = null
        if (deps.submissionId) {
            const idInt = parseInt(deps.submissionId, 10)
            if (!isNaN(idInt)) {
                submissionData = await getSubmissionById({ data: idInt })
            }
        }
        return { config, submissionData }
    },
    head: ({ loaderData, params }) => {
        let title = `Report ${params.reportId} | Runner`
        if (loaderData?.config?.root?.props?.title) {
            title = `${loaderData.config.root.props.title} | Runner`
        }
        return {
            meta: [{ title }]
        }
    },
    component: ReportPage,
})

function ReportPage() {
    const { config, submissionData } = Route.useLoaderData()
    const search = Route.useSearch({ strict: false }) as Record<string, unknown>
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    if (!isMounted) {
        return (
            <main className="page-wrap px-4 pt-14 pb-8 flex items-center justify-center h-[50vh]">
                <p className="text-muted-foreground animate-pulse">Loading report...</p>
            </main>
        )
    }

    if (!config) {
        return (
            <main className="page-wrap px-4 pt-14 pb-8">
                <p className="text-[var(--sea-ink-soft)]">Report not found.</p>
            </main>
        )
    }

    const mergedData = { ...search, ...(submissionData || {}) }

    return (
        <ReportContext.Provider value={mergedData}>
            <main className="page-wrap px-4 pt-14 pb-8">
                <Render config={reportConfig} data={config} />
            </main>
        </ReportContext.Provider>
    )
}
