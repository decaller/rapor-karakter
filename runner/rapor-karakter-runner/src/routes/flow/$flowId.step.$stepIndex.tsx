import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { getFlowById } from '#/server/flow'
import { getSubmissionsBySessionId } from '#/server/data'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { createServerFn } from '@tanstack/react-start'
import { executeProcessorStep } from '#/server/processor'
import { db } from '#/db/index'
import { formSubmissions } from '#/db/schema'
import { ReportContext } from '@shared/reports/components/ReportContext'
import { Render } from '@puckeditor/core'
import { reportConfig } from '#/components/puck.config'

// Re-use form loader logic from form route
const loadForm = createServerFn({ method: 'GET' })
    .validator((formId: string) => formId)
    .handler(async ({ data: formId }) => {
        try {
            const formPath = path.resolve(process.cwd(), '../../shared/forms/configs', `${formId}.json`)
            const raw = await fs.readFile(formPath, 'utf-8')
            return JSON.parse(raw)
        } catch {
            return null
        }
    })

// Re-use report loader logic
const loadReport = createServerFn({ method: 'GET' })
    .validator((reportId: string) => reportId)
    .handler(async ({ data: reportId }) => {
        try {
            const reportPath = path.resolve(process.cwd(), '../../shared/reports/configs', `${reportId}.json`)
            const raw = await fs.readFile(reportPath, 'utf-8')
            return JSON.parse(raw)
        } catch {
            return null
        }
    })

// Save submission
const saveFormSubmission = createServerFn({ method: 'POST' })
    .validator((data: { formId: string; sessionId: string; payload: any }) => data)
    .handler(async ({ data }) => {
        console.log('=== SAVING FORM SUBMISSION ===', data)
        await db.insert(formSubmissions).values({
            formId: data.formId,
            sessionId: data.sessionId,
            data: data.payload,
        })
        return { success: true }
    })

type StepSearch = {
    sessionId?: string
}

export const Route = createFileRoute('/flow/$flowId/step/$stepIndex')({
    validateSearch: (search: Record<string, unknown>): StepSearch => {
        return { sessionId: search?.sessionId as string | undefined }
    },
    loaderDeps: ({ search }) => ({ sessionId: search.sessionId }),
    beforeLoad: ({ search, params }) => {
        if (!search?.sessionId) {
            // Generate a random session ID and redirect to the same URL with it
            throw redirect({
                to: '/flow/$flowId/step/$stepIndex',
                params: { flowId: params.flowId, stepIndex: params.stepIndex },
                search: { sessionId: crypto.randomUUID() }
            })
        }
    },
    loader: async ({ params, deps }) => {
        const flow = await getFlowById({ data: params.flowId })
        if (!flow) throw new Error('Flow not found')
        
        const stepIndex = parseInt(params.stepIndex, 10)
        if (stepIndex >= flow.steps.length) {
            // Flow complete
            throw redirect({ to: '/flow', search: { success: true } })
        }
        
        const step = flow.steps[stepIndex]
        let stepData = null
        let sessionData = {}

        if (step.type === 'form') {
            stepData = await loadForm({ data: step.id })
            if (deps.sessionId) {
                sessionData = await getSubmissionsBySessionId({ data: deps.sessionId })
            }
        } else if (step.type === 'report') {
            stepData = await loadReport({ data: step.id })
            if (deps.sessionId) {
                sessionData = await getSubmissionsBySessionId({ data: deps.sessionId })
            }
        } else if (step.type === 'processor') {
            stepData = { id: step.id }
        }
        
        return { flow, step, stepIndex, stepData, sessionData }
    },
    component: FlowStepPage,
})

