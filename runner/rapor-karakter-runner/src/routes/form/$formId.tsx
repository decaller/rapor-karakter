import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { createServerFn } from '@tanstack/react-start'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { Model } from 'survey-core'
import { Survey } from 'survey-react-ui'

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
// Route
// ---------------------------------------------------------------------------

export const Route = createFileRoute('/form/$formId')({
    loader: ({ params }) => loadForm({ data: params.formId }),
    component: FormPage,
})

function FormPage() {
    const data = Route.useLoaderData()
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    if (!isMounted) {
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

    const surveyModel = new Model(data)

    return (
        <main className="page-wrap px-4 pt-14 pb-8 max-w-4xl mx-auto">
            <Survey model={surveyModel} />
        </main>
    )
}
