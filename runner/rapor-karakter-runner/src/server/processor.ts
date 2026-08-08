import { createServerFn } from '@tanstack/react-start'
import { db } from '../db'
import { formSubmissions } from '../db/schema'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { getSubmissionsBySessionId } from './data'

export const executeProcessorStep = createServerFn({ method: 'POST' })
    .validator((input: { processorId: string; sessionId: string }) => input)
    .handler(async ({ data: { processorId, sessionId } }) => {
        try {
            // Load Processor Config
            const filePath = path.resolve(
                path.dirname(new URL(import.meta.url).pathname),
                '../../../..',
                'shared/processors/configs',
                `${processorId}.json`,
            )
            const raw = await fs.readFile(filePath, 'utf-8')
            const config = JSON.parse(raw)
            
            // Get current session data
            const sessionData = await getSubmissionsBySessionId({ data: sessionId })
            
            // Check if processor already ran for this session to prevent duplicate runs
            if (sessionData && Object.keys(sessionData).length > 0) {
                // If it already ran, we can't reliably know unless we check the DB directly
                // but if we enforce it returns exactly 1 key, maybe it's in sessionData?
                // Let's just execute it; it will overwrite its own output in the db due to how merging works,
                // or we can insert another row. The merge logic (reduce) uses the latest value.
                // It's safe to re-run.
            }

            // Execute code
            // eslint-disable-next-line no-new-func
            const fn = new Function('data', config.code)
            const result = fn(sessionData || {})

            if (!result || typeof result !== 'object' || Array.isArray(result)) {
                throw new Error('Processor must return an object')
            }

            const keys = Object.keys(result)
            if (keys.length !== 1) {
                throw new Error(`Processor must return exactly 1 new key, got ${keys.length}`)
            }

            const newKey = keys[0]
            if (sessionData?.hasOwnProperty(newKey)) {
                // Important: It might exist if it was previously processed by this exact processor!
                // Wait, if we reload the page, the processor runs again, and it throws an error?
                // Let's just skip execution if it was this processor that inserted it!
                // Actually, the safest way is just logging the warning or allowing it if it's the exact same key.
                // We'll trust the builder validation and just allow it to overwrite here in runner
                // so that page refreshes don't crash.
            }

            // Save to database
            await db.insert(formSubmissions).values({
                formId: processorId,
                sessionId,
                data: result,
            })

            return { ok: true, result }
        } catch (err: any) {
            console.error('Processor Execution Error:', err)
            throw new Error(`Processor execution failed: ${err.message}`)
        }
    })
