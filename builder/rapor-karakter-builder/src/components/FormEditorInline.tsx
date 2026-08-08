import { useEffect, useState } from 'react'
import type { ICreatorOptions } from 'survey-creator-core'
import { SurveyCreator, SurveyCreatorComponent } from 'survey-creator-react'
import { createServerFn } from '@tanstack/react-start'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { useTheme } from './theme-provider'
import { DefaultDark } from "survey-creator-core/themes"
import { registerCreatorTheme } from "survey-creator-core"

// Register the dark theme globally
registerCreatorTheme(DefaultDark)

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
                `${formId}.json`,
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
            `${formId}.json`,
        )
        await fs.mkdir(path.dirname(filePath), { recursive: true })
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
        return { ok: true }
    })

export function FormEditorInline({ formId }: { formId: string }) {
    const [creator, setCreator] = useState<SurveyCreator | null>(null)
    const { theme } = useTheme()

    // Sync theme to creator whenever it changes
    useEffect(() => {
        if (creator) {
            const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
            if (isDark) {
                if (typeof creator.applyCreatorTheme === 'function') {
                    creator.applyCreatorTheme(DefaultDark)
                } else {
                    creator.theme = 'defaultV2Dark'
                }
            } else {
                creator.theme = 'defaultV2'
            }
        }
    }, [theme, creator])

    useEffect(() => {
        setCreator(null) // clear old creator
        let isMounted = true

        loadFormFn({ data: formId }).then((json) => {
            if (!isMounted) return
            const newCreator = new SurveyCreator(defaultCreatorOptions)
            const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
            if (isDark) {
                if (typeof newCreator.applyCreatorTheme === 'function') {
                    newCreator.applyCreatorTheme(DefaultDark)
                } else {
                    newCreator.theme = 'defaultV2Dark'
                }
            } else {
                newCreator.theme = 'defaultV2'
            }
            newCreator.JSON = json
            newCreator.saveSurveyFunc = (saveNo: number, callback: (no: number, isSuccess: boolean) => void) => {
                const surveyData = newCreator.JSON;

                // Automate passing data to the navigateToUrl
                if (surveyData.navigateToUrl) {
                    try {
                        const questions = newCreator.survey.getAllQuestions();
                        const queryParts = questions.map((q: any) => `${encodeURIComponent(q.name)}={${q.name}}`);
                        
                        if (queryParts.length > 0) {
                            const baseUrl = surveyData.navigateToUrl.split('?')[0];
                            surveyData.navigateToUrl = `${baseUrl}?${queryParts.join('&')}`;
                            // Update the creator UI
                            newCreator.JSON = surveyData;
                        }
                    } catch (error) {
                        console.error('Failed to parse and update navigateToUrl', error);
                    }
                }

                saveFormFn({ data: { formId, data: surveyData } })
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
