import { useEffect, useState } from 'react'
import { Puck } from '@puckeditor/core'
import type { Data } from '@puckeditor/core'
import '@puckeditor/core/puck.css'
import '../puck-theme.css'
import { reportConfig } from '#/components/puck.config'
import { createServerFn } from '@tanstack/react-start'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { getAllFlows } from '#/lib/workspace'
import { ReportContext } from '@shared/reports/components/ReportContext'

const loadReportFn = createServerFn({ method: 'GET' })
    .validator((reportId: string) => reportId)
    .handler(async ({ data: reportId }) => {
        try {
            const filePath = path.resolve(
                path.dirname(new URL(import.meta.url).pathname),
                '../../../..',
                'shared/reports/configs',
                `${reportId}.json`,
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
            `${reportId}.json`,
        )
        await fs.mkdir(path.dirname(filePath), { recursive: true })
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
        return { ok: true }
    })

export function ReportEditorInline({ reportId }: { reportId: string }) {
    const [data, setData] = useState<Data | null>(null)
    const [selectedFlowId, setSelectedFlowId] = useState<string>('')

    const [flows, setFlows] = useState<any[]>([])

    useEffect(() => {
        getAllFlows().then(setFlows)
    }, [])

    useEffect(() => {
        setData(null)
        loadReportFn({ data: reportId }).then(setData)
    }, [reportId])

    if (!data) return <div className="flex-1 flex items-center justify-center">Loading report...</div>

    const selectedFlow = flows?.find((f: any) => f.id === selectedFlowId)
    
    let previewData = {}
    if (selectedFlow?.testData && Array.isArray(selectedFlow.testData)) {
        previewData = selectedFlow.testData.reduce((acc: any, curr: any) => ({ ...acc, ...curr }), {})
    } else if (selectedFlow?.testData) {
        previewData = selectedFlow.testData
    }

    return (
        <div className="flex-1 flex flex-col relative h-full overflow-hidden">
            <div className="flex-1 relative">
                <div className="absolute inset-0">
                    <ReportContext.Provider value={previewData}>
                        <Puck
                            config={reportConfig}
                            data={data}
                            onPublish={async (newData) => {
                                await saveReportFn({ data: { reportId, data: newData } })
                            }}
                            overrides={{
                                headerActions: ({ children }) => (
                                    <>
                                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
                                            <span className="text-sm font-medium text-foreground whitespace-nowrap">Preview Data:</span>
                                            <select 
                                                value={selectedFlowId}
                                                onChange={(e) => setSelectedFlowId(e.target.value)}
                                                className="text-sm border border-border bg-background text-foreground px-2 py-1 rounded w-[200px]"
                                            >
                                                <option value="">-- None --</option>
                                                {flows?.map((f: any) => (
                                                    <option key={f.id} value={f.id}>{f.name} (Flow)</option>
                                                ))}
                                            </select>
                                        </div>
                                        {children}
                                    </>
                                )
                            }}
                        />
                    </ReportContext.Provider>
                </div>
            </div>
        </div>
    )
}