function FlowStepPage() {
    const { flow, step, stepIndex, stepData, sessionData } = Route.useLoaderData()
    const { sessionId } = Route.useSearch()
    const router = useRouter()

    if (!stepData) {
        return <div className="p-8 text-center text-red-500">Step configuration not found for {step.id}</div>
    }

    if (step.type === 'form') {
        return <FlowFormStep 
            formData={stepData} 
            sessionData={sessionData || {}}
            formId={step.id} 
            sessionId={sessionId!} 
            onComplete={() => {
                router.navigate({
                    to: '/flow/$flowId/step/$stepIndex',
                    params: { flowId: flow.id, stepIndex: String(stepIndex + 1) },
                    search: { sessionId }
                })
            }} 
        />
    }

    if (step.type === 'report') {
        return (
            <div className="flex flex-col h-screen overflow-y-auto bg-background">
                <main className="p-8 max-w-4xl mx-auto w-full">
                    <div className="mb-6 flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-foreground">{flow.name} - Step {stepIndex + 1}</h2>
                        <button 
                            onClick={() => {
                                router.navigate({
                                    to: '/flow/$flowId/step/$stepIndex',
                                    params: { flowId: flow.id, stepIndex: String(stepIndex + 1) },
                                    search: { sessionId }
                                })
                            }}
                            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 text-sm font-medium"
                        >
                            Continue to Next Step
                        </button>
                    </div>
                    <div className="bg-card text-card-foreground border border-border shadow rounded-lg p-6 min-h-[500px]">
                        <ReportContext.Provider value={sessionData || {}}>
                            <Render config={reportConfig} data={stepData} />
                        </ReportContext.Provider>
                    </div>
                </main>
            </div>
        )
    }
    
    if (step.type === 'processor') {
        return <FlowProcessorStep 
            processorId={step.id} 
            sessionId={sessionId!} 
            onComplete={() => {
                router.navigate({
                    to: '/flow/$flowId/step/$stepIndex',
                    params: { flowId: flow.id, stepIndex: String(stepIndex + 1) },
                    search: { sessionId }
                })
            }} 
        />
    }

    return <div>Unknown step type</div>
}

function FlowFormStep({ formData, sessionData, formId, sessionId, onComplete }: { formData: any, sessionData: any, formId: string, sessionId: string, onComplete: () => void }) {
    const [isMounted, setIsMounted] = useState(false)
    const [SurveyUI, setSurveyUI] = useState<any>(null)
    const [surveyModel, setSurveyModel] = useState<any>(null)

    useEffect(() => {
        async function init() {
            try {
                const { Model } = await import('survey-core')
                const { Survey } = await import('survey-react-ui')
                const model = new Model(formData)
                
                // Prefill form data from previous steps
                if (sessionData && Object.keys(sessionData).length > 0) {
                    const flattenObject = (obj: any, prefix = '') => {
                        return Object.keys(obj).reduce((acc: any, k) => {
                            const pre = prefix.length ? prefix + '.' : '';
                            if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
                                Object.assign(acc, flattenObject(obj[k], pre + k));
                            } else {
                                acc[pre + k] = obj[k];
                            }
                            return acc;
                        }, {});
                    };
                    const flatData = flattenObject(sessionData);
                    model.data = { ...sessionData, ...flatData };
                }
                
                // apply basic theme...
                model.applyTheme({ themeName: "shadcn", colorPalette: "dark", isPanelless: false, cssVariables: { "--sjs-base-unit": "8px" } })
                
                model.navigateToUrl = "" // disable internal redirect
                
                model.onComplete.add(async (sender: any) => {
                    try {
                        await saveFormSubmission({ 
                            data: { formId, sessionId, payload: sender.data }
                        })
                        onComplete()
                    } catch (error) {
                        console.error('Failed to save form:', error)
                    }
                })

                setSurveyModel(model)
                setSurveyUI(() => Survey)
            } finally {
                setIsMounted(true)
            }
        }
        init()
    }, [formData, formId, sessionId])

    if (!isMounted || !SurveyUI || !surveyModel) {
        return <div className="p-8 text-center text-gray-500">Loading form...</div>
    }

    return (
        <main className="page-wrap px-4 pt-14 pb-8 max-w-4xl mx-auto">
            <SurveyUI model={surveyModel} />
        </main>
    )
}

function FlowProcessorStep({ processorId, sessionId, onComplete }: { processorId: string, sessionId: string, onComplete: () => void }) {
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true
        executeProcessorStep({ data: { processorId, sessionId } })
            .then(() => {
                if (mounted) onComplete()
            })
            .catch((err) => {
                console.error('Processor failed:', err)
                if (mounted) setError(err.message)
            })
        return () => { mounted = false }
    }, [processorId, sessionId, onComplete])

    if (error) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-background">
                <div className="text-destructive mb-4">Error executing processor: {error}</div>
                <button 
                    onClick={() => onComplete()}
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm"
                >
                    Skip and Continue
                </button>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen overflow-y-auto bg-background">
            <main className="p-12 max-w-4xl mx-auto w-full flex flex-col items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-muted-foreground font-medium">Processing Data...</p>
                </div>
            </main>
        </div>
    )
}
