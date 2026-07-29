import { useEffect, useState } from 'react'
import { Puck } from '@puckeditor/core'
import type { Data } from '@puckeditor/core'
import '@puckeditor/core/puck.css'
import { reportConfig } from '#/components/puck.config'
import { createServerFn } from '@tanstack/react-start'
import { promises as fs } from 'node:fs'
import path from 'node:path'

const loadReportFn = createServerFn({ method: 'GET' })
    .validator((reportId: string) => reportId)
    .handler(async ({ data: reportId }) => {
        try {
            const filePath = path.resolve(
                path.dirname(new URL(import.meta.url).pathname),
                '../../../..',
                'shared/reports/configs',
                reportId,
                'index.json',
            )
            const raw = await fs.readFile(filePath, 'utf-8')
            return JSON.parse(raw) as Data
        } catch {
            return { content: [], root: { props: {} } } satisfies Data
        }
    })

const saveReportFn = createServerFn({ method: 'POST' })
    .validator((input: { reportId: string; data: Data }) => input)
    .handler(async ({ data: { reportId, data } }) => {
        const filePath = path.resolve(
            path.dirname(new URL(import.meta.url).pathname),
            '../../../..',
            'shared/reports/configs',
            reportId,
            'index.json',
        )
        await fs.mkdir(path.dirname(filePath), { recursive: true })
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
        return { ok: true }
    })

export function ReportEditorInline({ reportId }: { reportId: string }) {
    const [data, setData] = useState<Data | null>(null)

    useEffect(() => {
        setData(null)
        loadReportFn({ data: reportId }).then(setData)
    }, [reportId])

    if (!data) return <div className="flex-1 flex items-center justify-center">Loading report...</div>

    return (
        <div className="flex-1 flex flex-col relative">
            {/* The absolute positioning ensures Puck takes the remaining height inside the flex-1 container */}
            <div className="absolute inset-0">
                <Puck
                    config={reportConfig}
                    data={data}
                    onPublish={async (newData) => {
                        await saveReportFn({ data: { reportId, data: newData } })
                    }}
                />
            </div>
        </div>
    )
}
