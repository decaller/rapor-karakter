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
    head: ({ loaderData, params }) => {
        let title = `Form ${params.formId} | Runner`
        if (loaderData?.title) {
            title = `${loaderData.title} | Runner`
        }
        return {
            meta: [{ title }]
        }
    },
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
                
                const shadcnSurveyTheme = {
                    themeName: "shadcn",
                    colorPalette: "dark",
                    isPanelless: false,
                    cssVariables: {
                        "--sjs-general-backcolor": "var(--background)",
                        "--sjs-general-backcolor-dim": "transparent",
                        "--sjs-general-backcolor-dark": "var(--background)",
                        "--sjs-general-dim-forecolor": "var(--muted-foreground)",
                        "--sjs-general-forecolor": "var(--foreground)",
                        "--sjs-primary-backcolor": "var(--primary)",
                        "--sjs-primary-backcolor-light": "var(--muted)",
                        "--sjs-primary-forecolor": "var(--primary-foreground)",
                        "--sjs-primary-forecolor-light": "var(--primary-foreground)",
                        "--sjs-base-unit": "8px",
                        "--sjs-corner-radius": "calc(var(--radius) - 2px)",
                        "--sjs-secondary-backcolor": "var(--secondary)",
                        "--sjs-secondary-backcolor-semi-light": "var(--secondary)",
                        "--sjs-secondary-forecolor": "var(--secondary-foreground)",
                        "--sjs-shadow-small": "0 0 0 1px var(--border)",
                        "--sjs-shadow-medium": "0 0 0 1px var(--border)",
                        "--sjs-shadow-large": "0 0 0 1px var(--border)",
                        "--sjs-shadow-inner": "0 0 0 1px var(--border)",
                        "--sjs-border-light": "var(--border)",
                        "--sjs-border-default": "var(--border)",
                        "--sjs-border-inside": "var(--border)",
                        "--sjs-font-editorfont-color": "var(--foreground)",
                        "--sjs-font-editorfont-placeholdercolor": "var(--muted-foreground)",
                        "--sjs-font-questiontitle-color": "var(--foreground)",
                        "--sjs-font-pagedescription-color": "var(--muted-foreground)",
                        "--sjs-font-surveytitle-color": "var(--foreground)",
                        "--sjs-font-surveydescription-color": "var(--muted-foreground)",
                        "--sjs-question-background": "var(--card)",
                        "--sjs-questionpanel-backcolor": "var(--card)",
                        "--sjs-questionpanel-hovercolor": "var(--accent)",
                        "--sjs-questionpanel-cornerRadius": "var(--radius)",
                        "--sjs-editor-background": "var(--background)",
                        "--sjs-editorpanel-backcolor": "var(--background)",
                        "--sjs-editorpanel-hovercolor": "var(--accent)",
                        "--sjs-editorpanel-cornerRadius": "var(--radius)",
                        "--sjs-font-family": "var(--font-sans)",
                    }
                };

                if (data.theme) {
                    model.applyTheme(data.theme)
                } else {
                    model.applyTheme(shadcnSurveyTheme)
                }

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
