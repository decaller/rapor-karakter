import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { createServerFn } from '@tanstack/react-start'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { db } from '#/db/index'
import { formSubmissions } from '#/db/schema'

// ---------------------------------------------------------------------------
// Server function — load form JSON from shared directory
// ---------------------------------------------------------------------------

function formPath(formId: string) {
    return path.resolve(
        path.dirname(new URL(import.meta.url).pathname),
        '../../../../..',
        'shared/forms/configs',
        `${formId}.json`
    )
}

const loadForm = createServerFn({ method: 'GET' })
    .validator((formId: string) => formId)
    .handler(async ({ data: formId }) => {
        try {
            const raw = await fs.readFile(formPath(formId), 'utf-8')
            return JSON.parse(raw)
        } catch {
            return null
        }
    })

// ---------------------------------------------------------------------------
// Server function — save form submission to database
// ---------------------------------------------------------------------------

const saveFormSubmission = createServerFn({ method: 'POST' })
    .validator((data: { formId: string; reportId?: string | null; reportUrl?: string | null; payload: any }) => data)
    .handler(async ({ data }) => {
        await db.insert(formSubmissions).values({
            formId: data.formId,
            reportId: data.reportId || null,
            reportUrl: data.reportUrl || null,
            data: data.payload,
        })
        return { success: true }
    })

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const Route = createFileRoute('/form/$formId')({
    loader: ({ params }) => loadForm({ data: params.formId }),
    component: FormPage,
})

function FormPage() {
    const params = Route.useParams()
    const data = Route.useLoaderData()
    const [isMounted, setIsMounted] = useState(false)
    const [SurveyUI, setSurveyUI] = useState<any>(null)
    const [surveyModel, setSurveyModel] = useState<any>(null)

    useEffect(() => {
        async function init() {
            if (!data) {
                setIsMounted(true)
                return
            }
            try {
                const { Model } = await import('survey-core')
                const { Survey } = await import('survey-react-ui')
                const model = new Model(data)
                
                let reportId = null;
                if (data.navigateToUrl) {
                    try {
                        const url = new URL(data.navigateToUrl)
                        const parts = url.pathname.split('/')
                        if (parts[1] === 'report' && parts[2]) {
                            reportId = parts[2]
                        }
                    } catch (e) {
                        // ignore invalid url
                    }
                }

                model.onComplete.add(async (sender: any) => {
                    let finalUrl = data.navigateToUrl || null
                    if (finalUrl) {
                        for (const key in sender.data) {
                            const val = sender.data[key]
                            const valStr = val !== null && val !== undefined ? String(val) : ''
                            finalUrl = finalUrl.replace(new RegExp(`\\{${key}\\}`, 'g'), encodeURIComponent(valStr))
                        }
                    }

                    try {
                        await saveFormSubmission({ 
                            data: { 
                                formId: params.formId, 
                                reportId: reportId,
                                reportUrl: finalUrl,
                                payload: sender.data 
                            }
                        })
                        console.log('Form saved successfully')
                    } catch (error) {
                        console.error('Failed to save form:', error)
                    }
                })

                setSurveyModel(model)
                setSurveyUI(() => Survey)
            } catch (e) {
                console.error("Failed to load Survey", e)
            } finally {
                setIsMounted(true)
            }
        }
        init()
    }, [data, params.formId])

    if (!isMounted || (data && (!SurveyUI || !surveyModel))) {
        return (
            <main className="page-wrap px-4 pt-14 pb-8 flex items-center justify-center h-[50vh]">
                <p className="text-muted-foreground animate-pulse">Loading form...</p>
            </main>
        )
    }

    if (!data) {
        return (
            <main className="page-wrap px-4 pt-14 pb-8">
                <p className="text-[var(--sea-ink-soft)]">Form not found.</p>
            </main>
        )
    }

    return (
        <main className="page-wrap px-4 pt-14 pb-8 max-w-4xl mx-auto">
            <SurveyUI model={surveyModel} />
        </main>
    )
}
