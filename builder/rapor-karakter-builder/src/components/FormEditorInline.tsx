import { useEffect, useState } from 'react'
import type { ICreatorOptions } from 'survey-creator-core'
import { SurveyCreator, SurveyCreatorComponent } from 'survey-creator-react'
import { createServerFn } from '@tanstack/react-start'
import { promises as fs } from 'node:fs'
import path from 'node:path'

// THESE ARE NOT NEEDED ANYMORE SINCE IMPORTED IN sytles.css
// import 'survey-core/defaultV2.min.css'
// import 'survey-creator-core/survey-creator-core.min.css'

const defaultCreatorOptions: ICreatorOptions = {
    showLogicTab: true,
    isAutoSave: true,
}

const SurveyCreatorUI = SurveyCreatorComponent as unknown as React.ComponentType<{
    creator: SurveyCreator
    style?: React.CSSProperties
}>

const loadFormFn = createServerFn({ method: 'GET' })
    .validator((formId: string) => formId)
    .handler(async ({ data: formId }) => {
        try {
            const filePath = path.resolve(
                path.dirname(new URL(import.meta.url).pathname),
                '../../../..',
                'shared/forms/configs',
                formId,
                'index.json',
            )
            const raw = await fs.readFile(filePath, 'utf-8')
            return JSON.parse(raw)
        } catch {
            return {}
        }
    })

const saveFormFn = createServerFn({ method: 'POST' })
    .validator((input: { formId: string; data: any }) => input)
    .handler(async ({ data: { formId, data } }) => {
        const filePath = path.resolve(
            path.dirname(new URL(import.meta.url).pathname),
            '../../../..',
            'shared/forms/configs',
            formId,
            'index.json',
        )
        await fs.mkdir(path.dirname(filePath), { recursive: true })
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
        return { ok: true }
    })

export function FormEditorInline({ formId }: { formId: string }) {
    const [creator, setCreator] = useState<SurveyCreator | null>(null)

    useEffect(() => {
        setCreator(null) // clear old creator
        let isMounted = true

        loadFormFn({ data: formId }).then((json) => {
            if (!isMounted) return
            const newCreator = new SurveyCreator(defaultCreatorOptions)
            newCreator.JSON = json
            newCreator.saveSurveyFunc = (saveNo: number, callback: (no: number, isSuccess: boolean) => void) => {
                saveFormFn({ data: { formId, data: newCreator.JSON } })
                    .then(() => callback(saveNo, true))
                    .catch(() => callback(saveNo, false))
            }
            setCreator(newCreator)
        })

        return () => {
            isMounted = false
        }
    }, [formId])

    if (!creator) return <div className="flex-1 flex items-center justify-center">Loading form...</div>

    return (
        <div className="flex-1 flex flex-col relative">
            <div className="absolute inset-0">
                <SurveyCreatorUI creator={creator} />
            </div>
        </div>
    )
}
