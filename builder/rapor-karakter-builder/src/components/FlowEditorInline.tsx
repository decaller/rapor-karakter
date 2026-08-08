import { useState, useEffect } from 'react'
import { ArrowUp, ArrowDown, Trash2 } from 'lucide-react'
import { createServerFn } from '@tanstack/react-start'
import { promises as fs } from 'node:fs'
import path from 'node:path'

type FlowStep = {
    type: 'form' | 'report'
    id: string
}

type FlowConfig = {
    id: string
    name: string
    webhook?: string
    steps: FlowStep[]
    testData?: any
}

const loadFlowFn = createServerFn({ method: 'GET' })
    .validator((flowId: string) => flowId)
    .handler(async ({ data: flowId }) => {
        try {
            const filePath = path.resolve(
                path.dirname(new URL(import.meta.url).pathname),
                '../../../..',
                'shared/flows/configs',
                `${flowId}.json`,
            )
            const raw = await fs.readFile(filePath, 'utf-8')
            return JSON.parse(raw) as FlowConfig
        } catch {
            return { id: flowId, name: flowId, steps: [], testData: {} } as FlowConfig
        }
    })

const saveFlowFn = createServerFn({ method: 'POST' })
    .validator((input: { flowId: string; data: FlowConfig }) => input)
    .handler(async ({ data: { flowId, data } }) => {
        const existingData = Array.isArray(data.testData) ? data.testData : []
        const mockData = [...existingData]
        
        let formIndex = 0
        for (const step of data.steps) {
            if (step.type === 'form' && step.id) {
                if (!mockData[formIndex]) {
                    mockData[formIndex] = { _stepId: step.id }
                }
                const formMockData = mockData[formIndex]
                
                try {
                    const formPath = path.resolve(
                        path.dirname(new URL(import.meta.url).pathname),
                        '../../../..',
                        'shared/forms/configs',
                        `${step.id}.json`,
                    )
                    const formRaw = await fs.readFile(formPath, 'utf-8')
                    const formConfig = JSON.parse(formRaw)
                    
                    if (formConfig.pages) {
                        for (const page of formConfig.pages) {
                            if (page.elements) {
                                for (const el of page.elements) {
                                    if (el.name && formMockData[el.name] === undefined) {
                                        let val: any = `Sample ${el.name}`
                                        if (el.type === 'checkbox' || el.type === 'tagbox' || el.type === 'ranking') {
                                            val = el.choices && el.choices.length > 0 ? [(el.choices[0].value || el.choices[0])] : ["Item 1"]
                                        } else if (el.type === 'radiogroup' || el.type === 'dropdown' || el.type === 'imagepicker') {
                                            val = el.choices && el.choices.length > 0 ? (el.choices[0].value || el.choices[0]) : "Item 1"
                                        } else if (el.type === 'boolean') {
                                            val = true
                                        } else if (el.type === 'rating') {
                                            val = 5
                                        } else if (el.type === 'text') {
                                            if (el.inputType === 'number') val = 100
                                            else if (el.inputType === 'date') val = "2026-01-01"
                                        }
                                        formMockData[el.name] = val
                                    }
                                }
                            }
                        }
                    }
                } catch (err) {
                    console.error("Failed to parse form", step.id, err)
                }
                
                formIndex++
            }
        }
        
        // Remove trailing mock data if forms were removed
        if (mockData.length > formIndex) {
            mockData.splice(formIndex)
        }
        
        data.testData = mockData

        const filePath = path.resolve(
            path.dirname(new URL(import.meta.url).pathname),
            '../../../..',
            'shared/flows/configs',
            `${flowId}.json`,
        )
        await fs.mkdir(path.dirname(filePath), { recursive: true })
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
        return { ok: true, generatedData: mockData }
    })

