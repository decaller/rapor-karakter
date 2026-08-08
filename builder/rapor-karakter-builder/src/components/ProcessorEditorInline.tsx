import { useEffect, useState } from 'react'
import { createServerFn } from '@tanstack/react-start'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { getAllFlows } from '#/lib/workspace'
import Editor from '@monaco-editor/react'
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react'

export type ProcessorConfig = {
    id: string
    name: string
    code: string
}

const loadProcessorFn = createServerFn({ method: 'GET' })
    .validator((processorId: string) => processorId)
    .handler(async ({ data: processorId }) => {
        try {
            const filePath = path.resolve(
                path.dirname(new URL(import.meta.url).pathname),
                '../../../..',
                'shared/processors/configs',
                `${processorId}.json`,
            )
            const raw = await fs.readFile(filePath, 'utf-8')
            return JSON.parse(raw) as ProcessorConfig
        } catch {
            return {
                id: processorId,
                name: processorId,
                code: `// The 'data' variable contains the merged results from previous steps.
// You must return an object with exactly one NEW key.
// 
// Example:
// return {
//   totalScore: (data.score1 || 0) + (data.score2 || 0)
// }

return {
  newKey: "computed value"
}`
            } satisfies ProcessorConfig
        }
    })

const saveProcessorFn = createServerFn({ method: 'POST' })
    .validator((input: { processorId: string; data: ProcessorConfig }) => input)
    .handler(async ({ data: { processorId, data } }) => {
        const filePath = path.resolve(
            path.dirname(new URL(import.meta.url).pathname),
            '../../../..',
            'shared/processors/configs',
            `${processorId}.json`,
        )
        await fs.mkdir(path.dirname(filePath), { recursive: true })
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
        return { ok: true }
    })

export function ProcessorEditorInline({ processorId }: { processorId: string }) {
    const [config, setConfig] = useState<ProcessorConfig | null>(null)
    const [code, setCode] = useState<string>('')
    const [selectedFlowId, setSelectedFlowId] = useState<string>('')
    const [flows, setFlows] = useState<any[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const [previewError, setPreviewError] = useState<string | null>(null)
    const [afterData, setAfterData] = useState<any>(null)

    useEffect(() => {
        getAllFlows().then(setFlows)
    }, [])

    useEffect(() => {
        setConfig(null)
        loadProcessorFn({ data: processorId }).then((loaded) => {
            setConfig(loaded)
            setCode(loaded.code)
        })
    }, [processorId])

    const selectedFlow = flows?.find((f: any) => f.id === selectedFlowId)
    
    let previewData: any = {}
    if (selectedFlow?.testData && Array.isArray(selectedFlow.testData)) {
        previewData = selectedFlow.testData.reduce((acc: any, curr: any) => ({ ...acc, ...curr }), {})
    } else if (selectedFlow?.testData) {
        previewData = selectedFlow.testData
    }

    useEffect(() => {
        if (!code) {
            setPreviewError(null)
            setAfterData(null)
            return
        }

        try {
            // eslint-disable-next-line no-new-func
            const fn = new Function('data', code)
            const result = fn(previewData)

            if (!result || typeof result !== 'object' || Array.isArray(result)) {
                setPreviewError('Processor must return an object')
                setAfterData(null)
                return
            }

            const keys = Object.keys(result)
            if (keys.length !== 1) {
                setPreviewError(`Processor must return exactly 1 new key, but returned ${keys.length} keys: [${keys.join(', ')}]`)
                setAfterData(null)
                return
            }

            const newKey = keys[0]
            if (previewData.hasOwnProperty(newKey)) {
                setPreviewError(`Key "${newKey}" already exists in the previous data. Processors can only add NEW keys.`)
                setAfterData(null)
                return
            }

            setPreviewError(null)
            setAfterData({ ...previewData, ...result })
        } catch (err: any) {
            setPreviewError(err.message)
            setAfterData(null)
        }
    }, [code, previewData])

    const handleSave = async () => {
        if (!config) return
        setIsSaving(true)
        await saveProcessorFn({ data: { processorId, data: { ...config, code } } })
        setIsSaving(false)
    }

    if (!config) return <div className="flex-1 flex items-center justify-center">Loading processor...</div>

    return (
        <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
            {/* Header Toolbar */}
            <div className="flex-none h-12 border-b border-border bg-card flex items-center justify-between px-4">
                <div className="flex items-center gap-4">
                    <span className="font-medium">Processor: {processorId}</span>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Preview with Flow:</span>
                        <select 
                            value={selectedFlowId}
                            onChange={(e) => setSelectedFlowId(e.target.value)}
                            className="text-sm border border-border bg-background text-foreground px-2 py-1 rounded w-[200px]"
                        >
                            <option value="">-- Select a Flow --</option>
                            {flows?.map((f: any) => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 disabled:opacity-50"
                >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save'}
                </button>
            </div>

            {/* Split View */}
            <div className="flex-1 flex overflow-hidden">
                {/* Editor Area */}
                <div className="flex-1 flex flex-col min-w-0 border-r border-border">
                    <div className="p-2 bg-muted/50 border-b border-border text-sm font-medium text-muted-foreground">
                        JavaScript Editor
                    </div>
                    <div className="flex-1 relative">
                        <Editor
                            height="100%"
                            defaultLanguage="javascript"
                            theme="vs-dark"
                            value={code}
                            onChange={(value) => setCode(value || '')}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                wordWrap: 'on',
                                padding: { top: 16 }
                            }}
                        />
                    </div>
                </div>

                {/* Data Preview Area */}
                <div className="w-[400px] flex flex-col bg-card shrink-0">
                    {/* Before Data */}
                    <div className="flex-1 flex flex-col min-h-0 border-b border-border">
                        <div className="p-2 bg-muted/50 border-b border-border text-sm font-medium text-muted-foreground flex justify-between">
                            <span>Data Before (Input)</span>
                        </div>
                        <div className="flex-1 overflow-auto p-4 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm whitespace-pre">
                            {JSON.stringify(previewData, null, 2)}
                        </div>
                    </div>

                    {/* After Data */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="p-2 bg-muted/50 border-b border-border text-sm font-medium flex justify-between items-center">
                            <span className="text-muted-foreground">Data After (Output)</span>
                            {previewError ? (
                                <div className="flex items-center gap-1 text-destructive">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="text-xs">Validation Failed</span>
                                </div>
                            ) : afterData ? (
                                <div className="flex items-center gap-1 text-green-500">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="text-xs">Valid Output</span>
                                </div>
                            ) : null}
                        </div>
                        
                        <div className="flex-1 overflow-auto p-4 bg-[#1e1e1e] font-mono text-sm whitespace-pre relative">
                            {previewError ? (
                                <div className="text-destructive whitespace-pre-wrap">{previewError}</div>
                            ) : (
                                <div className="text-[#d4d4d4]">
                                    {JSON.stringify(afterData || {}, null, 2)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