export function FlowEditorInline({ flowId, tree }: { flowId: string, tree: any[] }) {
    const forms: any[] = []
    const reports: any[] = []
    
    const extractItems = (items: any[]) => {
        for (const item of items) {
            if (item.type === 'form') forms.push(item)
            if (item.type === 'report') reports.push(item)
            if (item.children) extractItems(item.children)
        }
    }
    extractItems(tree)
    const [data, setData] = useState<FlowConfig | null>(null)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        setData(null)
        loadFlowFn({ data: flowId }).then(setData)
    }, [flowId])

    const handleSave = async () => {
        if (!data) return
        setSaving(true)
        try {
            const result = await saveFlowFn({ data: { flowId, data } })
            if (result.generatedData) {
                setData(prev => prev ? { ...prev, testData: result.generatedData } : prev)
            }
        } catch (e) {
            console.error(e)
        }
        setSaving(false)
    }

    if (!data) return <div className="flex-1 flex items-center justify-center">Loading flow...</div>

    return (
        <div className="flex-1 flex flex-col h-full bg-background overflow-auto">
            <div className="flex justify-between items-center p-4 bg-card border-b border-border sticky top-0 z-10 shadow-sm">
                <h2 className="text-xl font-semibold text-card-foreground">Flow Editor</h2>
                <button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 font-medium transition-colors"
                >
                    {saving ? 'Saving...' : 'Save Flow'}
                </button>
            </div>
            
            <div className="flex flex-1 flex-col lg:flex-row p-6 gap-6 max-w-7xl mx-auto w-full">
                
                {/* Left side: Settings & Timeline / Steps */}
                <div className="flex-1 flex flex-col gap-8">
                    <div className="flex flex-col gap-4">
                        <h3 className="text-lg font-medium text-foreground border-b border-border pb-2">Steps Sequence</h3>
                    
                    <div className="flex flex-col gap-3">
                        {data.steps.map((step, index) => (
                            <div key={index} className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg shadow-sm">
                                <div className="flex flex-col gap-1">
                                    <button
                                        onClick={() => {
                                            if (index === 0) return
                                            const newSteps = [...data.steps]
                                            const temp = newSteps[index - 1]
                                            newSteps[index - 1] = newSteps[index]
                                            newSteps[index] = temp
                                            setData({ ...data, steps: newSteps })
                                        }}
                                        disabled={index === 0}
                                        className="p-1 rounded bg-muted text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ArrowUp className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (index === data.steps.length - 1) return
                                            const newSteps = [...data.steps]
                                            const temp = newSteps[index + 1]
                                            newSteps[index + 1] = newSteps[index]
                                            newSteps[index] = temp
                                            setData({ ...data, steps: newSteps })
                                        }}
                                        disabled={index === data.steps.length - 1}
                                        className="p-1 rounded bg-muted text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ArrowDown className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex-1 flex gap-4">
                                    <select 
                                        value={step.type}
                                        onChange={(e) => {
                                            const newSteps = [...data.steps]
                                            newSteps[index].type = e.target.value as 'form' | 'report'
                                            setData({ ...data, steps: newSteps })
                                        }}
                                        className="border border-border rounded p-2 text-sm bg-background text-foreground"
                                    >
                                        <option value="form">Form</option>
                                        <option value="report">Report</option>
                                    </select>
                                    <select 
                                        value={step.id} 
                                        onChange={(e) => {
                                            const newSteps = [...data.steps]
                                            newSteps[index].id = e.target.value
                                            setData({ ...data, steps: newSteps })
                                        }}
                                        className="border border-border rounded p-2 text-sm flex-1 bg-background text-foreground"
                                    >
                                        <option value="" disabled>Select {step.type}...</option>
                                        {(step.type === 'form' ? forms : reports).map(item => (
                                            <option key={item.id} value={item.id}>{item.name} ({item.id})</option>
                                        ))}
                                    </select>
                                </div>
                                <button 
                                    onClick={() => {
                                        const newSteps = data.steps.filter((_, i) => i !== index)
                                        setData({ ...data, steps: newSteps })
                                    }}
                                    className="text-destructive hover:bg-destructive/10 p-2 rounded transition-colors"
                                    title="Remove Step"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                    
                    <button 
                        onClick={() => {
                            setData({ ...data, steps: [...data.steps, { type: 'form', id: '' }] })
                        }}
                        className="mt-2 py-3 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-foreground/50 hover:text-foreground font-medium transition-colors"
                    >
                        + Add Step
                    </button>
                    </div>

                    <div className="flex flex-col gap-2 mt-4 p-4 bg-muted/50 rounded-lg border border-border">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            Completion Webhook URL 
                            <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                        </label>
                        <p className="text-xs text-muted-foreground mb-1">Triggered automatically when the flow finishes.</p>
                        <input 
                            type="text" 
                            value={data.webhook || ''} 
                            onChange={e => setData({ ...data, webhook: e.target.value })} 
                            className="border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring w-full"
                            placeholder="https://api.example.com/webhook"
                        />
                    </div>
                </div>

                {/* Right side: Test Data */}
                <div className="flex-1 flex flex-col gap-4">
                    <h3 className="text-lg font-medium text-foreground border-b border-border pb-2">Test Data (Session Context)</h3>
                    <p className="text-sm text-muted-foreground">Provide a JSON object representing the mock answers accumulated across the forms. This will be used to preview reports that are linked to this flow.</p>
                    
                    <textarea 
                        value={data.testData ? JSON.stringify(data.testData, null, 2) : '[\n  \n]'}
                        onChange={(e) => {
                            try {
                                const parsed = JSON.parse(e.target.value)
                                setData({ ...data, testData: parsed })
                            } catch (err) {
                                // Ignore invalid JSON while typing
                            }
                        }}
                        className="w-full flex-1 min-h-[400px] p-4 bg-muted text-foreground font-mono text-sm rounded-lg shadow-inner border border-border focus:ring-2 focus:ring-ring outline-none resize-y"
                        spellCheck={false}
                    />
                </div>

            </div>
        </div>
    )
}
